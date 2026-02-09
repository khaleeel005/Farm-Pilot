'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import {
  Receipt,
  Plus,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { getCostTypes, getCostEntries, createCostEntry } from '@/lib/api';
import formatCurrency from '@/lib/format';
import { CostEntry, CostTypeOption } from '@/types/entities/cost';

interface ExpenseManagementProps {
  userRole?: 'owner' | 'staff';
}

export function ExpenseManagement({ userRole = 'owner' }: ExpenseManagementProps) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [costTypes, setCostTypes] = useState<CostTypeOption[]>([]);
  const [newCostEntry, setNewCostEntry] = useState<Partial<CostEntry>>({
    date: new Date().toISOString().split('T')[0],
    costType: undefined,
    description: '',
    amount: 0,
    category: 'operational',
  });

  // Calculate current month date range
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      daysElapsed: differenceInDays(now, start) + 1, // +1 to include today
    };
  }, []);

  const handleCreateCostEntry = async () => {
    try {
      setLoading(true);
      const payload = {
        ...newCostEntry,
      };
      const result = await createCostEntry(payload as Partial<CostEntry>);
      if (result) {
        // success response contains created cost entry
        setIsAddExpenseOpen(false);
        await loadCostData();
        setNewCostEntry({
          date: new Date().toISOString().split('T')[0],
          costType: undefined,
          description: '',
          amount: 0,
          category: 'operational',
        });
      } else {
        alert('Failed to add cost entry');
      }
    } catch (error) {
      console.error('Failed to create cost entry:', error);
      alert('Failed to add cost entry');
    } finally {
      setLoading(false);
    }
  };

  const loadCostData = useCallback(async () => {
    try {
      setLoading(true);
      const [typesRes, entriesRes] = await Promise.all([
        getCostTypes(),
        getCostEntries({
          startDate: currentMonthRange.startDate,
          endDate: currentMonthRange.endDate,
        }),
      ]);

      if (typesRes) {
        // API returns { success, data: [...] }
        const response = typesRes as { data?: CostTypeOption[] };
        const typesData = response?.data || (Array.isArray(typesRes) ? typesRes : []);
        setCostTypes(Array.isArray(typesData) ? typesData : []);
      }

      if (entriesRes) {
        // API returns { success, data: { costEntries, pagination } }
        type EntriesResponse = {
          data?: { costEntries?: CostEntry[] };
          costEntries?: CostEntry[];
        };
        const response = entriesRes as EntriesResponse;

        let entries: CostEntry[] = [];
        if (response?.data?.costEntries && Array.isArray(response.data.costEntries)) {
          entries = response.data.costEntries;
        } else if (response?.costEntries && Array.isArray(response.costEntries)) {
          entries = response.costEntries;
        } else if (Array.isArray(entriesRes)) {
          entries = entriesRes as CostEntry[];
        }
        setCostEntries(entries);
      }
    } catch (error) {
      console.error('Failed to load cost data:', error);
      setCostEntries([]);
      setCostTypes([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonthRange.startDate, currentMonthRange.endDate]);

  useEffect(() => {
    loadCostData();
  }, [loadCostData]);

  const mockExpenses = costEntries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    category: entry.category || entry.costType,
    description: entry.description,
    amount: entry.amount,
    status: 'recorded',
    submittedBy: entry.creator?.username || 'Unknown',
    receipt: entry.receiptNumber || null,
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalExpenses = costEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pendingExpenses = 0;
  const approvedExpenses = costEntries.length;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cost data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-balance">
                {userRole === 'staff' ? 'Log Expenses' : 'Expense Management'}
              </h2>
              <p className="text-muted-foreground">
                {userRole === 'staff'
                  ? 'Record and submit farm expenses for approval'
                  : 'Track, approve, and manage all farm expenses'}
              </p>
            </div>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Operating Cost
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                  <DialogDescription>
                    Add a single expense line (pick a type, enter amount and description).
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newCostEntry.date || ''}
                      onChange={(e) =>
                        setNewCostEntry((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="costType">Cost Type</Label>
                    <select
                      id="costType"
                      className="border rounded px-2 py-1"
                      value={newCostEntry.costType || ''}
                      onChange={(e) =>
                        setNewCostEntry((prev) => ({
                          ...prev,
                          costType: e.target.value as unknown as CostEntry['costType'],
                        }))
                      }
                    >
                      <option value="">Select cost type</option>
                      {costTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newCostEntry.description || ''}
                      onChange={(e) =>
                        setNewCostEntry((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newCostEntry.amount || 0}
                      onChange={(e) =>
                        setNewCostEntry((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="border rounded px-2 py-1"
                      value={newCostEntry.category || 'operational'}
                      onChange={(e) =>
                        setNewCostEntry((prev) => ({
                          ...prev,
                          category: e.target.value as 'operational' | 'capital' | 'emergency',
                        }))
                      }
                    >
                      <option value="operational">Operational</option>
                      <option value="capital">Capital</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="vendor">Vendor (optional)</Label>
                    <Input
                      id="vendor"
                      value={newCostEntry.vendor || ''}
                      onChange={(e) =>
                        setNewCostEntry((prev) => ({ ...prev, vendor: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      value={newCostEntry.notes || ''}
                      onChange={(e) =>
                        setNewCostEntry((prev) => ({ ...prev, notes: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCostEntry} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Expense'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    minimumFractionDigits: 2,
                  }).format(totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            {userRole === 'owner' && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingExpenses}</div>
                    <p className="text-xs text-muted-foreground">Awaiting review</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{approvedExpenses}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    maximumFractionDigits: 0,
                  }).format(Math.round(totalExpenses / currentMonthRange.daysElapsed))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {currentMonthRange.daysElapsed} days this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Expense List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>
                    {userRole === 'staff'
                      ? 'Your submitted expenses and their status'
                      : 'All farm expenses requiring review and approval'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    {userRole === 'owner' && <TableHead>Submitted By</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {expense.description}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(expense.amount))}
                      </TableCell>
                      {userRole === 'owner' && <TableCell>{expense.submittedBy}</TableCell>}
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {expense.receipt && (
                            <Button variant="ghost" size="sm">
                              View Receipt
                            </Button>
                          )}
                          {userRole === 'owner' && expense.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" className="text-green-600">
                                Approve
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
