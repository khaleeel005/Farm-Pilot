"use client";

import { useState, useEffect, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Users, Plus } from "lucide-react";
import { getSales, getCustomers, createSale, createCustomer } from "@/lib/api";
import type { Sale, Customer, SalePayload, CustomerPayload } from "@/types";
import { useResourcePermissions, useToastContext } from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export function SalesManagement() {
  const [showNewSale, setShowNewSale] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const toast = useToastContext();

  // Permission checks
  const { canCreate: canCreateSale } = useResourcePermissions("SALES");
  const { canCreate: canCreateCustomer } = useResourcePermissions("CUSTOMERS");

  // Sales form state
  const [saleForm, setSaleForm] = useState({
    customerId: "",
    saleDate: new Date().toISOString().split("T")[0],
    quantity: "",
    pricePerEgg: "",
    paymentMethod: "",
    paymentStatus: "pending",
    notes: "",
  });

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    customerType: "individual",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [salesData, customersData] = await Promise.all([
        getSales().catch(() => []),
        getCustomers().catch(() => []),
      ]);
      setSales(Array.isArray(salesData) ? salesData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateTotal = () => {
    const quantity = parseFloat(saleForm.quantity) || 0;
    const pricePerEgg = parseFloat(saleForm.pricePerEgg) || 0;

    return quantity * pricePerEgg;
  };

  const handleCreateSale = async () => {
    if (!saleForm.customerId) {
      toast.error("Please select a customer");
      return;
    }

    const quantity = parseFloat(saleForm.quantity) || 0;

    if (quantity === 0) {
      toast.error("Please enter egg quantity");
      return;
    }

    try {
      setSubmitting(true);

      const pricePerEgg = parseFloat(saleForm.pricePerEgg) || 0;
      const totalAmount = calculateTotal();

      const payload: SalePayload = {
        customerId: parseInt(saleForm.customerId),
        saleDate: saleForm.saleDate,
        quantity,
        pricePerEgg,
        totalAmount,
        paymentStatus: saleForm.paymentStatus as "paid" | "pending",
        paymentMethod: (saleForm.paymentMethod || undefined) as
          | "cash"
          | "transfer"
          | "check"
          | undefined,
      };

      await createSale(payload);
      toast.success("Sale recorded successfully!");

      // Reset form and reload data
      setSaleForm({
        customerId: "",
        saleDate: new Date().toISOString().split("T")[0],
        quantity: "",
        pricePerEgg: "",
        paymentMethod: "",
        paymentStatus: "pending",
        notes: "",
      });
      setShowNewSale(false);
      loadData();
    } catch (err) {
      console.error("Failed to create sale:", err);
      toast.error("Failed to record sale. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    try {
      setSubmitting(true);

      const payload: CustomerPayload = {
        customerName: customerForm.name.trim(),
        phone: customerForm.phone || undefined,
        email: customerForm.email || undefined,
        address: customerForm.address || undefined,
      };

      await createCustomer(payload);
      toast.success("Customer created successfully!");

      // Reset form and reload customers
      setCustomerForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        customerType: "individual",
      });
      setShowNewCustomer(false);

      // Reload customers
      const customersData = await getCustomers();
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (err) {
      console.error("Failed to create customer:", err);
      toast.error("Failed to create customer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate summary stats
  const today = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter((s) => s.saleDate === today);
  const todayTotal = todaySales.reduce(
    (sum, s) => sum + (Number(s.totalAmount) || 0),
    0,
  );
  const todayEggs = todaySales.reduce(
    (sum, s) => sum + (Number(s.quantity) || 0),
    0,
  );
  const pendingPayments = sales
    .filter((s) => s.paymentStatus === "pending")
    .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const pendingCount = sales.filter(
    (s) => s.paymentStatus === "pending",
  ).length;

  if (loading) {
    return <LoadingSpinner fullPage message="Loading sales data..." />;
  }

  // Build header actions
  const headerActions = (
    <div className="flex gap-2">
      {canCreateCustomer && (
        <Button variant="outline" onClick={() => setShowNewCustomer(true)}>
          <Users className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      )}
      {canCreateSale && (
        <Button
          onClick={() => setShowNewSale(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Sale
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Revenue Desk"
        title="Sales Management"
        description="Track sales, manage customers, and monitor payments"
        actions={headerActions}
      />

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer record</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4">
              <Label>Customer Name *</Label>
              <Input
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter customer name"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <Select
                  value={customerForm.customerType}
                  onValueChange={(value) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      customerType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Customer address"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomer(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={submitting}>
              {submitting ? "Creating..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Today&apos;s Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              ₦{todayTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaySales.length} transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Eggs Sold Today
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {Math.floor(todayEggs / 12)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayEggs} individual eggs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Pending Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              ₦{pendingPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} transaction{pendingCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {customers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Sales Form */}
        {showNewSale && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="display-heading text-2xl">
                New Sale Entry
              </CardTitle>
              <CardDescription className="text-sm">
                Record a new sale transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={saleForm.customerId}
                    onValueChange={(value) =>
                      setSaleForm((prev) => ({ ...prev, customerId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={String(customer.id)}
                        >
                          {customer.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Sale Date</Label>
                  <Input
                    type="date"
                    value={saleForm.saleDate}
                    onChange={(e) =>
                      setSaleForm((prev) => ({
                        ...prev,
                        saleDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Separator className="opacity-60" />

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
                <Label className="text-sm sm:text-base font-medium">
                  Egg Quantity & Pricing
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity (eggs)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={saleForm.quantity}
                      onChange={(e) =>
                        setSaleForm((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Egg (₦)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={saleForm.pricePerEgg}
                      onChange={(e) =>
                        setSaleForm((prev) => ({
                          ...prev,
                          pricePerEgg: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Total Display */}
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/45 p-3">
                  <span className="font-medium">Total Amount:</span>
                  <span className="display-heading text-3xl leading-none">
                    ₦{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={saleForm.paymentMethod}
                    onValueChange={(value) =>
                      setSaleForm((prev) => ({ ...prev, paymentMethod: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={saleForm.paymentStatus}
                    onValueChange={(value) =>
                      setSaleForm((prev) => ({ ...prev, paymentStatus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewSale(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateSale}
                  disabled={submitting}
                >
                  {submitting ? "Recording..." : "Record Sale"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sales */}
        <Card className={showNewSale ? "lg:col-span-1" : "lg:col-span-3"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="display-heading text-2xl">
                  Recent Sales
                </CardTitle>
                <CardDescription>Latest sales transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Eggs</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.slice(0, 10).map((sale) => {
                    const totalEggs = Number(sale.quantity) || 0;
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          #{sale.id}
                        </TableCell>
                        <TableCell>
                          {sale.customer?.customerName || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {totalEggs} ({Math.floor(totalEggs / 12)} dz)
                        </TableCell>
                        <TableCell>
                          ₦{Number(sale.totalAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sale.paymentStatus === "paid"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {sale.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                variant="sales"
                title="No sales recorded yet"
                description="Click 'New Sale' to record your first sale."
                actionLabel={canCreateSale ? "New Sale" : undefined}
                onAction={
                  canCreateSale ? () => setShowNewSale(true) : undefined
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Management */}
      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">
            Customer Management
          </CardTitle>
          <CardDescription>Manage your customer database</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm sm:text-base truncate">
                      {customer.customerName}
                    </h4>
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {customer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {customer.phone || "No phone"}
                  </p>
                  {customer.email && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {customer.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="customers"
              title="No customers registered yet"
              description="Click 'Add Customer' to add your first customer."
              actionLabel={canCreateCustomer ? "Add Customer" : undefined}
              onAction={
                canCreateCustomer ? () => setShowNewCustomer(true) : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
