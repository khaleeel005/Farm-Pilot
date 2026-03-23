"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Home,
  Egg,
  Package,
  Users,
  AlertCircle,
} from "lucide-react";
import type { BatchUsageStats, DailyLogPayload, FeedBatch, House } from "@/types";
import {
  useCreateDailyLog,
  useDailyLogs,
  useFeedInventory,
  useFarmWorkers,
  useHouses,
  useToastContext,
} from "@/hooks";
import { PageHeader } from "@/components/shared/page-header";
import {
  buildDailyAlerts,
  buildTodaySummary,
  getTodayIsoDate,
  type DailyLogFilters,
} from "@/lib/dailyLogs";
import {
  EMPTY_DAILY_LOG_FORM,
  buildDailyLogPayload,
  getDailyEntrySubmitLabel,
  getFeedBatchMetaTextClassName,
  getFeedBatchNameClassName,
  getFeedBatchRemainingBagsClassName,
  getFeedBagsInputClassName,
  getSelectedBatchUsage,
  hasNoAvailableHouses,
  isDailyEntryFormValid,
  isFeedBatchFinished,
  shouldShowFeedBatchUsageInfo,
  shouldShowLowFeedBatchBadge,
  validateFeedBagUsage,
  type DailyLogFormValues,
} from "@/lib/dailyLogForm";
import type { FarmWorker } from "@/lib/farmWorkers";
import type { TodaySummary } from "@/types";

interface ProductionEntryCardProps {
  feedBagsError: string;
  feedBatches: FeedBatch[];
  feedInventoryLoading: boolean;
  formData: DailyLogFormValues;
  houses: House[];
  housesLoading: boolean;
  isFeedBagUsageValid: boolean;
  isFormValid: boolean;
  isSubmitting: boolean;
  onFeedBagsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFormDataChange: (updates: Partial<DailyLogFormValues>) => void;
  onHouseChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  selectedBatchUsage: BatchUsageStats | null;
  selectedHouse: string;
  submitLabel: string;
  batchUsageStats: BatchUsageStats[];
}

interface SidePanelProps {
  alerts: string[];
  todaySummary: TodaySummary;
  workers: FarmWorker[];
}

function HouseSelectionSection({
  houses,
  housesLoading,
  selectedHouse,
  onHouseChange,
}: {
  houses: House[];
  housesLoading: boolean;
  onHouseChange: (value: string) => void;
  selectedHouse: string;
}) {
  const showNoHousesMessage = hasNoAvailableHouses(houses.length, housesLoading);

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4">
      <Label htmlFor="house">Select House/Coop</Label>
      <Select value={selectedHouse} onValueChange={onHouseChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a house" />
        </SelectTrigger>
        <SelectContent>
          {houses.map((house) => (
            <SelectItem key={house.id} value={String(house.id)}>
              {house.houseName || `House ${house.id}`} ({house.currentBirdCount} birds)
            </SelectItem>
          ))}
          {showNoHousesMessage && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No houses available
            </div>
          )}
          {housesLoading && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Loading houses...
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function EggCollectionSection({
  eggsCollected,
  onEggsCollectedChange,
}: {
  eggsCollected: string;
  onEggsCollectedChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
      <div className="flex items-center gap-2">
        <Egg className="h-4 w-4" />
        <Label className="text-base font-medium">Egg Collection</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eggs-collected">Eggs Collected</Label>
        <Input
          id="eggs-collected"
          type="number"
          placeholder="0"
          value={eggsCollected}
          onChange={(event) => onEggsCollectedChange(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/45 p-3">
        <span className="font-medium">Total Eggs:</span>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {Number.parseInt(eggsCollected, 10) || 0} eggs
        </Badge>
      </div>
    </div>
  );
}

function FeedBatchSelectOption({
  batch,
  usageInfo,
}: {
  batch: FeedBatch;
  usageInfo: BatchUsageStats | undefined;
}) {
  const isFinished = isFeedBatchFinished(usageInfo);

  return (
    <SelectItem
      key={batch.id}
      value={batch.id.toString()}
      disabled={isFinished}
    >
      <div className="flex flex-col gap-1 w-full py-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm font-medium truncate ${getFeedBatchNameClassName(isFinished)}`}
          >
            {batch.batchName}
          </span>
          {isFinished && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Finished
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={getFeedBatchMetaTextClassName(isFinished)}>
            ${batch.costPerBag}/bag
          </span>
          {shouldShowFeedBatchUsageInfo(usageInfo) && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`font-medium ${getFeedBatchRemainingBagsClassName(isFinished)}`}>
                {usageInfo.remainingBags} bags
              </span>
              {shouldShowLowFeedBatchBadge(usageInfo) && (
                <Badge variant="destructive" className="text-xs">
                  Low
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </SelectItem>
  );
}

function FeedHealthSection({
  batchUsageStats,
  feedBagsError,
  feedBatches,
  formData,
  isFeedBagUsageValid,
  onFeedBagsChange,
  onFormDataChange,
  selectedBatchUsage,
}: {
  batchUsageStats: BatchUsageStats[];
  feedBagsError: string;
  feedBatches: FeedBatch[];
  formData: DailyLogFormValues;
  isFeedBagUsageValid: boolean;
  onFeedBagsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFormDataChange: (updates: Partial<DailyLogFormValues>) => void;
  selectedBatchUsage: BatchUsageStats | null;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <Label className="text-base font-medium">Feed & Health</Label>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mortality">Mortality Count</Label>
          <Input
            id="mortality"
            type="number"
            placeholder="0"
            value={formData.mortalityCount}
            onChange={(event) =>
              onFormDataChange({ mortalityCount: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cracked-eggs">Cracked Eggs</Label>
          <Input
            id="cracked-eggs"
            type="number"
            placeholder="0"
            value={formData.crackedEggs}
            onChange={(event) =>
              onFormDataChange({ crackedEggs: event.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="feed-batch">Feed Batch</Label>
          <Select
            value={formData.feedBatchId}
            onValueChange={(value) =>
              onFormDataChange({ feedBatchId: value, feedBagsUsed: "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select feed batch" />
            </SelectTrigger>
            <SelectContent>
              {feedBatches.map((batch) => (
                <FeedBatchSelectOption
                  key={batch.id}
                  batch={batch}
                  usageInfo={batchUsageStats.find((stats) => stats.batchId === batch.id)}
                />
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feed-bags">Feed Bags Used</Label>
          <Input
            id="feed-bags"
            type="number"
            placeholder="0"
            min={0}
            step={0.1}
            max={selectedBatchUsage ? selectedBatchUsage.remainingBags : undefined}
            value={formData.feedBagsUsed}
            className={getFeedBagsInputClassName({
              feedBagsError,
              isFeedBagUsageValid,
            })}
            onChange={onFeedBagsChange}
            disabled={!formData.feedBatchId}
          />

          {selectedBatchUsage && (
            <p className="text-sm text-muted-foreground">
              Maximum available: {selectedBatchUsage.remainingBags} bags
            </p>
          )}

          {feedBagsError && (
            <p role="alert" className="text-sm text-red-600 font-medium">
              {feedBagsError}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes & Observations</Label>
        <Textarea
          id="notes"
          placeholder="Any health observations, unusual behavior, or other notes..."
          rows={3}
          value={formData.notes}
          onChange={(event) => onFormDataChange({ notes: event.target.value })}
        />
      </div>
    </div>
  );
}

function ProductionEntryCard({
  batchUsageStats,
  feedBagsError,
  feedBatches,
  feedInventoryLoading,
  formData,
  houses,
  housesLoading,
  isFeedBagUsageValid,
  isFormValid,
  isSubmitting,
  onFeedBagsChange,
  onFormDataChange,
  onHouseChange,
  onSubmit,
  selectedBatchUsage,
  selectedHouse,
  submitLabel,
}: ProductionEntryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Production Entry
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-5">
          <HouseSelectionSection
            houses={houses}
            housesLoading={housesLoading}
            selectedHouse={selectedHouse}
            onHouseChange={onHouseChange}
          />

          <Separator className="opacity-60" />

          <EggCollectionSection
            eggsCollected={formData.eggsCollected}
            onEggsCollectedChange={(value) =>
              onFormDataChange({ eggsCollected: value })
            }
          />

          <Separator className="opacity-60" />

          <FeedHealthSection
            batchUsageStats={batchUsageStats}
            feedBagsError={feedBagsError}
            feedBatches={feedBatches}
            formData={formData}
            isFeedBagUsageValid={isFeedBagUsageValid}
            onFeedBagsChange={onFeedBagsChange}
            onFormDataChange={onFormDataChange}
            selectedBatchUsage={selectedBatchUsage}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || feedInventoryLoading || !isFormValid}
          >
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TodaySummaryCard({ todaySummary }: { todaySummary: TodaySummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Today's Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">
              {todaySummary.totalEggs}
            </div>
            <div className="text-xs text-muted-foreground">Total Eggs</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-chart-2">
              {todaySummary.housesLogged}/{todaySummary.totalHouses}
            </div>
            <div className="text-xs text-muted-foreground">Houses Logged</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          {todaySummary.houseBreakdown.length > 0 ? (
            todaySummary.houseBreakdown.map((house) => (
              <div key={house.houseId} className="flex justify-between text-sm">
                <span>{house.houseName}</span>
                <Badge variant="secondary">{house.eggs} eggs</Badge>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">
              No logs recorded today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkerAssignmentCard({ workers }: { workers: FarmWorker[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Worker Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {workers.length > 0 ? (
          workers.map((worker) => (
            <div
              key={worker.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium">{worker.name}</div>
                <div className="text-xs text-muted-foreground">
                  {worker.role}
                </div>
                {worker.tasks.length > 0 && (
                  <div className="flex gap-1">
                    {worker.tasks.map((task, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {task}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Badge
                variant={
                  worker.attendanceStatus === "present"
                    ? "default"
                    : "destructive"
                }
              >
                {worker.attendanceStatus}
              </Badge>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-2">
            No workers assigned
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertsCard({ alerts }: { alerts: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Alerts & Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 border border-accent/20 bg-accent/5 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 text-accent mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Alert</div>
                <div className="text-xs text-muted-foreground">{alert}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-2">
            No alerts at this time
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SidePanel({ alerts, todaySummary, workers }: SidePanelProps) {
  return (
    <div className="space-y-6">
      <TodaySummaryCard todaySummary={todaySummary} />
      <WorkerAssignmentCard workers={workers} />
      <AlertsCard alerts={alerts} />
    </div>
  );
}

export function DailyEntryForm() {
  const [selectedHouse, setSelectedHouse] = useState("");
  const [formData, setFormData] = useState({ ...EMPTY_DAILY_LOG_FORM });
  const [feedBagsError, setFeedBagsError] = useState("");
  const { houses, loading: housesLoading } = useHouses();
  const {
    feedBatches,
    batchUsageStats,
    loading: feedInventoryLoading,
  } = useFeedInventory();
  const todayIsoDate = useMemo(() => getTodayIsoDate(), []);
  const { logs: todayLogs } = useDailyLogs({ date: todayIsoDate } as DailyLogFilters);
  const { workers } = useFarmWorkers();
  const createDailyLogMutation = useCreateDailyLog();
  const toast = useToastContext();

  const todaySummary = useMemo(
    () => buildTodaySummary(todayLogs, houses.length),
    [houses.length, todayLogs],
  );
  const alerts = useMemo(
    () => buildDailyAlerts(batchUsageStats, todaySummary),
    [batchUsageStats, todaySummary],
  );
  const selectedBatchUsage = useMemo(
    () => getSelectedBatchUsage(batchUsageStats, formData.feedBatchId),
    [batchUsageStats, formData.feedBatchId],
  );
  const isFeedBagUsageValid = useMemo(
    () =>
      validateFeedBagUsage(
        batchUsageStats,
        formData.feedBatchId,
        formData.feedBagsUsed,
      ).isValid,
    [batchUsageStats, formData.feedBatchId, formData.feedBagsUsed],
  );
  const isFormValid = useMemo(
    () =>
      isDailyEntryFormValid({
        feedBagsError,
        hasSelectedHouse: Boolean(selectedHouse),
        isFeedBagUsageValid,
      }),
    [feedBagsError, isFeedBagUsageValid, selectedHouse],
  );
  const submitLabel = useMemo(
    () =>
      getDailyEntrySubmitLabel({
        feedBagsError,
        hasSelectedHouse: Boolean(selectedHouse),
        isFeedInventoryLoading: feedInventoryLoading,
        isFormValid,
        isSubmitting: createDailyLogMutation.isPending,
      }),
    [
      createDailyLogMutation.isPending,
      feedBagsError,
      feedInventoryLoading,
      isFormValid,
      selectedHouse,
    ],
  );

  const updateFormData = (updates: Partial<DailyLogFormValues>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if ("feedBatchId" in updates && updates.feedBatchId !== undefined) {
      setFeedBagsError("");
    }
  };

  useEffect(() => {
    if (selectedBatchUsage && selectedBatchUsage.remainingBags <= 0) {
      setFormData((prev) => ({
        ...prev,
        feedBatchId: "",
        feedBagsUsed: "",
      }));
      toast.warning(
        "The selected feed batch is now finished and has been cleared from your selection.",
      );
    }
  }, [selectedBatchUsage, toast]);

  const handleFeedBagsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, feedBagsUsed: value }));

    const validation = validateFeedBagUsage(
      batchUsageStats,
      formData.feedBatchId,
      value,
    );

    if (
      !validation.isValid &&
      validation.batchUsage &&
      validation.bagsUsed !== null
    ) {
      setFeedBagsError(
        `Cannot use ${validation.bagsUsed} bags. Only ${validation.batchUsage.remainingBags} bags remaining in this batch.`,
      );
      return;
    }

    setFeedBagsError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedHouse) {
      toast.error("Please select a house");
      return;
    }

    try {
      const payload: DailyLogPayload = buildDailyLogPayload(
        formData,
        selectedHouse,
        todayIsoDate,
      );

      await createDailyLogMutation.mutateAsync(payload);
      toast.success("Daily log submitted successfully!");
      setFormData({ ...EMPTY_DAILY_LOG_FORM });
      setSelectedHouse("");
    } catch (error: unknown) {
      console.error("Submit error:", error);

      let errorMessage = "Failed to submit daily log. Please try again.";
      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        }
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as { message: string }).message;
      }

      toast.error(errorMessage);
      setFeedBagsError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Operations"
        title="Daily Entry"
        description="Record today's production, feed usage, and observations"
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProductionEntryCard
            batchUsageStats={batchUsageStats}
            feedBagsError={feedBagsError}
            feedBatches={feedBatches}
            feedInventoryLoading={feedInventoryLoading}
            formData={formData}
            houses={houses}
            housesLoading={housesLoading}
            isFeedBagUsageValid={isFeedBagUsageValid}
            isFormValid={isFormValid}
            isSubmitting={createDailyLogMutation.isPending}
            onFeedBagsChange={handleFeedBagsChange}
            onFormDataChange={updateFormData}
            onHouseChange={setSelectedHouse}
            onSubmit={handleSubmit}
            selectedBatchUsage={selectedBatchUsage}
            selectedHouse={selectedHouse}
            submitLabel={submitLabel}
          />
        </div>

        <SidePanel alerts={alerts} todaySummary={todaySummary} workers={workers} />
      </div>
    </div>
  );
}
