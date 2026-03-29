'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Trash2, Edit, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { CsvUploader } from '@/components/shared/csv-uploader';
import {
  useDailyLogs,
  useDeleteDailyLog,
  useFeedInventory,
  useResourcePermissions,
  useToastContext,
  useUpdateDailyLog,
  useCreateBulkDailyLogs,
} from '@/hooks';
import { calculateDailyLogStats } from '@/lib/dailyLogs';
import type { DailyLog, DailyLogPayload } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  EGGS_PER_CRATE,
  EMPTY_DAILY_LOG_FORM,
  buildDailyLogUpdatePayload,
  cratesPiecesToEggs,
  eggsToCreatesPieces,
} from '@/lib/dailyLogForm';

export function DailyLogs() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const { logs, loading, error, refresh } = useDailyLogs({
    date: selectedDateString,
  });
  const { feedBatches } = useFeedInventory();
  const deleteDailyLogMutation = useDeleteDailyLog();
  const updateDailyLogMutation = useUpdateDailyLog();

  const [deleteConfirmLog, setDeleteConfirmLog] = useState<DailyLog | null>(null);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_DAILY_LOG_FORM });
  const [showImportCsv, setShowImportCsv] = useState(false);
  const toast = useToastContext();
  const { canUpdate, canDelete, canCreate } = useResourcePermissions('DAILY_LOGS');
  const createBulkDailyLogsMutation = useCreateBulkDailyLogs();
  const stats = useMemo(() => calculateDailyLogStats(logs), [logs]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleDelete = async () => {
    if (!deleteConfirmLog) return;

    try {
      await deleteDailyLogMutation.mutateAsync(deleteConfirmLog.id);
      toast.success('Daily log deleted successfully!');
      setDeleteConfirmLog(null);
    } catch (err) {
      console.error('Delete failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete log';
      toast.error(message);
    }
  };

  const openEditDialog = (log: DailyLog) => {
    setEditingLog(log);
    const { crates, pieces } = eggsToCreatesPieces(log.eggsCollected || 0);
    setEditForm({
      eggCrates: String(crates),
      eggPieces: String(pieces),
      crackedEggs: String(log.crackedEggs || 0),
      feedBatchId: log.feedBatchId ? String(log.feedBatchId) : '',
      feedBagsUsed: String(log.feedBagsUsed || 0),
      mortalityCount: String(log.mortalityCount || 0),
      notes: log.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      const payload: Partial<DailyLogPayload> =
        buildDailyLogUpdatePayload(editForm);

      await updateDailyLogMutation.mutateAsync({
        id: editingLog.id,
        payload,
      });
      toast.success('Daily log updated successfully!');
      setEditingLog(null);
    } catch (err) {
      console.error('Update failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to update log';
      toast.error(message);
    }
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const handleImportCsv = async (parsedData: any[]) => {
    try {
      const payloads: DailyLogPayload[] = parsedData.map((row) => {
        const crates = Number(row.EggCrates || row.eggCrates) || 0;
        const pieces = Number(row.EggPieces || row.eggPieces) || 0;
        const eggsCollected =
          crates || pieces
            ? cratesPiecesToEggs(crates, pieces)
            : Number(row.EggsCollected || row.eggsCollected) || 0;

        return {
          logDate: row.Date || row.logDate || format(new Date(), 'yyyy-MM-dd'),
          houseId: Number(row.HouseId || row.houseId),
          eggsCollected,
          crackedEggs: Number(row.CrackedEggs || row.crackedEggs) || 0,
          feedBagsUsed: Number(row.FeedBagsUsed || row.feedBagsUsed) || 0,
          mortalityCount: Number(row.MortalityCount || row.mortalityCount) || 0,
          notes: String(row.Notes || row.notes || ""),
        };
      });

      const validPayloads = payloads.filter((p) => p.houseId);
      if (validPayloads.length === 0) {
        toast.error("No valid logs found. Expected columns: HouseId, Date.");
        return;
      }

      await createBulkDailyLogsMutation.mutateAsync(validPayloads);
      setShowImportCsv(false);
      toast.success(`Successfully imported ${validPayloads.length} logs!`);
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import CSV');
    }
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {canCreate && (
        <CsvUploader
          isOpen={showImportCsv}
          onOpenChange={setShowImportCsv}
          onDataParsed={handleImportCsv}
          buttonText="Import CSV"
          title="Import Daily Logs CSV"
          description={`Upload a CSV with headers: Date, HouseId, EggCrates, EggPieces, CrackedEggs, FeedBagsUsed, MortalityCount, Notes. (${EGGS_PER_CRATE} eggs per crate)`}
          isLoading={createBulkDailyLogsMutation.isPending}
          sampleTemplate={`Date,HouseId,EggCrates,EggPieces,CrackedEggs,FeedBagsUsed,MortalityCount,Notes\n2026-03-20,1,4,10,2,1.5,0,Everything normal`}
        />
      )}
      <Button variant="outline" size="icon" onClick={goToPreviousDay}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[200px] justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, 'PPP')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={goToNextDay}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isToday && (
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          void refresh();
        }}
        disabled={loading}
      >
        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmLog} onOpenChange={(open) => !open && setDeleteConfirmLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Daily Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this log for {deleteConfirmLog?.House?.houseName || `House ${deleteConfirmLog?.houseId}`}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmLog(null)}
              disabled={deleteDailyLogMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDailyLogMutation.isPending}
            >
              {deleteDailyLogMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Daily Log</DialogTitle>
            <DialogDescription>
              Update log for {editingLog?.House?.houseName || `House ${editingLog?.houseId}`} on {editingLog?.logDate}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eggCrates">Crates</Label>
                <Input
                  id="eggCrates"
                  type="number"
                  min="0"
                  value={editForm.eggCrates}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, eggCrates: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eggPieces">Extra Pieces</Label>
                <Input
                  id="eggPieces"
                  type="number"
                  min="0"
                  max={EGGS_PER_CRATE - 1}
                  value={editForm.eggPieces}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, eggPieces: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Total: {cratesPiecesToEggs(Number(editForm.eggCrates) || 0, Number(editForm.eggPieces) || 0)} eggs
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crackedEggs">Cracked Eggs</Label>
                <Input
                  id="crackedEggs"
                  type="number"
                  min="0"
                  value={editForm.crackedEggs}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, crackedEggs: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedBatch">Feed Batch</Label>
                <Select
                  value={editForm.feedBatchId}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, feedBatchId: value }))}
                >
                  <SelectTrigger id="feedBatch">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {feedBatches.map((batch) => (
                      <SelectItem key={batch.id} value={String(batch.id)}>
                        {batch.batchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedBagsUsed">Bags Used</Label>
                <Input
                  id="feedBagsUsed"
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.feedBagsUsed}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, feedBagsUsed: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mortalityCount">Mortality Count</Label>
              <Input
                id="mortalityCount"
                type="number"
                min="0"
                value={editForm.mortalityCount}
                onChange={(e) => setEditForm((prev) => ({ ...prev, mortalityCount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLog(null)}
              disabled={updateDailyLogMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateDailyLogMutation.isPending}
            >
              {updateDailyLogMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageHeader
        eyebrow="Production Journal"
        title="Daily Logs"
        description={
          isToday
            ? "Today's production logs"
            : `Logs for ${format(selectedDate, 'MMMM d, yyyy')}`
        }
        actions={headerActions}
      />

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">Log Entries</CardTitle>
          <CardDescription>
            Browse, edit, and validate entries for the selected day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner message="Loading logs..." />
          ) : error ? (
            <ErrorState
              message={error.message}
              onRetry={() => {
                void refresh();
              }}
            />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No logs for this date"
              description={isToday 
                ? "No daily logs have been recorded yet. Use the Daily Entry form to add logs."
                : `No logs were recorded on ${format(selectedDate, 'MMMM d, yyyy')}.`
              }
            />
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Total Eggs</div>
                  <div className="text-xl font-bold">
                    {stats.totalEggs.toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Cracked</div>
                  <div className="text-xl font-bold text-orange-600">
                    {stats.totalCracked}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Mortality</div>
                  <div className="text-xl font-bold text-red-600">
                    {stats.totalMortality}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">Feed Bags</div>
                  <div className="text-xl font-bold">
                    {stats.totalFeedBags}
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead className="text-right">Eggs (crates+pieces)</TableHead>
                    <TableHead className="text-right">Cracked</TableHead>
                    <TableHead>Feed Batch</TableHead>
                    <TableHead className="text-right">Bags Used</TableHead>
                    <TableHead className="text-right">Mortality</TableHead>
                    <TableHead>Notes</TableHead>
                    {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={String(log.id)}>
                      <TableCell className="font-medium">
                        {log.House?.houseName || `House ${log.houseId}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span>{log.eggsCollected || 0}</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.floor((log.eggsCollected || 0) / EGGS_PER_CRATE)}c
                            {(log.eggsCollected || 0) % EGGS_PER_CRATE > 0
                              ? ` + ${(log.eggsCollected || 0) % EGGS_PER_CRATE}p`
                              : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {log.crackedEggs ? (
                          <Badge variant="outline" className="text-orange-600">
                            {log.crackedEggs}
                          </Badge>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell>
                        {log.FeedBatch?.batchName || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{Number(log.feedBagsUsed) || 0}</TableCell>
                      <TableCell className="text-right">
                        {log.mortalityCount ? (
                          <Badge variant="destructive">{log.mortalityCount}</Badge>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {log.notes || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      {(canUpdate || canDelete) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(log)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmLog(log)}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
