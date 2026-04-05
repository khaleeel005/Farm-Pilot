"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Egg, Plus, Edit, Trash2, MapPin, Users } from "lucide-react";
import type { House } from "@/types";
import {
  useHouses,
  useResourcePermissions,
  useToastContext,
} from "@/hooks";
import { createBirdCost, getBirdCosts } from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  buildHousePayload,
  calculateHouseMetrics,
  createEmptyHouseForm,
  createHouseFormData,
  getHouseOccupancy,
  getHouseStatusColor,
  type HouseFormData,
} from "@/lib/houseManagement";

export function HouseManagement() {
  const {
    houses,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    isMutating,
  } = useHouses();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [deleteConfirmHouse, setDeleteConfirmHouse] = useState<House | null>(
    null,
  );
  const toast = useToastContext();
  const { canCreate, canUpdate, canDelete } = useResourcePermissions("HOUSES");
  const { canCreate: canCreateBirdCost } = useResourcePermissions("COSTS");
  const [formData, setFormData] = useState<HouseFormData>(() =>
    createEmptyHouseForm(),
  );
  const [birdCosts, setBirdCosts] = useState<Array<Record<string, unknown>>>([]);
  const [birdCostsLoading, setBirdCostsLoading] = useState(false);
  const [submittingBirdCost, setSubmittingBirdCost] = useState(false);
  const [birdCostForm, setBirdCostForm] = useState({
    batchDate: new Date().toLocaleDateString("en-CA"),
    birdsPurchased: "",
    costPerBird: "",
    vaccinationCostPerBird: "0",
    expectedLayingMonths: "12",
  });

  const resetForm = useCallback(() => {
    setFormData(createEmptyHouseForm());
    setEditingHouse(null);
  }, []);

  const handleDialogChange = useCallback(
    (open: boolean) => {
      setIsAddDialogOpen(open);

      if (!open) {
        resetForm();
      }
    },
    [resetForm],
  );

  const handleCreateDialogOpen = useCallback(() => {
    resetForm();
    setIsAddDialogOpen(true);
  }, [resetForm]);

  const handleFieldChange = useCallback(
    (field: keyof HouseFormData, value: string) => {
      setFormData((currentFormData) => ({
        ...currentFormData,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.capacity || !formData.initialBirdCount) {
      toast.error("House name, capacity, and initial birds are required.");
      return;
    }

    try {
      const payload = buildHousePayload(formData);

      if (editingHouse) {
        await update(editingHouse.id, payload);
      } else {
        await create(payload);
      }

      handleDialogChange(false);
      toast.success(
        editingHouse
          ? "House updated successfully!"
          : "House created successfully!",
      );
    } catch (saveError) {
      console.error("House save failed", saveError);
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save house. Try again.",
      );
    }
  }, [create, editingHouse, formData, handleDialogChange, toast, update]);

  const handleEdit = (house: House) => {
    setEditingHouse(house);
    setFormData(createHouseFormData(house));
    setIsAddDialogOpen(true);
  };

  const handleDelete = useCallback(async () => {
    if (!deleteConfirmHouse) {
      return;
    }

    try {
      await remove(deleteConfirmHouse.id);
      setDeleteConfirmHouse(null);
      toast.success("House deleted successfully!");
    } catch (deleteError) {
      console.error("Delete failed", deleteError);
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete house. Try again.",
      );
    }
  }, [deleteConfirmHouse, remove, toast]);

  const metrics = useMemo(() => calculateHouseMetrics(houses), [houses]);
  const isFormInvalid =
    !formData.name.trim() ||
    !formData.capacity.trim() ||
    !formData.initialBirdCount.trim();

  const loadBirdCosts = useCallback(async () => {
    try {
      setBirdCostsLoading(true);
      const rows = await getBirdCosts();
      setBirdCosts(rows as unknown as Array<Record<string, unknown>>);
    } catch {
      setBirdCosts([]);
    } finally {
      setBirdCostsLoading(false);
    }
  }, []);

  const handleAddBirdCost = useCallback(async () => {
    try {
      const birdsPurchased = Number.parseInt(birdCostForm.birdsPurchased, 10);
      const costPerBird = Number.parseFloat(birdCostForm.costPerBird);
      const vaccinationCostPerBird = Number.parseFloat(
        birdCostForm.vaccinationCostPerBird,
      );
      const expectedLayingMonths = Number.parseInt(
        birdCostForm.expectedLayingMonths,
        10,
      );

      if (!birdCostForm.batchDate) {
        toast.error("Bird batch date is required.");
        return;
      }
      if (!Number.isInteger(birdsPurchased) || birdsPurchased <= 0) {
        toast.error("Birds purchased must be a positive integer.");
        return;
      }
      if (!Number.isFinite(costPerBird) || costPerBird < 0) {
        toast.error("Cost per bird must be a non-negative number.");
        return;
      }
      if (
        !Number.isFinite(vaccinationCostPerBird) ||
        vaccinationCostPerBird < 0
      ) {
        toast.error("Vaccination cost per bird must be non-negative.");
        return;
      }
      if (!Number.isInteger(expectedLayingMonths) || expectedLayingMonths <= 0) {
        toast.error("Expected laying months must be a positive integer.");
        return;
      }

      setSubmittingBirdCost(true);
      await createBirdCost({
        batchDate: birdCostForm.batchDate,
        birdsPurchased,
        costPerBird,
        vaccinationCostPerBird,
        expectedLayingMonths,
      });

      toast.success("Bird cost added successfully.");
      setBirdCostForm((previous) => ({
        ...previous,
        birdsPurchased: "",
        costPerBird: "",
        vaccinationCostPerBird: "0",
        expectedLayingMonths: "12",
      }));
      await loadBirdCosts();
    } catch (createError) {
      console.error("Failed to create bird cost:", createError);
      toast.error(
        createError instanceof Error
          ? createError.message
          : "Failed to add bird cost.",
      );
    } finally {
      setSubmittingBirdCost(false);
    }
  }, [birdCostForm, loadBirdCosts, toast]);

  useEffect(() => {
    void loadBirdCosts();
  }, [loadBirdCosts]);

  if (loading && houses.length === 0) {
    return <LoadingSpinner fullPage message="Loading houses..." />;
  }

  if (error && houses.length === 0) {
    return (
      <EmptyState
        variant="houses"
        title="Unable to load houses"
        description={error.message || "Please try loading the page again."}
        actionLabel="Try Again"
        onAction={() => {
          void refresh();
        }}
      />
    );
  }

  const headerActions = (
    <Dialog open={isAddDialogOpen} onOpenChange={handleDialogChange}>
      {canCreate && (
        <DialogTrigger asChild>
          <Button onClick={handleCreateDialogOpen}>
            <Plus className="mr-2 h-4 w-4" />
            Add House
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingHouse ? "Edit House" : "Add New House"}
          </DialogTitle>
          <DialogDescription>
            {editingHouse
              ? "Update house information"
              : "Create a new house for your farm"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4">
            <Label htmlFor="houseName">House Name</Label>
            <Input
              id="houseName"
              placeholder="e.g., House 1, Layer House A"
              value={formData.name}
              onChange={(event) =>
                handleFieldChange("name", event.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="500"
                value={formData.capacity}
                onChange={(event) =>
                  handleFieldChange("capacity", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialBirdCount">Initial Birds</Label>
              <Input
                id="initialBirdCount"
                type="number"
                placeholder="500"
                value={formData.initialBirdCount}
                onChange={(event) =>
                  handleFieldChange("initialBirdCount", event.target.value)
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., North Section, Block A"
                value={formData.location}
                onChange={(event) =>
                  handleFieldChange("location", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm"
                value={formData.status}
                onChange={(event) =>
                  handleFieldChange("status", event.target.value)
                }
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional information about this house"
              value={formData.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
              }
            />
          </div>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isFormInvalid || isMutating}
            className="w-full"
          >
            {editingHouse ? "Update House" : "Add House"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Dialog
        open={!!deleteConfirmHouse}
        onOpenChange={(open) => !open && setDeleteConfirmHouse(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete House</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {deleteConfirmHouse?.houseName}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmHouse(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete();
              }}
              disabled={isMutating}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageHeader
        eyebrow="Farm Infrastructure"
        title="House Management"
        description="Manage your farm houses and bird populations"
        actions={headerActions}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Houses
            </CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {metrics.totalHouses}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeHouses} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Capacity
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {metrics.totalCapacity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">birds maximum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Current Population
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {metrics.totalBirds.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.capacityUsage.toFixed(1)}% capacity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Recorded Mortality
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {metrics.totalMortality.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              birds lost across houses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">
            Houses Overview
          </CardTitle>
          <CardDescription>
            Manage all your farm houses and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {houses.length === 0 ? (
            <EmptyState
              variant="houses"
              title="No houses found"
              description="Add your first house to start managing your farm."
              actionLabel={canCreate ? "Add House" : undefined}
              onAction={canCreate ? handleCreateDialogOpen : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>House Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Initial Birds</TableHead>
                  <TableHead>Current Birds</TableHead>
                  <TableHead>Mortality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.map((house) => (
                  <TableRow key={house.id}>
                    <TableCell className="font-medium">
                      {house.houseName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {house.location}
                      </div>
                    </TableCell>
                    <TableCell>{house.capacity.toLocaleString()}</TableCell>
                    <TableCell>{house.initialBirdCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {house.currentBirdCount.toLocaleString()}
                        <Badge variant="outline" className="text-xs">
                          {getHouseOccupancy(house).toFixed(0)}
                          %
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{house.mortalityCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getHouseStatusColor(house.status)}>
                        {house.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(house)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmHouse(house)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">Bird Cost Setup</CardTitle>
          <CardDescription>
            Record bird acquisition and vaccination costs used in cost analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canCreateBirdCost ? (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/70 bg-muted/35 p-3 md:grid-cols-5">
              <div className="space-y-1">
                <Label htmlFor="house-bird-batch-date">Batch Date</Label>
                <Input
                  id="house-bird-batch-date"
                  type="date"
                  value={birdCostForm.batchDate}
                  onChange={(event) =>
                    setBirdCostForm((previous) => ({
                      ...previous,
                      batchDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="house-birds-purchased">Birds</Label>
                <Input
                  id="house-birds-purchased"
                  type="number"
                  min="1"
                  value={birdCostForm.birdsPurchased}
                  onChange={(event) =>
                    setBirdCostForm((previous) => ({
                      ...previous,
                      birdsPurchased: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="house-cost-per-bird">Cost/Bird (₦)</Label>
                <Input
                  id="house-cost-per-bird"
                  type="number"
                  min="0"
                  step="0.01"
                  value={birdCostForm.costPerBird}
                  onChange={(event) =>
                    setBirdCostForm((previous) => ({
                      ...previous,
                      costPerBird: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="house-vaccination-cost">Vaccination/Bird (₦)</Label>
                <Input
                  id="house-vaccination-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={birdCostForm.vaccinationCostPerBird}
                  onChange={(event) =>
                    setBirdCostForm((previous) => ({
                      ...previous,
                      vaccinationCostPerBird: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="house-laying-months">Laying Months</Label>
                <Input
                  id="house-laying-months"
                  type="number"
                  min="1"
                  value={birdCostForm.expectedLayingMonths}
                  onChange={(event) =>
                    setBirdCostForm((previous) => ({
                      ...previous,
                      expectedLayingMonths: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-5">
                <Button
                  onClick={() => {
                    void handleAddBirdCost();
                  }}
                  disabled={submittingBirdCost}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {submittingBirdCost ? "Saving..." : "Add Bird Cost"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You do not have permission to add bird cost entries.
            </p>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Bird Cost Batches</p>
            {birdCostsLoading ? (
              <p className="text-sm text-muted-foreground">Loading bird costs...</p>
            ) : birdCosts.length > 0 ? (
              <div className="space-y-2">
                {birdCosts.slice(0, 5).map((row, index) => (
                  <div
                    key={String(row.id ?? index)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 p-3"
                  >
                    <span className="text-sm font-medium">
                      {String(row.batchDate ?? "-")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Number(row.birdsPurchased || 0).toLocaleString()} birds
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ₦{Number(row.costPerBird || 0).toLocaleString()} / bird
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Number(row.expectedLayingMonths || 0)} months
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bird cost batches yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
