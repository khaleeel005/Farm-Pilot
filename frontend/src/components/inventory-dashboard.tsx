"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { useEggInventory, useCreateEggAdjustment, useToastContext } from "@/hooks";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Egg, PackageMinus, PackagePlus, BarChart3, Plus } from "lucide-react";

export function InventoryDashboard() {
  const [startDate, setStartDate] = useState(() =>
    format(subDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );

  const { inventory, loading, error, refresh } = useEggInventory(
    startDate,
    endDate,
  );
  
  const createAdjustment = useCreateEggAdjustment();
  const toast = useToastContext();

  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "add",
    crates: "",
    pieces: "",
    reason: "",
  });

  const handleAdjustStock = async () => {
    try {
      if (!adjForm.date) throw new Error("Please select a date.");
      const crates = Number(adjForm.crates) || 0;
      const pieces = Number(adjForm.pieces) || 0;
      const totalPieces = (crates * 30) + pieces;
      
      if (totalPieces <= 0) throw new Error("Please enter a valid quantity.");

      const isAdd = adjForm.type === "add";
      const quantity = isAdd ? totalPieces : -totalPieces;

      await createAdjustment.mutateAsync({
        date: adjForm.date,
        quantity,
        reason: adjForm.reason,
      });

      toast.success("Inventory adjusted successfully");
      setShowAdjModal(false);
      setAdjForm((p) => ({ ...p, crates: "", pieces: "", reason: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to adjust stock");
    }
  };

  const datesControls = (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="start">Start Date</Label>
        <Input
          id="start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-auto"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="end">End Date</Label>
        <Input
          id="end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-auto"
        />
      </div>
      <Button onClick={() => setShowAdjModal(true)} className="ml-auto">
        <Plus className="mr-2 h-4 w-4" />
        Adjust Stock
      </Button>
    </div>
  );

  if (loading && !inventory) {
    return <LoadingSpinner fullPage message="Loading egg inventory..." />;
  }

  if (error) {
    return (
      <EmptyState
        variant="sales"
        title="Unable to load inventory data"
        description={error.message || "Please try loading this page again."}
        actionLabel="Try Again"
        onAction={() => void refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock Control"
        title="Egg Inventory"
        description="Monitor daily egg balance, collections, and outgoing sales"
        actions={datesControls}
      />

      <Dialog open={showAdjModal} onOpenChange={setShowAdjModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Egg Stock</DialogTitle>
            <DialogDescription>
              Add or remove eggs manually (e.g. initial balance, unreported breakages).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={adjForm.date}
                onChange={(e) => setAdjForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select
                value={adjForm.type}
                onValueChange={(val) => setAdjForm((prev) => ({ ...prev, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Eggs (e.g. Starting stock)</SelectItem>
                  <SelectItem value="deduct">Deduct Eggs (e.g. Lost/Spoiled)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Crates</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={adjForm.crates}
                  onChange={(e) => setAdjForm((prev) => ({ ...prev, crates: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pieces</Label>
                <Input
                  type="number"
                  min="0"
                  max="29"
                  placeholder="0"
                  value={adjForm.pieces}
                  onChange={(e) => setAdjForm((prev) => ({ ...prev, pieces: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input
                placeholder="e.g. Beginning of year count"
                value={adjForm.reason}
                onChange={(e) => setAdjForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjModal(false)} disabled={createAdjustment.isPending}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock} disabled={createAdjustment.isPending}>
              {createAdjustment.isPending ? "Saving..." : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          title="Opening Stock"
          value={formatPieces(inventory?.openingBalance ?? 0)}
          description="Before selected period"
          icon={PackagePlus}
        />
        <SummaryCard
          title="Total Collected"
          value={formatPieces(inventory?.totalCollected ?? 0)}
          description={`${inventory?.totalCollected ?? 0} individual eggs`}
          icon={PackagePlus}
        />
        <SummaryCard
          title="Total Sold"
          value={formatPieces(inventory?.totalSoldEggs ?? 0)}
          description={`${inventory?.totalSoldCrates ?? 0} crates sold`}
          icon={PackageMinus}
        />
        <SummaryCard
          title="Total Cracked"
          value={`${inventory?.totalCracked ?? 0} pieces`}
          description="Damaged or lost"
          icon={Egg}
        />
        <SummaryCard
          title="Current Stock"
          value={formatPieces(inventory?.netStock ?? 0)}
          description={`Net stock overall`}
          icon={BarChart3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">Daily Stock Flow</CardTitle>
          <CardDescription>
            Detailed breakdown of inventory changes per day
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!inventory?.dailyFlow || inventory.dailyFlow.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No inventory movements found in this period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Sold (Crates)</TableHead>
                  <TableHead className="text-right">Sold (Eggs)</TableHead>
                  <TableHead className="text-right">Cracked</TableHead>
                  <TableHead className="text-right text-muted-foreground">Adjusted</TableHead>
                  <TableHead className="text-right text-primary">Daily Net</TableHead>
                  <TableHead className="text-right font-bold">Closing Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.openingBalance !== 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap" colSpan={7}>
                      Opening Balance (Prior to {format(new Date(startDate), "MMM d, yyyy")})
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatPieces(inventory.openingBalance)}
                    </TableCell>
                  </TableRow>
                )}

                {/* Calculate running balance on the fly */}
                {(() => {
                  let runningBalance = inventory.openingBalance;
                  return inventory.dailyFlow.map((day) => {
                    runningBalance += day.net;
                    return (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(day.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          +{formatPieces(day.collected)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          -{day.soldCrates}c
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          -{day.soldEggs}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {day.cracked > 0 ? `-${day.cracked}` : '0'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {day.adjusted !== 0 ? (day.adjusted > 0 ? `+${formatPieces(day.adjusted)}` : formatPieces(day.adjusted)) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-primary font-medium">
                          {day.net > 0 ? "+" : ""}
                          {formatPieces(day.net)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatPieces(runningBalance)}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helpers
function formatPieces(totalPieces: number): string {
  if (totalPieces === 0) return "0";
  const EGGS_PER_CRATE = 30;
  const isNegative = totalPieces < 0;
  const absPieces = Math.abs(totalPieces);
  const crates = Math.floor(absPieces / EGGS_PER_CRATE);
  const pieces = absPieces % EGGS_PER_CRATE;

  let str = "";
  if (crates > 0) str += `${crates}c`;
  if (crates > 0 && pieces > 0) str += " + ";
  if (pieces > 0) str += `${pieces}p`;

  return isNegative ? `-${str}` : str;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium sm:text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold sm:text-2xl">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
