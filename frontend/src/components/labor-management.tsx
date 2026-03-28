"use client";

import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Calendar, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type { Laborer } from "@/types";
import {
  useLaborers,
  usePayrollMonth,
  useResourcePermissions,
  useToastContext,
} from "@/hooks";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";

export function LaborManagement() {
  const [monthYear, setMonthYear] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [showNewWorker, setShowNewWorker] = useState(false);
  const [deleteConfirmWorker, setDeleteConfirmWorker] =
    useState<Laborer | null>(null);
  const [editPayroll, setEditPayroll] = useState<any | null>(null);
  const [bonusInput, setBonusInput] = useState("0");
  const [deductionInput, setDeductionInput] = useState("0");
  const {
    laborers: workers,
    loading: workersLoading,
    error: workersError,
    refresh: refreshLaborers,
    create,
    remove,
    isMutating,
  } = useLaborers();
  const {
    payroll,
    loading: payrollLoading,
    error: payrollError,
    refresh: refreshPayroll,
    generate: generatePayroll,
    update: updatePayroll,
    isGenerating: isPayrollGenerating,
    isUpdating: isPayrollUpdating,
  } = usePayrollMonth(monthYear);

  const handleGeneratePayroll = async () => {
    try {
      await generatePayroll();
      toast.success("Payroll generated for " + monthYear);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate payroll");
    }
  };

  const handleTogglePaymentStatus = async (
    payrollId: number | string | undefined,
    currentStatus: string,
  ) => {
    if (!payrollId) return;
    try {
      const newStatus = currentStatus === "paid" ? "pending" : "paid";
      await updatePayroll(payrollId, { paymentStatus: newStatus } as any);
      toast.success("Payment status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment status");
    }
  };

  const handleSavePayrollEdit = async () => {
    if (!editPayroll || !editPayroll.id) return;
    try {
      const b = Number(bonusInput) || 0;
      const d = Number(deductionInput) || 0;
      const base = Number(editPayroll.baseSalary || 0);
      const fs = base - d + b;

      await updatePayroll(editPayroll.id, {
        bonusAmount: b,
        salaryDeductions: d,
        finalSalary: fs,
      } as any);

      toast.success("Payroll record updated");
      setEditPayroll(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payroll");
    }
  };

  // Permission checks
  const { canCreate, canDelete } = useResourcePermissions("LABORERS");
  const toast = useToastContext();

  // form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState<number | "">("");

  const handleCreate = async () => {
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!phone.trim()) return toast.error("Phone number is required");
    if (salary === "" || isNaN(Number(salary)) || Number(salary) < 0)
      return toast.error("Monthly salary is required");
    const payload = {
      fullName: fullName.trim(),
      phone,
      monthlySalary: Number(salary) || 0,
    };
    try {
      const created = await create(payload);
      if (created) {
        setShowNewWorker(false);
        setFullName("");
        setPhone("");
        setSalary("");
        toast.success("Worker created");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create worker");
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await remove(id);
      toast.success("Worker deleted");
      setDeleteConfirmWorker(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete worker");
    }
  };
  const payrollData = payroll;
  const error = workersError || payrollError;

  if (workersLoading || payrollLoading) {
    return <LoadingSpinner fullPage message="Loading labor data..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workforce"
          title="Labor Management"
          description="Manage workers, attendance, and payroll"
        />
        <ErrorState
          title="Failed to load labor data"
          message={error.message}
          onRetry={() => {
            void Promise.all([refreshLaborers(), refreshPayroll()]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Workforce"
        title="Labor Management"
        description="Manage workers, attendance, and payroll"
        actions={
          canCreate && (
            <Button
              onClick={() => setShowNewWorker(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Worker
            </Button>
          )
        }
      />

      {/* Add Worker Modal */}
      <Dialog open={showNewWorker} onOpenChange={setShowNewWorker}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Worker</DialogTitle>
            <DialogDescription>Register a new employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Monthly Salary (₦)</Label>
                <Input
                  value={salary === "" ? "" : String(salary)}
                  onChange={(e) =>
                    setSalary(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  type="number"
                  placeholder="45000"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="Enter address" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="flex-1 sm:flex-none"
              onClick={handleCreate}
              disabled={isMutating}
            >
              Add Worker
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmWorker}
        onOpenChange={(open) => !open && setDeleteConfirmWorker(null)}
      >
        <DialogContent className="sm:max-w-[470px]">
          <DialogHeader>
            <DialogTitle>Delete Worker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {deleteConfirmWorker?.fullName}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmWorker(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmWorker && handleDelete(deleteConfirmWorker.id)
              }
              disabled={isMutating}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payroll Dialog */}
      <Dialog
        open={!!editPayroll}
        onOpenChange={(open) => !open && setEditPayroll(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payroll Record</DialogTitle>
            <DialogDescription>
              Update bonus and deductions for {editPayroll?.laborer?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Bonus (₦)</Label>
              <Input
                type="number"
                value={bonusInput}
                onChange={(e) => setBonusInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deductions (₦)</Label>
              <Input
                type="number"
                value={deductionInput}
                onChange={(e) => setDeductionInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPayroll(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePayrollEdit}
              disabled={isPayrollUpdating}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Labor Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Workers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {workers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All active employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Monthly Payroll
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none truncate">
              ₦
              {payrollData
                .reduce((sum, p) => sum + Number(p.finalSalary || 0), 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">January 2025</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Pending Payments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {payrollData.filter((p) => p.paymentStatus === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Workers awaiting pay
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workers" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="display-heading text-2xl">
                Worker Directory
              </CardTitle>
              <CardDescription>Manage your workforce</CardDescription>
            </CardHeader>
            <CardContent>
              {workers.length === 0 ? (
                <EmptyState
                  variant="workers"
                  title="No workers found"
                  description="Add your first worker to start managing labor."
                  actionLabel={canCreate ? "Add Worker" : undefined}
                  onAction={
                    canCreate ? () => setShowNewWorker(true) : undefined
                  }
                />
              ) : (
                <div className="space-y-3">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/55 p-3 sm:flex-row sm:items-center sm:p-4"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-sm sm:text-base">
                          {worker.fullName}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {worker.phone}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 justify-between sm:justify-normal">
                        <div className="font-medium text-sm sm:text-base">
                          ₦{Number(worker.monthlySalary || 0).toLocaleString()}
                          /month
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                          {worker.hireDate
                            ? `Since ${new Date(String(worker.hireDate)).toLocaleDateString()}`
                            : ""}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={worker.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {worker.isActive ? "active" : "inactive"}
                          </Badge>
                          {canDelete && worker.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setDeleteConfirmWorker(worker)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance removed per requirements */}

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="display-heading text-2xl">
                  Monthly Payroll
                </CardTitle>
                <CardDescription>
                  Salary calculations and payment status
                </CardDescription>
              </div>
              <Input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-40"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Days Worked</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Final Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((payrollItem, index) => (
                    <TableRow key={payrollItem.id || index}>
                      <TableCell className="font-medium">
                        {payrollItem.laborer?.fullName || ""}
                      </TableCell>
                      <TableCell>
                        ₦{Number(payrollItem.baseSalary || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {Number(payrollItem.daysWorked || 0)}/26
                      </TableCell>
                      <TableCell className="text-destructive">
                        -₦
                        {Number(
                          payrollItem.salaryDeductions || 0,
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-chart-5">
                        +₦
                        {Number(payrollItem.bonusAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₦{Number(payrollItem.finalSalary || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payrollItem.paymentStatus === "paid"
                              ? "default"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {payrollItem.paymentStatus || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPayrollUpdating}
                            onClick={() => {
                              setEditPayroll(payrollItem);
                              setBonusInput(
                                payrollItem.bonusAmount?.toString() || "0",
                              );
                              setDeductionInput(
                                payrollItem.salaryDeductions?.toString() || "0",
                              );
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPayrollUpdating}
                            onClick={() =>
                              handleTogglePaymentStatus(
                                payrollItem.id,
                                payrollItem.paymentStatus || "pending",
                              )
                            }
                          >
                            {payrollItem.paymentStatus === "paid"
                              ? "Unpay"
                              : "Pay"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Total Monthly Payroll
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
                    ₦
                    {payrollData
                      .reduce((sum, p) => sum + Number(p.finalSalary || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    Export Report
                  </Button>
                  <Button
                    className="flex-1 sm:flex-none"
                    onClick={handleGeneratePayroll}
                    disabled={isPayrollGenerating}
                  >
                    Generate / Update Payroll
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
