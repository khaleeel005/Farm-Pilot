"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
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
import { Package, Plus, Calculator, Trash2, Copy } from "lucide-react";
import type { BatchUsageStats, FeedBatch } from "@/types";
import type {
  FeedBatchDeleteConfirm,
  FeedBatchFormData,
  FeedCostEstimate,
  IngredientInput,
} from "@/lib/feedManagement";
import {
  buildFeedBatchPayload,
  buildFeedIngredients,
  createEmptyFeedBatchForm,
  createEmptyIngredientInput,
  extractFeedCostEstimate,
  formatFeedCurrency,
  getUsageBarClassName,
  getValidIngredients,
  validateFeedBatchForm,
} from "@/lib/feedManagement";
import {
  useFeedManagement,
  useResourcePermissions,
  useToastContext,
} from "@/hooks";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";

const EMPTY_DELETE_CONFIRM: FeedBatchDeleteConfirm = { show: false };

interface FeedBatchDialogProps {
  costEstimate: FeedCostEstimate | null;
  formErrors: string[];
  isCalculating: boolean;
  isCreating: boolean;
  newBatch: FeedBatchFormData;
  onAddIngredient: () => void;
  onCalculateCost: () => Promise<void>;
  onClose: () => void;
  onCreateBatch: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onRemoveIngredient: (index: number) => void;
  onUpdateBatch: Dispatch<SetStateAction<FeedBatchFormData>>;
  onUpdateIngredient: (
    index: number,
    field: keyof IngredientInput,
    value: string | number,
  ) => void;
  open: boolean;
}

interface FeedBatchesTableProps {
  batchUsageStats: BatchUsageStats[];
  batches: FeedBatch[];
  canCreate: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onCreateBatch: () => void;
  onDeleteBatch: (batchId: number, batchName: string) => void;
  onDuplicateBatch: (batch: FeedBatch) => void;
}

interface DeleteBatchDialogProps {
  deleteConfirm: FeedBatchDeleteConfirm;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

interface ValidationErrorsDialogProps {
  errors: string[];
  onClose: () => void;
}

function notifyToast(
  toast: ReturnType<typeof useToastContext>,
  type: "error" | "success" | "warning",
  title: string,
  message: string,
) {
  if (type === "success") {
    toast.success(`${title}: ${message}`);
    return;
  }

  if (type === "error") {
    toast.error(`${title}: ${message}`);
    return;
  }

  toast.warning(`${title}: ${message}`);
}

function FeedBatchDialog({
  costEstimate,
  formErrors,
  isCalculating,
  isCreating,
  newBatch,
  onAddIngredient,
  onCalculateCost,
  onClose,
  onCreateBatch,
  onOpenChange,
  onRemoveIngredient,
  onUpdateBatch,
  onUpdateIngredient,
  open,
}: FeedBatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Feed Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[94vh] w-[96vw] max-w-[96vw] sm:max-w-[90vw] lg:max-w-5xl overflow-y-auto p-5 sm:p-7">
        <DialogHeader className="rounded-xl border border-border/70 bg-background/55 p-5 sm:p-6">
          <DialogTitle className="text-lg sm:text-xl">
            Create New Feed Batch
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add ingredients with their quantities and costs to create a new
            batch
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 space-y-6 sm:space-y-7">
          <BatchDetailsSection
            newBatch={newBatch}
            onUpdateBatch={onUpdateBatch}
          />

          <Separator />

          <IngredientInputsSection
            ingredients={newBatch.ingredients}
            onAddIngredient={onAddIngredient}
            onRemoveIngredient={onRemoveIngredient}
            onUpdateIngredient={onUpdateIngredient}
          />

          <CostReviewSection
            costEstimate={costEstimate}
            formErrors={formErrors}
            isCalculating={isCalculating}
            onCalculateCost={onCalculateCost}
          />

          <div className="flex flex-col justify-end gap-3 pt-1 sm:flex-row">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void onCreateBatch();
              }}
              className="w-full sm:w-auto"
              disabled={isCreating}
            >
              <Package className="h-4 w-4 mr-2" />
              {isCreating ? "Creating Batch..." : "Create Batch"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BatchDetailsSection({
  newBatch,
  onUpdateBatch,
}: Pick<FeedBatchDialogProps, "newBatch" | "onUpdateBatch">) {
  return (
    <div className="space-y-5 rounded-xl border border-border/70 bg-background/55 p-5 sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          Step 1
        </p>
        <h3 className="display-heading text-2xl">Batch Details</h3>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <Label htmlFor="batchName">Batch Name</Label>
          <Input
            id="batchName"
            value={newBatch.batchName}
            onChange={(event) =>
              onUpdateBatch((current) => ({
                ...current,
                batchName: event.target.value,
              }))
            }
            placeholder="e.g. Layer Feed Batch #001"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="batchDate">Batch Date</Label>
          <Input
            id="batchDate"
            type="date"
            value={newBatch.batchDate}
            onChange={(event) =>
              onUpdateBatch((current) => ({
                ...current,
                batchDate: event.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="totalBags">Total Bags</Label>
          <Input
            id="totalBags"
            type="number"
            value={newBatch.totalBags}
            onChange={(event) =>
              onUpdateBatch((current) => ({
                ...current,
                totalBags:
                  event.target.value === "" ? "" : Number(event.target.value),
              }))
            }
            placeholder="e.g. 50"
          />
        </div>
        <div className="space-y-3 sm:col-span-2 lg:col-span-4">
          <Label htmlFor="miscellaneousCost">Miscellaneous Expenses (₦)</Label>
          <Input
            id="miscellaneousCost"
            type="number"
            step="0.01"
            value={newBatch.miscellaneousCost}
            onChange={(event) =>
              onUpdateBatch((current) => ({
                ...current,
                miscellaneousCost: Number.parseFloat(event.target.value) || 0,
              }))
            }
            placeholder="Labor, transport, milling, packaging, etc."
          />
          <p className="text-xs text-muted-foreground">
            Include labor, transport, milling, packaging, and other processing
            costs
          </p>
        </div>
      </div>
    </div>
  );
}

function IngredientInputsSection({
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateIngredient,
}: {
  ingredients: IngredientInput[];
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onUpdateIngredient: (
    index: number,
    field: keyof IngredientInput,
    value: string | number,
  ) => void;
}) {
  return (
    <div className="space-y-5 rounded-xl border border-border/70 bg-background/55 p-5 sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          Step 2
        </p>
        <h3 className="display-heading text-2xl">Ingredient Inputs</h3>
        <p className="text-sm text-muted-foreground">
          Enter ingredient source, quantity, and cost for each line item.
        </p>
      </div>

      {ingredients.map((ingredient, index) => (
        <IngredientCard
          key={index}
          index={index}
          ingredient={ingredient}
          ingredientCount={ingredients.length}
          onRemoveIngredient={onRemoveIngredient}
          onUpdateIngredient={onUpdateIngredient}
        />
      ))}

      <div className="flex flex-col justify-center pt-2 sm:flex-row sm:items-center">
        <Button
          onClick={onAddIngredient}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Ingredient
        </Button>
      </div>
    </div>
  );
}

function IngredientCard({
  index,
  ingredient,
  ingredientCount,
  onRemoveIngredient,
  onUpdateIngredient,
}: {
  index: number;
  ingredient: IngredientInput;
  ingredientCount: number;
  onRemoveIngredient: (index: number) => void;
  onUpdateIngredient: (
    index: number,
    field: keyof IngredientInput,
    value: string | number,
  ) => void;
}) {
  return (
    <Card className="border-border/70 bg-background/45 p-6 sm:p-7">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="space-y-3">
            <Label>Ingredient Name</Label>
            <Input
              value={ingredient.ingredientName}
              onChange={(event) =>
                onUpdateIngredient(index, "ingredientName", event.target.value)
              }
              placeholder="e.g. Corn, Soybean"
            />
          </div>
          <div className="space-y-3">
            <Label>Supplier (Optional)</Label>
            <Input
              value={ingredient.supplier || ""}
              onChange={(event) =>
                onUpdateIngredient(index, "supplier", event.target.value)
              }
              placeholder="Lagos Grains Ltd"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="space-y-3">
            <Label>Quantity (kg)</Label>
            <Input
              type="number"
              step="0.01"
              value={ingredient.quantityKg || ""}
              onChange={(event) =>
                onUpdateIngredient(
                  index,
                  "quantityKg",
                  Number.parseFloat(event.target.value) || 0,
                )
              }
              placeholder="500.00"
            />
          </div>
          <div className="space-y-3">
            <Label>Total Cost (₦)</Label>
            <Input
              type="number"
              step="0.01"
              value={ingredient.totalCost || ""}
              onChange={(event) =>
                onUpdateIngredient(
                  index,
                  "totalCost",
                  Number.parseFloat(event.target.value) || 0,
                )
              }
              placeholder="100000.00"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">Unit Cost</div>
          {ingredient.quantityKg > 0 && ingredient.totalCost > 0 ? (
            <div className="font-medium text-foreground">
              ₦{(ingredient.totalCost / ingredient.quantityKg).toFixed(2)}/kg
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">-</div>
          )}
          {ingredientCount > 1 && (
            <Button
              onClick={() => onRemoveIngredient(index)}
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function CostReviewSection({
  costEstimate,
  formErrors,
  isCalculating,
  onCalculateCost,
}: {
  costEstimate: FeedCostEstimate | null;
  formErrors: string[];
  isCalculating: boolean;
  onCalculateCost: () => Promise<void>;
}) {
  return (
    <div className="space-y-5 rounded-xl border border-border/70 bg-background/55 p-5 sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          Step 3
        </p>
        <h3 className="display-heading text-2xl">Cost Review</h3>
      </div>
      <Button
        onClick={() => {
          void onCalculateCost();
        }}
        variant="outline"
        className="w-full"
        disabled={isCalculating}
      >
        <Calculator className="h-4 w-4 mr-2" />
        {isCalculating ? "Calculating..." : "Calculate Cost Estimate"}
      </Button>

      {costEstimate && <CostEstimateCard costEstimate={costEstimate} />}

      {formErrors.length > 0 && (
        <p className="text-sm text-red-600">
          {formErrors.length} validation issue
          {formErrors.length !== 1 ? "s" : ""} need attention before creating
          the batch.
        </p>
      )}
    </div>
  );
}

function CostEstimateCard({
  costEstimate,
}: {
  costEstimate: FeedCostEstimate;
}) {
  return (
    <Card className="border-primary/30 bg-primary/8">
      <CardContent className="p-5">
        <h4 className="font-semibold mb-3">Cost Estimate</h4>
        <div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center sm:text-left">
            <div className="text-muted-foreground">Total Quantity</div>
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
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-muted-foreground">Total Cost</div>
            <div className="font-medium text-lg">
              {formatFeedCurrency(Number(costEstimate.totalCost))}
            </div>
            {(costEstimate.miscellaneousCost as number) > 0 && (
              <div className="text-xs text-muted-foreground">
                Ingredients:{" "}
                {formatFeedCurrency(Number(costEstimate.ingredientsCost))}
                {" + "}Misc:{" "}
                {formatFeedCurrency(Number(costEstimate.miscellaneousCost))}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <div className="text-muted-foreground">Cost per Bag</div>
            <div className="font-medium">
              {formatFeedCurrency(Number(costEstimate.costPerBag))}
            </div>
            <div className="text-xs text-muted-foreground">
              ₦{Number(costEstimate.costPerKg).toFixed(2)}/kg
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedBatchesTable({
  batchUsageStats,
  batches,
  canCreate,
  canDelete,
  isDeleting,
  onCreateBatch,
  onDeleteBatch,
  onDuplicateBatch,
}: FeedBatchesTableProps) {
  return (
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
            onAction={canCreate ? onCreateBatch : undefined}
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
                  <TableHead className="min-w-[90px]">Used/Remaining</TableHead>
                  <TableHead className="min-w-[100px]">Usage %</TableHead>
                  <TableHead className="min-w-[100px]">Total Cost</TableHead>
                  <TableHead className="min-w-[80px]">Cost/Bag</TableHead>
                  <TableHead className="min-w-[160px]">Ingredients</TableHead>
                  <TableHead className="min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <FeedBatchRow
                    key={batch.id}
                    batch={batch}
                    canCreate={canCreate}
                    canDelete={canDelete}
                    isDeleting={isDeleting}
                    onDeleteBatch={onDeleteBatch}
                    onDuplicateBatch={onDuplicateBatch}
                    usageStats={
                      batchUsageStats.find(
                        (stat) => stat.batchId === batch.id,
                      ) ?? null
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FeedBatchRow({
  batch,
  canCreate,
  canDelete,
  isDeleting,
  onDeleteBatch,
  onDuplicateBatch,
  usageStats,
}: {
  batch: FeedBatch;
  canCreate: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDeleteBatch: (batchId: number, batchName: string) => void;
  onDuplicateBatch: (batch: FeedBatch) => void;
  usageStats: BatchUsageStats | null;
}) {
  const usagePercentage = usageStats?.usagePercentage ?? 0;

  return (
    <TableRow>
      <TableCell className="font-medium">{batch.batchName}</TableCell>
      <TableCell className="text-sm">
        {new Date(batch.batchDate).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="font-medium">
            {Number(batch.totalQuantityTons).toFixed(2)} tons
          </div>
          <div className="text-muted-foreground text-xs">
            ({(Number(batch.totalQuantityTons) * 1000).toFixed(2)} kg)
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="font-medium">
            {Number(batch.totalBags).toFixed(2)} bags
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="font-medium">
            {usageStats?.bagsUsed ?? 0} /{" "}
            {usageStats?.remainingBags ?? batch.totalBags}
          </div>
          <div className="text-muted-foreground text-xs">Used / Remaining</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{usagePercentage}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[60px]">
            <div
              className={`h-2 rounded-full transition-all ${getUsageBarClassName(usagePercentage)}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div>
          {formatFeedCurrency(Number(batch.totalCost))}
          {batch.miscellaneousCost > 0 && (
            <div className="text-xs text-muted-foreground font-normal">
              +₦{Number(batch.miscellaneousCost).toLocaleString()} misc
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {formatFeedCurrency(Number(batch.costPerBag))}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {batch.ingredients?.map((ingredient, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {ingredient.ingredientName} (
              {Number(ingredient.quantityKg).toFixed(2)}
              kg)
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
          {canCreate && (
            <Button
              onClick={() => onDuplicateBatch(batch)}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
              title="Duplicate Batch"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              onClick={() => onDeleteBatch(batch.id, batch.batchName)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:border-red-300"
              disabled={isDeleting}
              title="Delete Batch"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function DeleteBatchDialog({
  deleteConfirm,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteBatchDialogProps) {
  return (
    <Dialog
      open={deleteConfirm.show}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[470px]">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the batch "{deleteConfirm.batchName}
            "? This action cannot be undone and will permanently remove all
            associated ingredients.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void onConfirm();
            }}
            className="w-full sm:w-auto"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Batch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ValidationErrorsDialog({
  errors,
  onClose,
}: ValidationErrorsDialogProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[470px]">
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
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-red-600 text-sm"
            >
              <div className="h-1.5 w-1.5 bg-red-600 rounded-full" />
              {error}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="w-full sm:w-auto">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FeedManagement() {
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [costEstimate, setCostEstimate] = useState<FeedCostEstimate | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] =
    useState<FeedBatchDeleteConfirm>(EMPTY_DELETE_CONFIRM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [newBatch, setNewBatch] = useState(createEmptyFeedBatchForm);
  const {
    feedBatches: batches,
    batchUsageStats,
    loading,
    error,
    refresh,
    createBatch,
    deleteBatch,
    estimateBatchCost,
    isCreating,
    isDeleting,
    isCalculating,
  } = useFeedManagement();
  const { canCreate, canDelete } = useResourcePermissions("FEED");
  const toast = useToastContext();

  const resetBatchForm = () => {
    setCostEstimate(null);
    setFormErrors([]);
    setNewBatch(createEmptyFeedBatchForm());
  };

  const closeBatchDialog = () => {
    setShowNewBatch(false);
    resetBatchForm();
  };

  const handleBatchDialogOpenChange = (open: boolean) => {
    if (open) {
      setShowNewBatch(true);
      return;
    }

    closeBatchDialog();
  };

  const handleDuplicateBatch = (batch: FeedBatch) => {
    setNewBatch({
      batchName: `${batch.batchName} (Copy)`,
      batchDate: new Date().toISOString().split("T")[0],
      totalBags: batch.totalBags || "",
      miscellaneousCost: batch.miscellaneousCost || 0,
      ingredients: batch.ingredients?.map((ing) => ({
        ingredientName: ing.ingredientName,
        quantityKg: ing.quantityKg,
        totalCost: ing.totalCost,
        supplier: ing.supplier || "",
      })) || [createEmptyIngredientInput()],
    });
    setShowNewBatch(true);
  };

  const handleAddIngredient = () => {
    setNewBatch((current) => ({
      ...current,
      ingredients: [...current.ingredients, createEmptyIngredientInput()],
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setNewBatch((current) => ({
      ...current,
      ingredients:
        current.ingredients.length > 1
          ? current.ingredients.filter(
              (_, ingredientIndex) => ingredientIndex !== index,
            )
          : current.ingredients,
    }));
  };

  const handleUpdateIngredient = (
    index: number,
    field: keyof IngredientInput,
    value: string | number,
  ) => {
    setNewBatch((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index
          ? { ...ingredient, [field]: value }
          : ingredient,
      ),
    }));
  };

  const handleCalculateCost = async () => {
    const validIngredients = getValidIngredients(newBatch.ingredients);

    if (validIngredients.length === 0) {
      notifyToast(
        toast,
        "warning",
        "Invalid Ingredients",
        "Please add at least one valid ingredient with name, quantity, and cost.",
      );
      return;
    }

    try {
      const response = await estimateBatchCost({
        ingredients: buildFeedIngredients(validIngredients),
        totalBags: Number(newBatch.totalBags) || undefined,
        miscellaneousCost: newBatch.miscellaneousCost,
      });
      setCostEstimate(extractFeedCostEstimate(response));
    } catch (calculationError) {
      console.error("Failed to calculate cost:", calculationError);
      notifyToast(
        toast,
        "error",
        "Calculation Failed",
        "Failed to calculate cost. Please check your inputs and try again.",
      );
    }
  };

  const handleCreateBatch = async () => {
    const errors = validateFeedBatchForm(newBatch);
    setFormErrors(errors);

    if (errors.length > 0) {
      return;
    }

    try {
      await createBatch(buildFeedBatchPayload(newBatch));
      closeBatchDialog();
      notifyToast(
        toast,
        "success",
        "Batch Created",
        `Feed batch "${newBatch.batchName}" has been created successfully!`,
      );
    } catch (creationError) {
      console.error("Failed to create batch:", creationError);
      notifyToast(
        toast,
        "error",
        "Creation Failed",
        "Failed to create batch. Please check your inputs and try again.",
      );
    }
  };

  const requestDeleteBatch = (batchId: number, batchName: string) => {
    setDeleteConfirm({ show: true, batchId, batchName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.batchId) {
      return;
    }

    try {
      await deleteBatch(deleteConfirm.batchId.toString());
      notifyToast(
        toast,
        "success",
        "Batch Deleted",
        `Feed batch "${deleteConfirm.batchName}" has been deleted.`,
      );
      setDeleteConfirm(EMPTY_DELETE_CONFIRM);
    } catch (deletionError) {
      console.error("Failed to delete batch:", deletionError);
      notifyToast(
        toast,
        "error",
        "Deletion Failed",
        "Failed to delete batch. Please try again.",
      );
    }
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
          eyebrow="Feed Operations"
          title="Feed Management"
          description="Create and manage feed batches with flexible ingredients"
        />
        <ErrorState
          title="Failed to load feed data"
          message={error.message}
          onRetry={() => {
            void refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feed Operations"
        title="Feed Management"
        description="Create and manage feed batches with flexible ingredients"
        actions={
          canCreate ? (
            <FeedBatchDialog
              costEstimate={costEstimate}
              formErrors={formErrors}
              isCalculating={isCalculating}
              isCreating={isCreating}
              newBatch={newBatch}
              onAddIngredient={handleAddIngredient}
              onCalculateCost={handleCalculateCost}
              onClose={closeBatchDialog}
              onCreateBatch={handleCreateBatch}
              onOpenChange={handleBatchDialogOpenChange}
              onRemoveIngredient={handleRemoveIngredient}
              onUpdateBatch={setNewBatch}
              onUpdateIngredient={handleUpdateIngredient}
              open={showNewBatch}
            />
          ) : null
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
        <Card className="border-border/60 bg-gradient-to-br from-background/80 to-background/40 shadow-sm backdrop-blur-md transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Feed Produced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {batches
                .reduce((sum, b) => sum + Number(b.totalBags), 0)
                .toLocaleString()}{" "}
              <span className="text-lg font-normal text-muted-foreground">
                bags
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {batches.length} batches
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-background/80 to-background/40 shadow-sm backdrop-blur-md transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Avg Cost per Bag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {formatFeedCurrency(
                batches.length > 0
                  ? batches.reduce((sum, b) => sum + Number(b.costPerBag), 0) /
                      batches.length
                  : 0,
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on historical data
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-red-500/10 to-background/40 shadow-sm backdrop-blur-md transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500/80 uppercase tracking-wider">
              Low Stock Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-red-600/90">
              {batchUsageStats?.filter((s) => s.isNearlyEmpty).length || 0}{" "}
              <span className="text-lg font-normal text-red-500/70">
                batches
              </span>
            </div>
            <p className="text-xs text-red-500/70 mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <FeedBatchesTable
        batchUsageStats={batchUsageStats}
        batches={batches}
        canCreate={canCreate}
        canDelete={canDelete}
        isDeleting={isDeleting}
        onCreateBatch={() => setShowNewBatch(true)}
        onDeleteBatch={requestDeleteBatch}
        onDuplicateBatch={handleDuplicateBatch}
      />

      <DeleteBatchDialog
        deleteConfirm={deleteConfirm}
        isDeleting={isDeleting}
        onClose={() => setDeleteConfirm(EMPTY_DELETE_CONFIRM)}
        onConfirm={handleConfirmDelete}
      />

      <ValidationErrorsDialog
        errors={formErrors}
        onClose={() => setFormErrors([])}
      />
    </div>
  );
}
