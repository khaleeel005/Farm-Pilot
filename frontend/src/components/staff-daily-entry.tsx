'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHouses, createDailyLog, getFeedBatches, getFeedBatchUsageStats } from '@/lib/api';
import { House, DailyLogPayload, BatchUsageStats } from '@/types';
import { FeedBatch } from '@/types/entities/feed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Egg, Package, AlertTriangle, CheckCircle, Home, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { useToastContext } from '@/hooks';

export function StaffDailyEntry() {
  const [selectedHouse, setSelectedHouse] = useState('');
  const [houses, setHouses] = useState<House[]>([]);
  const [feedBatches, setFeedBatches] = useState<FeedBatch[]>([]);
  const [batchUsageStats, setBatchUsageStats] = useState<BatchUsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToastContext();

  // Form data - combined form for egg collection, feed, and mortality
  const [formData, setFormData] = useState({
    eggsCollected: '',
    crackedEggs: '',
    mortalityCount: '',
    feedBatchId: '',
    feedBagsUsed: '',
    notes: '',
  });

  const [feedBagsError, setFeedBagsError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [housesData, batchesData, usageStatsData] = await Promise.all([
        getHouses().catch(() => []),
        getFeedBatches().catch(() => []),
        getFeedBatchUsageStats().catch(() => []),
      ]);

      // Filter to only active houses
      const activeHouses = (Array.isArray(housesData) ? housesData : []).filter(
        (h) => h.status === 'active'
      );
      setHouses(activeHouses);
      setFeedBatches(Array.isArray(batchesData) ? batchesData : []);
      setBatchUsageStats(Array.isArray(usageStatsData) ? usageStatsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get remaining bags for selected batch
  const getSelectedBatchStats = () => {
    if (!formData.feedBatchId) return null;
    return batchUsageStats.find((stats) => stats.batchId === parseInt(formData.feedBatchId));
  };

  // Validate feed bags against remaining
  const validateFeedBags = (value: string) => {
    if (!value || !formData.feedBatchId) {
      setFeedBagsError('');
      return true;
    }

    const numValue = parseFloat(value);
    const batchStats = getSelectedBatchStats();

    if (!batchStats) return true;

    if (isNaN(numValue) || numValue <= 0) {
      setFeedBagsError('');
      return true;
    }

    if (numValue > batchStats.remainingBags) {
      setFeedBagsError(
        `Only ${batchStats.remainingBags} bags remaining in this batch`
      );
      return false;
    }

    setFeedBagsError('');
    return true;
  };

  const handleFeedBagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, feedBagsUsed: value }));
    validateFeedBags(value);
  };

  const handleSubmit = async () => {
    if (!selectedHouse) {
      toast.error('Please select a house');
      return;
    }

    // Validate feed bags if entered
    if (formData.feedBagsUsed && !validateFeedBags(formData.feedBagsUsed)) {
      toast.error('Please fix the feed bags error before submitting');
      return;
    }

    setSubmitting(true);

    const payload: DailyLogPayload = {
      logDate: new Date().toISOString().slice(0, 10),
      houseId: Number(selectedHouse),
      eggsCollected: Number(formData.eggsCollected) || 0,
      crackedEggs: Number(formData.crackedEggs) || 0,
      mortalityCount: Number(formData.mortalityCount) || 0,
      feedBatchId: formData.feedBatchId ? Number(formData.feedBatchId) : undefined,
      feedBagsUsed: Number(formData.feedBagsUsed) || 0,
      notes: formData.notes || undefined,
    };

    try {
      await createDailyLog(payload);
      toast.success('Daily log submitted successfully!');

      // Reset form
      setFormData({
        eggsCollected: '',
        crackedEggs: '',
        mortalityCount: '',
        feedBatchId: '',
        feedBagsUsed: '',
        notes: '',
      });
      setFeedBagsError('');

      // Refresh batch stats to show updated usage
      const newStats = await getFeedBatchUsageStats().catch(() => []);
      setBatchUsageStats(Array.isArray(newStats) ? newStats : []);
    } catch (error) {
      console.error('Failed to submit daily log:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit daily log';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const selectedHouseData = houses.find((h) => String(h.id) === selectedHouse);
  const selectedBatchStats = getSelectedBatchStats();

  if (loading) {
    return <LoadingSpinner fullPage message="Loading farm data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Daily Log Entry"
        description="Record today's egg collection, feed usage, and observations"
        actions={
          <Badge variant="outline" className="text-sm">
            {today}
          </Badge>
        }
      />

      {houses.length === 0 ? (
        <EmptyState
          title="No active houses"
          description="There are no active houses to log data for. Please contact your manager."
        />
      ) : (
        <>
          {/* House Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Select House
              </CardTitle>
              <CardDescription>Choose which house you're logging data for today</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a house..." />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={String(house.id)}>
                      <div className="flex items-center gap-2">
                        <span>{house.houseName}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {house.currentBirdCount} birds
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedHouseData && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">House:</span>
                      <p className="font-medium">{selectedHouseData.houseName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Birds:</span>
                      <p className="font-medium">{selectedHouseData.currentBirdCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capacity:</span>
                      <p className="font-medium">{selectedHouseData.capacity}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{selectedHouseData.location || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedHouse && (
            <>
              {/* Egg Collection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Egg className="h-5 w-5" />
                    Egg Collection
                  </CardTitle>
                  <CardDescription>Record today's egg collection and any cracked eggs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eggsCollected">Eggs Collected *</Label>
                      <Input
                        id="eggsCollected"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.eggsCollected}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, eggsCollected: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crackedEggs">Cracked Eggs</Label>
                      <Input
                        id="crackedEggs"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.crackedEggs}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, crackedEggs: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mortalityCount">Mortality</Label>
                      <Input
                        id="mortalityCount"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.mortalityCount}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, mortalityCount: e.target.value }))
                        }
                      />
                      {Number(formData.mortalityCount) > 0 && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Bird count will be reduced
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Feed Distribution
                  </CardTitle>
                  <CardDescription>Record feed given to this house</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feedBatch">Feed Batch</Label>
                      <Select
                        value={formData.feedBatchId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, feedBatchId: value, feedBagsUsed: '' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select feed batch..." />
                        </SelectTrigger>
                        <SelectContent>
                          {feedBatches.map((batch) => {
                            const stats = batchUsageStats.find((s) => s.batchId === batch.id);
                            const remaining = stats?.remainingBags ?? batch.totalBags;
                            const isEmpty = remaining <= 0;

                            return (
                              <SelectItem
                                key={batch.id}
                                value={String(batch.id)}
                                disabled={isEmpty}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{batch.batchName}</span>
                                  {isEmpty ? (
                                    <Badge variant="destructive">Empty</Badge>
                                  ) : remaining <= batch.totalBags * 0.2 ? (
                                    <Badge variant="outline" className="text-orange-600">
                                      {remaining} bags left
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">{remaining} bags</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feedBagsUsed">Bags Used</Label>
                      <Input
                        id="feedBagsUsed"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={formData.feedBagsUsed}
                        onChange={handleFeedBagsChange}
                        disabled={!formData.feedBatchId}
                        className={feedBagsError ? 'border-destructive' : ''}
                      />
                      {feedBagsError && (
                        <p className="text-xs text-destructive">{feedBagsError}</p>
                      )}
                      {selectedBatchStats && !feedBagsError && (
                        <p className="text-xs text-muted-foreground">
                          {selectedBatchStats.remainingBags} bags remaining in batch
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes & Observations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Notes & Observations
                  </CardTitle>
                  <CardDescription>
                    Report any issues, health concerns, or notable observations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any observations about bird health, equipment issues, unusual behavior, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Logging for: <strong>{selectedHouseData?.houseName}</strong>
                      </p>
                      <p>
                        Date: <strong>{new Date().toLocaleDateString()}</strong>
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !selectedHouse || !!feedBagsError}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submit Daily Log
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
