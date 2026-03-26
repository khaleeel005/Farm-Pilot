"use client";

import { useCallback, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CalendarDays,
  Egg,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Users,
  Package,
} from "lucide-react";
import type { BirdBatch, House } from "@/types";
import { useHouses, useResourcePermissions, useToastContext } from "@/hooks";
import { createHouseBatch, getHouseBatches } from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  buildHousePayload,
  calculateHouseMetrics,
  createEmptyBirdBatchForm,
  createEmptyHouseForm,
  createHouseFormData,
  getHouseOccupancy,
  getHouseStatusColor,
  type BirdBatchFormData,
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
  const [batchDialogHouseId, setBatchDialogHouseId] = useState<number | null>(
    null,
  );
  const [houseBatches, setHouseBatches] = useState<BirdBatch[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const toast = useToastContext();
  const { canCreate, canUpdate, canDelete } = useResourcePermissions("HOUSES");
  const [formData, setFormData] = useState<HouseFormData>(() =>
    createEmptyHouseForm(),
  );
  const [batchFormData, setBatchFormData] = useState<BirdBatchFormData>(() =>
    createEmptyBirdBatchForm(new Date().toISOString().split("T")[0]),
  );
  const batchDialogHouse = useMemo(
    () =>
      batchDialogHouseId === null
        ? null
        : (houses.find((house) => house.id === batchDialogHouseId) ?? null),
    [batchDialogHouseId, houses],
  );

  const resetForm = useCallback(() => {
    setFormData(createEmptyHouseForm());
    setEditingHouse(null);
  }, []);

  const resetBatchForm = useCallback(() => {
    setBatchFormData(
      createEmptyBirdBatchForm(new Date().toISOString().split("T")[0]),
    );
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

  const handleBatchFieldChange = useCallback(
    (field: keyof BirdBatchFormData, value: string) => {
      setBatchFormData((currentFormData) => ({
        ...currentFormData,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.capacity) {
      toast.error("House name and capacity are required.");
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

  const loadHouseBatches = useCallback(async (houseId: number) => {
    setBatchLoading(true);
    try {
      const batches = await getHouseBatches(houseId);
      setHouseBatches(batches);
    } finally {
      setBatchLoading(false);
    }
  }, []);

  const openBatchDialog = useCallback(
    async (house: House) => {
      setBatchDialogHouseId(house.id);
      resetBatchForm();
      try {
        await loadHouseBatches(house.id);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load bird batches. Try again.",
        );
      }
    },
    [loadHouseBatches, resetBatchForm, toast],
  );

  const handleBatchDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setBatchDialogHouseId(null);
        setHouseBatches([]);
        resetBatchForm();
      }
    },
    [resetBatchForm],
  );

  const handleCreateBatch = useCallback(async () => {
    if (!batchDialogHouse) {
      return;
    }

    if (
      !batchFormData.batchName.trim() ||
      !batchFormData.placedAt.trim() ||
      !batchFormData.initialBirdCount.trim()
    ) {
      toast.error("Batch name, placement date, and bird count are required.");
      return;
    }

    setBatchSaving(true);
    try {
      await createHouseBatch(batchDialogHouse.id, {
        batchName: batchFormData.batchName.trim(),
        placedAt: batchFormData.placedAt,
        initialBirdCount: Number.parseInt(batchFormData.initialBirdCount, 10),
        notes: batchFormData.notes.trim() || undefined,
      });

      await Promise.all([refresh(), loadHouseBatches(batchDialogHouse.id)]);
      resetBatchForm();
      toast.success("Bird batch added successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create bird batch. Try again.",
      );
    } finally {
      setBatchSaving(false);
    }
  }, [
    batchDialogHouse,
    batchFormData.batchName,
    batchFormData.initialBirdCount,
    batchFormData.notes,
    batchFormData.placedAt,
    loadHouseBatches,
    refresh,
    resetBatchForm,
    toast,
  ]);

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
  const activeBatch = useMemo(
    () => houseBatches.find((batch) => batch.status === "active") ?? null,
    [houseBatches],
  );
  const isFormInvalid = !formData.name.trim() || !formData.capacity.trim();

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
      {/* ── Add / Edit House Dialog ── */}
      <DialogContent className="max-w-xl">
        <DialogHeader className="pb-6 border-b border-border/70">
          <DialogTitle className="text-2xl font-semibold">
            {editingHouse ? "Edit House" : "Add New House"}
          </DialogTitle>
          <DialogDescription className="pt-1.5">
            {editingHouse
              ? "Update house information"
              : "Create a new house for your farm. Bird batches are added after the house is created."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="houseName" className="text-sm font-medium">
              House Name
            </Label>
            <Input
              id="houseName"
              placeholder="e.g., House 1, Layer House A"
              value={formData.name}
              onChange={(event) =>
                handleFieldChange("name", event.target.value)
              }
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-sm font-medium">
              Capacity
            </Label>
            <Input
              id="capacity"
              type="number"
              placeholder="500"
              value={formData.capacity}
              onChange={(event) =>
                handleFieldChange("capacity", event.target.value)
              }
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Bird population is managed through batches, not direct house
              bird-count edits.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., North Section, Block A"
                value={formData.location}
                onChange={(event) =>
                  handleFieldChange("location", event.target.value)
                }
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="status"
                className="h-11 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm"
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

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Notes (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Additional information about this house"
              value={formData.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
              }
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/70">
          <Button
            variant="outline"
            onClick={() => handleDialogChange(false)}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isFormInvalid || isMutating}
            className="min-w-[120px]"
          >
            {editingHouse ? "Update House" : "Add House"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-8">
      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={!!deleteConfirmHouse}
        onOpenChange={(open) => !open && setDeleteConfirmHouse(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="pb-2">
            <DialogTitle>Delete House</DialogTitle>
            <DialogDescription className="pt-1">
              Are you sure you want to delete &quot;
              {deleteConfirmHouse?.houseName}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
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

      <Dialog
        open={batchDialogHouseId !== null}
        onOpenChange={handleBatchDialogChange}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw]">
          {/* FIX: single-column header — no competing flex areas */}
          <DialogHeader className="pb-5 border-b">
            <div className="flex items-center gap-3 flex-wrap">
              <DialogTitle className="text-2xl font-semibold">
                Bird Batches
              </DialogTitle>
              <Badge variant="outline" className="rounded-full px-3">
                {batchDialogHouse?.houseName}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3">
                Capacity: {batchDialogHouse?.capacity.toLocaleString() ?? 0}
              </Badge>
              <Badge
                variant={activeBatch ? "default" : "secondary"}
                className="rounded-full px-3"
              >
                {activeBatch
                  ? `Active: ${activeBatch.batchName}`
                  : "No active batch"}
              </Badge>
            </div>
            <DialogDescription className="pt-1.5">
              {batchDialogHouse
                ? `Track flock cycles for ${batchDialogHouse.houseName}. Mortality entries are applied to the active batch.`
                : "Manage bird batches"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-5">
            {/* Top row: Stats */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 rounded-xl bg-muted/40 px-3 py-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-1.5">
                  <Egg className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Initial
                  </span>
                </div>
                <div className="text-2xl font-semibold">
                  {batchDialogHouse?.initialBirdCount.toLocaleString() ?? 0}
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-muted/40 px-3 py-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-chart-2" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Current
                  </span>
                </div>
                <div className="text-2xl font-semibold">
                  {batchDialogHouse?.currentBirdCount.toLocaleString() ?? 0}
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-muted/40 px-3 py-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Losses
                  </span>
                </div>
                <div className="text-2xl font-semibold">
                  {batchDialogHouse?.mortalityCount.toLocaleString() ?? 0}
                </div>
              </div>
            </div>

            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="timeline">Batch Timeline</TabsTrigger>
                <TabsTrigger value="add-batch">Add Bird Batch</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4 m-0">
                <div className="flex items-center justify-between mt-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-semibold">Batch History</h3>
                    <p className="text-sm text-muted-foreground">
                      Flock history for this house
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {houseBatches.length} batches
                  </Badge>
                </div>

                {houseBatches.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed p-10 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground/60" />
                    <p className="mt-4 text-sm font-medium">No batches yet</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Add a batch to start tracking cycles
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {houseBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          batch.status === "active"
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/60 hover:border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{batch.batchName}</p>
                              {batch.status === "active" && (
                                <Badge className="rounded-full text-[10px]">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span>Placed {batch.placedAt}</span>
                            </div>
                          </div>
                          {batch.status !== "active" && (
                            <Badge
                              variant="outline"
                              className="rounded-full text-xs shrink-0"
                            >
                              Completed
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Initial:{" "}
                            <span className="font-medium text-foreground">
                              {batch.initialBirdCount.toLocaleString()}
                            </span>
                          </span>
                          <span className="text-border">·</span>
                          <span>
                            Current:{" "}
                            <span className="font-medium text-foreground">
                              {batch.currentBirdCount.toLocaleString()}
                            </span>
                          </span>
                          <span className="text-border">·</span>
                          <span>
                            Losses:{" "}
                            <span className="font-medium text-destructive">
                              {batch.mortalityCount.toLocaleString()}
                            </span>
                          </span>
                        </div>

                        {batch.notes && (
                          <p className="mt-3 pt-3 text-sm text-muted-foreground border-t">
                            {batch.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add-batch" className="space-y-4 m-0">
                <div className="rounded-2xl bg-muted/30 p-6 border border-border/50">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Add Bird Batch</h3>
                      <p className="text-xs text-muted-foreground">
                        Start a new flock cycle
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="batchName"
                        className="text-sm font-medium"
                      >
                        Batch Name
                      </Label>
                      <Input
                        id="batchName"
                        placeholder="e.g., April 2026 Layers"
                        value={batchFormData.batchName}
                        onChange={(event) =>
                          handleBatchFieldChange(
                            "batchName",
                            event.target.value,
                          )
                        }
                        className="h-9 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="placedAt"
                          className="text-sm font-medium"
                        >
                          Placement Date
                        </Label>
                        <Input
                          id="placedAt"
                          type="date"
                          value={batchFormData.placedAt}
                          onChange={(event) =>
                            handleBatchFieldChange(
                              "placedAt",
                              event.target.value,
                            )
                          }
                          className="h-9 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="batchInitialBirdCount"
                          className="text-sm font-medium"
                        >
                          Bird Count
                        </Label>
                        <Input
                          id="batchInitialBirdCount"
                          type="number"
                          placeholder="500"
                          value={batchFormData.initialBirdCount}
                          onChange={(event) =>
                            handleBatchFieldChange(
                              "initialBirdCount",
                              event.target.value,
                            )
                          }
                          className="h-9 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="batchNotes"
                        className="text-sm font-medium"
                      >
                        Notes
                      </Label>
                      <Textarea
                        id="batchNotes"
                        placeholder="Source, age, supplier notes..."
                        value={batchFormData.notes}
                        onChange={(event) =>
                          handleBatchFieldChange("notes", event.target.value)
                        }
                        className="min-h-[100px] resize-none rounded-xl"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        void handleCreateBatch();
                      }}
                      disabled={batchSaving || batchLoading}
                      className="h-9 w-full rounded-xl"
                    >
                      {batchSaving ? "Adding..." : "Add Bird Batch"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <PageHeader
        eyebrow="Farm Infrastructure"
        title="House Management"
        description="Manage your farm houses and bird populations"
        actions={headerActions}
      />

      {/* ── Metrics Cards ── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-card/60 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6 relative z-10">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Houses
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner">
              <Egg className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 relative z-10">
            <div className="text-4xl font-bold tracking-tight mt-1 text-foreground">
              {metrics.totalHouses}
            </div>
            <p className="text-xs font-medium text-muted-foreground/80 mt-2 flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-primary/80 animate-pulse" />
              {metrics.activeHouses} active
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-card/60 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-chart-2/40">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-chart-2/10 blur-3xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6 relative z-10">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Capacity
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2 ring-1 ring-chart-2/20 shadow-inner">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 relative z-10">
            <div className="text-4xl font-bold tracking-tight mt-1 text-foreground">
              {metrics.totalCapacity.toLocaleString()}
            </div>
            <p className="text-xs font-medium text-muted-foreground/80 mt-2">
              birds maximum
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-card/60 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-chart-3/40">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-chart-3/10 blur-3xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6 relative z-10">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Population
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3 ring-1 ring-chart-3/20 shadow-inner">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 relative z-10">
            <div className="text-4xl font-bold tracking-tight mt-1 text-foreground">
              {metrics.totalBirds.toLocaleString()}
            </div>
            <p className="text-xs font-medium text-muted-foreground/80 mt-2 flex items-center gap-1.5">
              <span
                className={`flex h-2 w-2 rounded-full ${
                  metrics.capacityUsage > 90
                    ? "bg-destructive/80"
                    : metrics.capacityUsage > 70
                      ? "bg-amber-500/80"
                      : "bg-chart-3/80"
                }`}
              />
              {metrics.capacityUsage.toFixed(1)}% capacity
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-card/60 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-destructive/40">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-destructive/10 blur-3xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6 relative z-10">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recorded Mortality
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20 shadow-inner">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 relative z-10">
            <div className="text-4xl font-bold tracking-tight mt-1 text-foreground">
              {metrics.totalMortality.toLocaleString()}
            </div>
            <p className="text-xs font-medium text-muted-foreground/80 mt-2">
              birds lost across houses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Houses Table ── */}
      <Card className="mt-4 rounded-3xl border-border/50 bg-card/40 shadow-sm backdrop-blur-xl transition-all">
        <CardHeader className="px-7 pt-7 pb-5 border-b border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Houses Overview
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Manage all your farm houses and their details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {houses.length === 0 ? (
            <EmptyState
              variant="houses"
              title="No houses found"
              description="Add your first house to start managing your farm."
              actionLabel={canCreate ? "Add House" : undefined}
              onAction={canCreate ? handleCreateDialogOpen : undefined}
            />
          ) : (
            <div className="rounded-xl border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] px-5">House</TableHead>
                    <TableHead className="hidden min-[600px]:table-cell px-5">
                      Location
                    </TableHead>
                    <TableHead className="text-right px-5">Capacity</TableHead>
                    <TableHead className="hidden lg:table-cell text-right px-5">
                      Initial Birds
                    </TableHead>
                    <TableHead className="text-right px-5">
                      Current Birds
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-right px-5">
                      Mortality
                    </TableHead>
                    <TableHead className="text-center px-5">Status</TableHead>
                    <TableHead className="text-right px-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {houses.map((house) => {
                    const occupancy = getHouseOccupancy(house);
                    return (
                      <TableRow key={house.id} className="group">
                        <TableCell className="font-medium px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span>{house.houseName}</span>
                            <span className="text-xs text-muted-foreground min-[600px]:hidden">
                              {house.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden min-[600px]:table-cell px-5 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {house.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium px-5 py-4">
                          {house.capacity.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-muted-foreground px-5 py-4">
                          {house.initialBirdCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right px-5 py-4">
                          <div className="flex items-center justify-end gap-2.5">
                            <span className="font-medium">
                              {house.currentBirdCount.toLocaleString()}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${
                                occupancy > 90
                                  ? "border-destructive/50 text-destructive bg-destructive/10"
                                  : occupancy > 70
                                    ? "border-amber-500/50 text-amber-600 bg-amber-500/10"
                                    : "border-green-500/50 text-green-600 bg-green-500/10"
                              }`}
                            >
                              {occupancy.toFixed(0)}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-muted-foreground px-5 py-4">
                          {house.mortalityCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center px-5 py-4">
                          <Badge
                            className={`text-xs font-medium ${getHouseStatusColor(house.status)}`}
                          >
                            {house.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Manage bird batches"
                                onClick={() => {
                                  void openBatchDialog(house);
                                }}
                                className="h-9 w-9 p-0"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(house)}
                                className="h-9 w-9 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmHouse(house)}
                                className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
