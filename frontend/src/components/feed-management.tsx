"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Calculator, Trash2 } from "lucide-react";
import {
  getFeedBatches,
  createFeedBatch,
  calculateFeedBatchCost,
  getFeedBatchUsageStats,
  deleteFeedBatch,
} from "@/lib/api";
import type { FeedBatch, Ingredient, BatchUsageStats } from "@/types";
import { useResourcePermissions, useToastContext } from "@/hooks";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";

// Local partial ingredient type for form input
interface IngredientInput {
  ingredientName: string;
  quantityKg: number;
  totalCost: number;
  supplier: string;
}

export function FeedManagement() {
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [batches, setBatches] = useState<FeedBatch[]>([]);
  const [batchUsageStats, setBatchUsageStats] = useState<BatchUsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Permission checks
  const { canCreate, canDelete } = useResourcePermissions("FEED");
  const toast = useToastContext();

  // Confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    batchId?: number;
    batchName?: string;
  }>({
    show: false,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // New batch form state
  const [newBatch, setNewBatch] = useState({
    batchName: "",
    batchDate: new Date().toISOString().split("T")[0],
    bagSizeKg: 50,
    miscellaneousCost: 0,
    ingredients: [
      { ingredientName: "", quantityKg: 0, totalCost: 0, supplier: "" },
    ] as IngredientInput[],
  });

  // Load data on component mount
  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [batchesData, usageStatsData] = await Promise.all([
        getFeedBatches(),
        getFeedBatchUsageStats(),
      ]);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      setBatchUsageStats(Array.isArray(usageStatsData) ? usageStatsData : []);
    } catch (err) {
      console.error("Failed to load feed data:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load feed data";
      setError(message);
      setBatches([]);
      setBatchUsageStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Use toast for notifications
  const showNotification = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
  ) => {
    if (type === "success") {
      toast.success(`${title}: ${message}`);
    } else if (type === "error") {
      toast.error(`${title}: ${message}`);
    } else {
      toast.warning(`${title}: ${message}`);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!newBatch.batchName.trim()) {
      errors.push("Batch name is required");
    }

    const validIngredients = newBatch.ingredients.filter(
      (ing) => ing.ingredientName && ing.quantityKg > 0 && ing.totalCost > 0,
    );

    if (validIngredients.length === 0) {
      errors.push("At least one valid ingredient is required");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const addIngredient = () => {
    setNewBatch({
      ...newBatch,
      ingredients: [
        ...newBatch.ingredients,
        {
          ingredientName: "",
          quantityKg: 0,
          totalCost: 0,
          supplier: "",
        } as IngredientInput,
      ],
    });
  };

  const removeIngredient = (index: number) => {
    if (newBatch.ingredients.length > 1) {
      const updatedIngredients = newBatch.ingredients.filter(
        (_, i) => i !== index,
      );
      setNewBatch({ ...newBatch, ingredients: updatedIngredients });
    }
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientInput,
    value: string | number,
  ) => {
    const updatedIngredients = newBatch.ingredients.map((ingredient, i) => {
      if (i === index) {
        return { ...ingredient, [field]: value };
      }
      return ingredient;
    });
    setNewBatch({ ...newBatch, ingredients: updatedIngredients });
  };

  const calculateCost = async () => {
    try {
      const validIngredients = newBatch.ingredients.filter(
        (ing) => ing.ingredientName && ing.quantityKg > 0 && ing.totalCost > 0,
      );

      if (validIngredients.length === 0) {
        showNotification(
          "warning",
          "Invalid Ingredients",
          "Please add at least one valid ingredient with name, quantity, and cost.",
        );
        return;
      }

      const ingredientsWithCostPerKg: Ingredient[] = validIngredients.map(
        (ing) => ({
          ...ing,
          costPerKg: ing.quantityKg > 0 ? ing.totalCost / ing.quantityKg : 0,
        }),
      );

      const response = (await calculateFeedBatchCost({
        ingredients: ingredientsWithCostPerKg,
        bagSizeKg: newBatch.bagSizeKg,
        miscellaneousCost: newBatch.miscellaneousCost,
      })) as { data?: Record<string, unknown> };

      setCostEstimate(response?.data || (response as Record<string, unknown>));
    } catch (error) {
      console.error("Failed to calculate cost:", error);
      showNotification(
        "error",
        "Calculation Failed",
        "Failed to calculate cost. Please check your inputs and try again.",
      );
    }
  };

  const handleCreateBatch = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      const validIngredients = newBatch.ingredients.filter(
        (ing) => ing.ingredientName && ing.quantityKg > 0 && ing.totalCost > 0,
      );

      // Compute costPerKg for each ingredient
      const ingredientsWithCostPerKg: Ingredient[] = validIngredients.map(
        (ing) => ({
          ...ing,
          costPerKg: ing.quantityKg > 0 ? ing.totalCost / ing.quantityKg : 0,
        }),
      );

      const payload = {
        batchDate: newBatch.batchDate,
        batchName: newBatch.batchName,
        bagSizeKg: newBatch.bagSizeKg,
        miscellaneousCost: newBatch.miscellaneousCost,
        ingredients: ingredientsWithCostPerKg,
      };

      await createFeedBatch(payload);

      // Reset form and reload data
      setNewBatch({
        batchName: "",
        batchDate: new Date().toISOString().split("T")[0],
        bagSizeKg: 50,
        miscellaneousCost: 0,
        ingredients: [
          {
            ingredientName: "",
            quantityKg: 0,
            totalCost: 0,
            supplier: "",
          } as IngredientInput,
        ],
      });
      setCostEstimate(null);
      setFormErrors([]);
      setShowNewBatch(false);
      await loadFeedData();
      showNotification(
        "success",
        "Batch Created",
        `Feed batch "${newBatch.batchName}" has been created successfully!`,
      );
    } catch (error) {
      console.error("Failed to create batch:", error);
      showNotification(
        "error",
        "Creation Failed",
        "Failed to create batch. Please check your inputs and try again.",
      );
    }
  };

  const handleDeleteBatch = async (batchId: number, batchName: string) => {
    setDeleteConfirm({ show: true, batchId, batchName });
  };

  const confirmDeleteBatch = async () => {
    if (!deleteConfirm.batchId) return;

    try {
      await deleteFeedBatch(deleteConfirm.batchId.toString());
      await loadFeedData();
      showNotification(
        "success",
        "Batch Deleted",
        `Feed batch "${deleteConfirm.batchName}" has been deleted.`,
      );
      setDeleteConfirm({ show: false });
    } catch (error) {
      console.error("Failed to delete batch:", error);
      showNotification(
        "error",
        "Deletion Failed",
        "Failed to delete batch. Please try again.",
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <LoadingSpinner fullPage message="Loading feed management data..." />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Feed Management"
          description="Create and manage feed batches with flexible ingredients"
        />
        <ErrorState
          title="Failed to load feed data"
          message={error}
          onRetry={loadFeedData}
        />
      </div>
    );
  }

  // Build header actions
  const headerActions = canCreate ? (
    <Dialog
      open={showNewBatch}
      onOpenChange={(open) => {
        if (!open) {
          setShowNewBatch(false);
          setCostEstimate(null);
          setNewBatch({
            batchName: "",
            batchDate: new Date().toISOString().split("T")[0],
            bagSizeKg: 50,
            miscellaneousCost: 0,
            ingredients: [
              {
                ingredientName: "",
                quantityKg: 0,
                totalCost: 0,
                supplier: "",
              } as IngredientInput,
            ],
          });
        } else {
          setShowNewBatch(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Feed Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-7xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            Create New Feed Batch
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add ingredients with their quantities and costs to create a new
            batch
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          {/* Basic Batch Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchName">Batch Name</Label>
              <Input
                id="batchName"
                value={newBatch.batchName}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, batchName: e.target.value })
                }
                placeholder="e.g. Layer Feed Batch #001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchDate">Batch Date</Label>
              <Input
                id="batchDate"
                type="date"
                value={newBatch.batchDate}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, batchDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="bagSize">Bag Size (kg)</Label>
              <Input
                id="bagSize"
                type="number"
                step="0.01"
                value={newBatch.bagSizeKg}
                onChange={(e) =>
                  setNewBatch({
                    ...newBatch,
                    bagSizeKg: parseFloat(e.target.value) || 50,
                  })
                }
                placeholder="50.00"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="miscellaneousCost">
                Miscellaneous Expenses (₦)
              </Label>
              <Input
                id="miscellaneousCost"
                type="number"
                step="0.01"
                value={newBatch.miscellaneousCost}
                onChange={(e) =>
                  setNewBatch({
                    ...newBatch,
                    miscellaneousCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Labor, transport, milling, packaging, etc."
              />
              <p className="text-xs text-muted-foreground">
                Include labor, transport, milling, packaging, and other
                processing costs
              </p>
            </div>
          </div>

          <Separator />

          {/* Ingredients Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <h3 className="text-lg font-semibold">Ingredients</h3>
              <Button
                onClick={addIngredient}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </div>

            {newBatch.ingredients.map((ingredient, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label>Ingredient Name</Label>
                    <Input
                      value={ingredient.ingredientName}
                      onChange={(e) =>
                        updateIngredient(
                          index,
                          "ingredientName",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Corn, Soybean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ingredient.quantityKg || ""}
                      onChange={(e) =>
                        updateIngredient(
                          index,
                          "quantityKg",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="500.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cost (₦)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ingredient.totalCost || ""}
                      onChange={(e) =>
                        updateIngredient(
                          index,
                          "totalCost",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="100000.00"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label>Supplier (Optional)</Label>
                    <Input
                      value={ingredient.supplier || ""}
                      onChange={(e) =>
                        updateIngredient(index, "supplier", e.target.value)
                      }
                      placeholder="Lagos Grains Ltd"
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-1">
                    <div className="text-sm text-muted-foreground text-center">
                      {ingredient.quantityKg > 0 &&
                        ingredient.totalCost > 0 && (
                          <div className="font-medium">
                            ₦
                            {(
                              ingredient.totalCost / ingredient.quantityKg
                            ).toFixed(2)}
                            /kg
                          </div>
                        )}
                    </div>
                    {newBatch.ingredients.length > 1 && (
                      <Button
                        onClick={() => removeIngredient(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Button
              onClick={calculateCost}
              variant="outline"
              className="w-full"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Cost Estimate
            </Button>

            {costEstimate && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Cost Estimate</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="text-center sm:text-left">
                      <div className="text-muted-foreground">
                        Total Quantity
                      </div>
                      <div className="font-medium">
                        {Number(costEstimate.totalQuantityTons).toFixed(2)} tons
                        <div className="text-xs text-muted-foreground">
                          ({Number(costEstimate.totalQuantityKg).toFixed(2)} kg)
                        </div>
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="text-muted-foreground">Total Bags</div>
                      <div className="font-medium">
                        {Number(costEstimate.totalBags).toFixed(2)} bags
                        <div className="text-xs text-muted-foreground">
                          @ {Number(costEstimate.bagSizeKg).toFixed(2)}kg each
                        </div>
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="text-muted-foreground">Total Cost</div>
                      <div className="font-medium text-lg">
                        {formatCurrency(Number(costEstimate.totalCost))}
                      </div>
                      {(costEstimate.miscellaneousCost as number) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Ingredients:{" "}
                          {formatCurrency(Number(costEstimate.ingredientsCost))}
                          {" + "}Misc:{" "}
                          {formatCurrency(
                            Number(costEstimate.miscellaneousCost),
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="text-muted-foreground">Cost per Bag</div>
                      <div className="font-medium">
                        {formatCurrency(Number(costEstimate.costPerBag))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ₦{Number(costEstimate.costPerKg).toFixed(2)}/kg
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              onClick={() => {
                setShowNewBatch(false);
                setCostEstimate(null);
                setNewBatch({
                  batchName: "",
                  batchDate: new Date().toISOString().split("T")[0],
                  bagSizeKg: 50,
                  miscellaneousCost: 0,
                  ingredients: [
                    {
                      ingredientName: "",
                      quantityKg: 0,
                      totalCost: 0,
                      supplier: "",
                    },
                  ],
                });
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBatch} className="w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feed Management"
        description="Create and manage feed batches with flexible ingredients"
        actions={headerActions}
      />

      {/* Feed Batches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Feed Batches
          </CardTitle>
          <CardDescription>Manage your feed production batches</CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <EmptyState
              variant="feed"
              title="No feed batches found"
              description="Create your first batch to get started tracking feed."
              actionLabel={canCreate ? "New Feed Batch" : undefined}
              onAction={canCreate ? () => setShowNewBatch(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Batch Name</TableHead>
                    <TableHead className="min-w-[90px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">
                      Total Quantity
                    </TableHead>
                    <TableHead className="min-w-[80px]">Total Bags</TableHead>
                    <TableHead className="min-w-[90px]">
                      Used/Remaining
                    </TableHead>
                    <TableHead className="min-w-[100px]">Usage %</TableHead>
                    <TableHead className="min-w-[100px]">Total Cost</TableHead>
                    <TableHead className="min-w-[80px]">Cost/Bag</TableHead>
                    <TableHead className="min-w-[160px]">Ingredients</TableHead>
                    <TableHead className="min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const usageStats = batchUsageStats.find(
                      (stat) => stat.batchId === batch.id,
                    );
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          {batch.batchName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(batch.batchDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {Number(batch.totalQuantityTons).toFixed(2)} tons
                            </div>
                            <div className="text-muted-foreground text-xs">
                              (
                              {(Number(batch.totalQuantityTons) * 1000).toFixed(
                                2,
                              )}{" "}
                              kg)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {Number(batch.totalBags).toFixed(2)} bags
                            </div>
                            <div className="text-muted-foreground text-xs">
                              @ {Number(batch.bagSizeKg).toFixed(2)}kg each
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {usageStats?.bagsUsed ?? 0} /{" "}
                              {usageStats?.remainingBags ?? batch.totalBags}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Used / Remaining
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {usageStats?.usagePercentage ?? 0}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  (usageStats?.usagePercentage ?? 0) > 90
                                    ? "bg-red-500"
                                    : (usageStats?.usagePercentage ?? 0) > 70
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(usageStats?.usagePercentage ?? 0, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            {formatCurrency(Number(batch.totalCost))}
                            {batch.miscellaneousCost > 0 && (
                              <div className="text-xs text-muted-foreground font-normal">
                                +₦
                                {Number(
                                  batch.miscellaneousCost,
                                ).toLocaleString()}{" "}
                                misc
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatCurrency(Number(batch.costPerBag))}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {batch.ingredients?.map((ingredient, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {ingredient.ingredientName} (
                                {Number(ingredient.quantityKg).toFixed(2)}kg)
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {usageStats?.isNearlyEmpty && (
                              <Badge variant="destructive" className="text-xs">
                                Low Stock
                              </Badge>
                            )}
                            {canDelete && (
                              <Button
                                onClick={() =>
                                  handleDeleteBatch(batch.id, batch.batchName)
                                }
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.show}
        onOpenChange={(open) => !open && setDeleteConfirm({ show: false })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the batch "
              {deleteConfirm.batchName}"? This action cannot be undone and will
              permanently remove all associated ingredients.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ show: false })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteBatch}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Batch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Validation Errors */}
      {formErrors.length > 0 && (
        <Dialog
          open={formErrors.length > 0}
          onOpenChange={(open) => !open && setFormErrors([])}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Form Validation Errors
              </DialogTitle>
              <DialogDescription>
                Please fix the following errors before proceeding:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {formErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-red-600 text-sm"
                >
                  <div className="h-1.5 w-1.5 bg-red-600 rounded-full"></div>
                  {error}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setFormErrors([])}
                className="w-full sm:w-auto"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
