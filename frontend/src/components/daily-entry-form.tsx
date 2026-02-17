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
import {
  createDailyLog,
  getHouses,
  getDailyLogs,
  getLaborers,
  listStaff,
  getFeedBatches,
  getFeedBatchUsageStats,
} from "@/lib/api";
import {
  House,
  DailyLog,
  DailyLogPayload,
  TodaySummary,
  Laborer,
  BatchUsageStats,
} from "@/types";
import { FeedBatch } from "@/types/entities/feed";
import { useToastContext } from "@/hooks";
import { PageHeader } from "@/components/shared/page-header";

// Local worker type for this component
interface Worker {
  id: string;
  name: string;
  role: string;
  attendanceStatus: string;
  tasks: string[];
}

export function DailyEntryForm() {
  const [selectedHouse, setSelectedHouse] = useState("");
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToastContext();

  // Feed batch state
  const [feedBatches, setFeedBatches] = useState<FeedBatch[]>([]);
  const [batchUsageStats, setBatchUsageStats] = useState<BatchUsageStats[]>([]);

  const loadFeedBatches = async () => {
    try {
      const [batchesData, usageStatsData] = await Promise.all([
        getFeedBatches(),
        getFeedBatchUsageStats(),
      ]);
      setFeedBatches(Array.isArray(batchesData) ? batchesData : []);
      setBatchUsageStats(Array.isArray(usageStatsData) ? usageStatsData : []);
    } catch (error) {
      console.error("Failed to load feed batches:", error);
      setFeedBatches([]);
      setBatchUsageStats([]);
    }
  };

  useEffect(() => {
    loadFeedBatches();
  }, []);

  // Dynamic data states
  const [todaySummary, setTodaySummary] = useState<TodaySummary>({
    totalEggs: 0,
    housesLogged: 0,
    totalHouses: 0,
    houseBreakdown: [],
  });
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    eggsCollected: "",
    crackedEggs: "",
    mortalityCount: "",
    feedBatchId: "",
    feedBagsUsed: "",
    notes: "",
  });

  const [feedBagsError, setFeedBagsError] = useState<string>("");

  // Validation function to check if bags used exceeds remaining
  const validateFeedBags = () => {
    if (!formData.feedBatchId || !formData.feedBagsUsed) return true;

    const selectedBatchUsage = batchUsageStats.find(
      (stats) => stats.batchId === parseInt(formData.feedBatchId),
    );

    if (!selectedBatchUsage) return true;

    const bagsUsed = parseFloat(formData.feedBagsUsed);
    if (isNaN(bagsUsed) || bagsUsed <= 0) return true;

    return bagsUsed <= selectedBatchUsage.remainingBags;
  };

  // Form validation - checks all required fields and validation rules
  const isFormValid = () => {
    if (!selectedHouse) return false;
    if (!validateFeedBags()) return false;
    if (feedBagsError) return false;
    return true;
  };

  useEffect(() => {
    if (formData.feedBatchId && batchUsageStats.length > 0) {
      const selectedBatchUsage = batchUsageStats.find(
        (stats) => stats.batchId === parseInt(formData.feedBatchId),
      );

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
    }
  }, [batchUsageStats, formData.feedBatchId, toast]);

  const handleFeedBagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, feedBagsUsed: value }));

    // Clear previous error
    setFeedBagsError("");

    // Only validate if we have a value and batch selected
    if (value && formData.feedBatchId) {
      const numValue = parseFloat(value);
      const selectedBatch = batchUsageStats.find(
        (stats) => stats.batchId === parseInt(formData.feedBatchId),
      );

      if (selectedBatch && !isNaN(numValue) && numValue > 0) {
        if (numValue > selectedBatch.remainingBags) {
          setFeedBagsError(
            `Cannot use ${numValue} bags. Only ${selectedBatch.remainingBags} bags remaining in this batch.`,
          );
        }
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [housesData] = await Promise.all([loadHouses(), loadWorkers()]);
      await loadTodaysSummary(housesData.length);
    } finally {
      setLoading(false);
    }
  };

  const loadHouses = async (): Promise<House[]> => {
    try {
      const response = await getHouses();
      const nextHouses = Array.isArray(response) ? response : [];
      setHouses(nextHouses);
      return nextHouses;
    } catch (error) {
      console.error("Failed to load houses:", error);
      setHouses([]);
      return [];
    }
  };

  const loadTodaysSummary = async (totalHouses: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const todaysLogs = await getDailyLogs({ date: today });

      let totalEggs = 0;
      const houseBreakdown: Array<{
        houseId: number;
        houseName: string;
        eggs: number;
      }> = [];

      (Array.isArray(todaysLogs) ? todaysLogs : []).forEach((log: DailyLog) => {
        totalEggs += log.eggsCollected || 0;
        houseBreakdown.push({
          houseId: log.houseId,
          houseName: log.House?.houseName || `House ${log.houseId}`,
          eggs: log.eggsCollected || 0,
        });
      });

      setTodaySummary({
        totalEggs,
        housesLogged: houseBreakdown.length,
        totalHouses,
        houseBreakdown,
      });
    } catch (error) {
      console.error("Failed to load today's summary:", error);
    }
  };

  const loadWorkers = async () => {
    try {
      const [staffData, laborersData] = await Promise.all([
        listStaff().catch(() => []),
        getLaborers().catch(() => []),
      ]);

      const staffList = Array.isArray(staffData) ? staffData : [];
      const laborersList = Array.isArray(laborersData) ? laborersData : [];

      const staff = staffList.map(
        (s: { id: number; fullName?: string; username?: string }) => ({
          id: String(s.id),
          name: s.fullName || s.username || "Unknown",
          role: "Staff",
          attendanceStatus: "present",
          tasks: [] as string[],
        }),
      );

      const laborers = laborersList.map((l: Laborer) => ({
        id: String(l.id),
        name: l.fullName,
        role: "Laborer",
        attendanceStatus: "present",
        tasks: [] as string[],
      }));

      setWorkers([...staff, ...laborers]);
    } catch (error) {
      console.error("Failed to load workers:", error);
    }
  };

  const loadAlerts = () => {
    try {
      const alertMessages: string[] = [];

      // Check feed stock levels from batch usage stats
      if (batchUsageStats.length > 0) {
        const lowStockBatches = batchUsageStats.filter(
          (stats) => stats.remainingBags > 0 && stats.usagePercentage >= 80,
        );
        const finishedBatches = batchUsageStats.filter(
          (stats) => stats.remainingBags <= 0,
        );

        if (finishedBatches.length > 0) {
          alertMessages.push(
            `${finishedBatches.length} feed batch(es) depleted - order new stock`,
          );
        }
        if (lowStockBatches.length > 0) {
          alertMessages.push(
            `${lowStockBatches.length} feed batch(es) running low (>80% used)`,
          );
        }
      }

      // Check if any houses haven't been logged today
      if (
        todaySummary.totalHouses > 0 &&
        todaySummary.housesLogged < todaySummary.totalHouses
      ) {
        const unloggedCount =
          todaySummary.totalHouses - todaySummary.housesLogged;
        alertMessages.push(`${unloggedCount} house(s) still need daily logs`);
      }

      setAlerts(alertMessages);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [batchUsageStats, todaySummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHouse) {
      toast.error("Please select a house");
      return;
    }

    try {
      setSubmitting(true);

      const payload: DailyLogPayload = {
        logDate: new Date().toISOString().split("T")[0],
        houseId: parseInt(selectedHouse) || 0,
        eggsCollected: parseInt(formData.eggsCollected) || 0,
        crackedEggs: parseInt(formData.crackedEggs) || 0,
        mortalityCount: parseInt(formData.mortalityCount) || 0,
        feedBatchId: formData.feedBatchId
          ? parseInt(formData.feedBatchId)
          : undefined,
        feedBagsUsed: formData.feedBagsUsed
          ? parseFloat(formData.feedBagsUsed)
          : undefined,
        notes: formData.notes || undefined,
      };

      const result = await createDailyLog(payload);

      if (result) {
        toast.success("Daily log submitted successfully!");
        setFormData({
          eggsCollected: "",
          crackedEggs: "",
          mortalityCount: "",
          feedBatchId: "",
          feedBagsUsed: "",
          notes: "",
        });
        setSelectedHouse("");
        // Refresh data after successful submission
        await loadTodaysSummary(houses.length);
        await loadFeedBatches(); // Refresh feed batch stats to show updated usage
      } else {
        toast.error("Failed to submit daily log. Please try again.");
      }
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
        const basicError = error as { message: string };
        errorMessage = basicError.message;
      }

      toast.error(errorMessage);
      setFeedBagsError(errorMessage);
    } finally {
      setSubmitting(false);
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4">
                  <Label htmlFor="house">Select House/Coop</Label>
                  <Select
                    value={selectedHouse}
                    onValueChange={setSelectedHouse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a house" />
                    </SelectTrigger>
                    <SelectContent>
                      {houses.map((house) => (
                        <SelectItem key={house.id} value={String(house.id)}>
                          {house.houseName || `House ${house.id}`} (
                          {house.currentBirdCount} birds)
                        </SelectItem>
                      ))}
                      {houses.length === 0 && !loading && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No houses available
                        </div>
                      )}
                      {loading && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Loading houses...
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="opacity-60" />

                <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
                  <div className="flex items-center gap-2">
                    <Egg className="h-4 w-4" />
                    <Label className="text-base font-medium">
                      Egg Collection
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eggs-collected">Eggs Collected</Label>
                    <Input
                      id="eggs-collected"
                      type="number"
                      placeholder="0"
                      value={formData.eggsCollected}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eggsCollected: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/45 p-3">
                    <span className="font-medium">Total Eggs:</span>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {parseInt(formData.eggsCollected) || 0} eggs
                    </Badge>
                  </div>
                </div>

                <Separator className="opacity-60" />

                <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <Label className="text-base font-medium">
                      Feed & Health
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mortality">Mortality Count</Label>
                      <Input
                        id="mortality"
                        type="number"
                        placeholder="0"
                        value={formData.mortalityCount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            mortalityCount: e.target.value,
                          }))
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
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            crackedEggs: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="feed-batch">Feed Batch</Label>
                      <Select
                        value={formData.feedBatchId}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            feedBatchId: value,
                            feedBagsUsed: "",
                          }));
                          setFeedBagsError("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select feed batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(feedBatches) &&
                            feedBatches.map((batch) => {
                              const usageInfo = batchUsageStats.find(
                                (stats) => stats.batchId === batch.id,
                              );
                              const isFinished =
                                usageInfo && usageInfo.remainingBags <= 0;

                              return (
                                <SelectItem
                                  key={batch.id}
                                  value={batch.id.toString()}
                                  disabled={isFinished}
                                >
                                  <div className="flex flex-col gap-1 w-full py-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-sm font-medium truncate ${
                                          isFinished
                                            ? "text-gray-400 line-through"
                                            : ""
                                        }`}
                                      >
                                        {batch.batchName}
                                      </span>
                                      {isFinished && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs shrink-0"
                                        >
                                          Finished
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                      <span
                                        className={
                                          isFinished
                                            ? "text-gray-400"
                                            : "text-muted-foreground"
                                        }
                                      >
                                        ${batch.costPerBag}/bag
                                      </span>
                                      {usageInfo && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span
                                            className={`font-medium ${
                                              isFinished
                                                ? "text-gray-400"
                                                : "text-blue-600"
                                            }`}
                                          >
                                            {usageInfo.remainingBags} bags
                                          </span>
                                          {!isFinished &&
                                            usageInfo.usagePercentage >= 80 && (
                                              <Badge
                                                variant="destructive"
                                                className="text-xs"
                                              >
                                                Low
                                              </Badge>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feed-bags">Feed Bags Used</Label>
                      {(() => {
                        const selectedBatchUsage = batchUsageStats.find(
                          (stats) =>
                            stats.batchId === parseInt(formData.feedBatchId),
                        );

                        return (
                          <>
                            <Input
                              id="feed-bags"
                              type="number"
                              placeholder="0"
                              min={0}
                              step={0.1}
                              max={
                                selectedBatchUsage
                                  ? selectedBatchUsage.remainingBags
                                  : undefined
                              }
                              value={formData.feedBagsUsed}
                              className={
                                feedBagsError || !validateFeedBags()
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                  : ""
                              }
                              onChange={handleFeedBagsChange}
                              disabled={!formData.feedBatchId}
                            />

                            {selectedBatchUsage && (
                              <p className="text-sm text-muted-foreground">
                                Maximum available:{" "}
                                {selectedBatchUsage.remainingBags} bags
                              </p>
                            )}

                            {feedBagsError && (
                              <p
                                role="alert"
                                className="text-sm text-red-600 font-medium"
                              >
                                {feedBagsError}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes & Observations</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any health observations, unusual behavior, or other notes..."
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || !isFormValid()}
                >
                  {submitting
                    ? "Submitting..."
                    : !isFormValid()
                      ? feedBagsError
                        ? "Fix Feed Bags Error to Submit"
                        : !selectedHouse
                          ? "Select a House to Submit"
                          : "Fix Errors to Submit"
                      : "Submit Daily Entry"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
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
                  <div className="text-xs text-muted-foreground">
                    Total Eggs
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-chart-2">
                    {todaySummary.housesLogged}/{todaySummary.totalHouses}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Houses Logged
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {todaySummary.houseBreakdown.length > 0 ? (
                  todaySummary.houseBreakdown.map((house) => (
                    <div
                      key={house.houseId}
                      className="flex justify-between text-sm"
                    >
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
                        {worker.role || "Worker"}
                      </div>
                      {worker.tasks && worker.tasks.length > 0 && (
                        <div className="flex gap-1">
                          {worker.tasks.map((task: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
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
                      {worker.attendanceStatus || "unknown"}
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
                      <div className="text-xs text-muted-foreground">
                        {alert}
                      </div>
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
        </div>
      </div>
    </div>
  );
}
