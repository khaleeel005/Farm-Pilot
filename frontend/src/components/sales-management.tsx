"use client";

import { useCallback, useMemo, useState } from "react";
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
import type { Customer, Sale } from "@/types";
import {
  useResourcePermissions,
  useSales,
  useToastContext,
  useEggInventory,
} from "@/hooks";
import {
  buildCustomerPayload,
  buildSalePayload,
  calculateSaleFormTotal,
  createEmptyCustomerForm,
  createEmptySaleForm,
  getTodayDateValue,
  type CustomerFormData,
  type SaleFormData,
} from "@/lib/salesManagement";
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
import { CsvUploader } from "@/components/shared/csv-uploader";
import type { SalePayload } from "@/types";

export function SalesManagement() {
  const {
    sales,
    customers,
    loading,
    error,
    refresh,
    createSale,
    createBulkSales,
    createCustomer,
    summary,
    isCreatingSale,
    isCreatingCustomer,
  } = useSales();
  
  const todayDate = useMemo(() => getTodayDateValue(), []);
  const { inventory } = useEggInventory(todayDate, todayDate);
  const availableCrates = inventory?.netStockCrates ?? 0;
  const availablePieces = inventory?.netStockPieces ?? 0;
  
  const [showNewSale, setShowNewSale] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showImportCsv, setShowImportCsv] = useState(false);
  const [saleForm, setSaleForm] = useState<SaleFormData>(() =>
    createEmptySaleForm(),
  );
  const [customerForm, setCustomerForm] = useState<CustomerFormData>(() =>
    createEmptyCustomerForm(),
  );
  const toast = useToastContext();

  const { canCreate: canCreateSale } = useResourcePermissions("SALES");
  const { canCreate: canCreateCustomer } =
    useResourcePermissions("CUSTOMERS");

  const resetSaleForm = useCallback(() => {
    setSaleForm(createEmptySaleForm());
  }, []);

  const resetCustomerForm = useCallback(() => {
    setCustomerForm(createEmptyCustomerForm());
  }, []);

  const handleSaleFieldChange = useCallback(
    (field: keyof SaleFormData, value: string) => {
      setSaleForm((currentForm) => ({
        ...currentForm,
        [field]: value,
      }));
    },
    [],
  );

  const handleCustomerFieldChange = useCallback(
    (field: keyof CustomerFormData, value: string) => {
      setCustomerForm((currentForm) => ({
        ...currentForm,
        [field]: value,
      }));
    },
    [],
  );

  const handleCreateSale = useCallback(async () => {
    const payload = buildSalePayload(saleForm);

    if (payload.quantity <= 0) {
      toast.error("Please enter egg quantity.");
      return;
    }

    try {
      await createSale(payload);
      toast.success("Sale recorded successfully!");
      resetSaleForm();
      setShowNewSale(false);
    } catch (createSaleError) {
      console.error("Failed to create sale:", createSaleError);
      toast.error(
        createSaleError instanceof Error
          ? createSaleError.message
          : "Failed to record sale. Please try again.",
      );
    }
  }, [createSale, resetSaleForm, saleForm, toast]);

  const handleCreateCustomer = useCallback(async () => {
    if (!customerForm.name.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    try {
      await createCustomer(buildCustomerPayload(customerForm));
      toast.success("Customer created successfully!");
      resetCustomerForm();
      setShowNewCustomer(false);
    } catch (createCustomerError) {
      console.error("Failed to create customer:", createCustomerError);
      toast.error(
        createCustomerError instanceof Error
          ? createCustomerError.message
          : "Failed to create customer. Please try again.",
      );
    }
  }, [createCustomer, customerForm, resetCustomerForm, toast]);

  const saleTotal = useMemo(() => calculateSaleFormTotal(saleForm), [saleForm]);
  const customerNames = useMemo(() => {
    return new Map(customers.map((customer) => [customer.id, customer]));
  }, [customers]);

  if (loading && sales.length === 0 && customers.length === 0) {
    return <LoadingSpinner fullPage message="Loading sales data..." />;
  }

  if (error && sales.length === 0 && customers.length === 0) {
    return (
      <EmptyState
        variant="sales"
        title="Unable to load sales data"
        description={error.message || "Please try loading this page again."}
        actionLabel="Try Again"
        onAction={() => {
          void refresh();
        }}
      />
    );
  }

  const handleImportCsv = useCallback(
    async (parsedData: any[]) => {
      try {
        const payloads: SalePayload[] = parsedData.map((row) => ({
          saleDate: row.Date || row.saleDate,
          quantity: Number(row.Quantity || row.quantity) || 0,
          pricePerCrate: Number(row.UnitPrice || row.pricePerCrate || row.pricePerEgg) || 0,
          totalAmount: (Number(row.Quantity || row.quantity) || 0) * (Number(row.UnitPrice || row.pricePerCrate || row.pricePerEgg) || 0),
          paymentMethod: row.PaymentMethod || row.paymentMethod || "cash",
          paymentStatus: row.PaymentStatus || row.paymentStatus || "paid",
        }));

        const validPayloads = payloads.filter((p) => p.saleDate && p.quantity > 0);
        if (validPayloads.length === 0) {
          toast.error("No valid headers found. Expected: Date, Quantity, UnitPrice.");
          return;
        }

        await createBulkSales(validPayloads);
        setShowImportCsv(false);
        toast.success(`Successfully imported ${validPayloads.length} sales`);
        void refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to import CSV");
      }
    },
    [createBulkSales, refresh, toast],
  );

  const headerActions = (
    <div className="flex gap-2">
      {canCreateSale && (
        <CsvUploader
          isOpen={showImportCsv}
          onOpenChange={setShowImportCsv}
          onDataParsed={handleImportCsv}
          buttonText="Import CSV"
          title="Import Sales CSV"
          description="Upload a CSV with headers: Date, Quantity, UnitPrice, PaymentMethod, PaymentStatus"
          isLoading={isCreatingSale}
          sampleTemplate={"Date,Quantity,UnitPrice,PaymentMethod,PaymentStatus\n2026-03-20,10,3500,cash,paid"}
        />
      )}
      {canCreateCustomer && (
        <Button variant="outline" onClick={() => setShowNewCustomer(true)}>
          <Users className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      )}
      {canCreateSale && (
        <Button onClick={() => setShowNewSale(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Revenue Desk"
        title="Sales Management"
        description="Track sales, manage customers, and monitor payments"
        actions={headerActions}
      />

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
                onChange={(event) =>
                  handleCustomerFieldChange("name", event.target.value)
                }
                placeholder="Enter customer name"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={customerForm.phone}
                  onChange={(event) =>
                    handleCustomerFieldChange("phone", event.target.value)
                  }
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <Select
                  value={customerForm.customerType}
                  onValueChange={(value) =>
                    handleCustomerFieldChange("customerType", value)
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
                  onChange={(event) =>
                    handleCustomerFieldChange("email", event.target.value)
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={customerForm.address}
                  onChange={(event) =>
                    handleCustomerFieldChange("address", event.target.value)
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
            <Button
              onClick={() => {
                void handleCreateCustomer();
              }}
              disabled={isCreatingCustomer}
            >
              {isCreatingCustomer ? "Creating..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Today's Sales"
          value={`₦${summary.todayRevenue.toLocaleString()}`}
          description={`${summary.todaySalesCount} transactions today`}
          icon={DollarSign}
        />
        <SummaryCard
          title="Crates Sold Today"
          value={String(summary.todayCrates)}
          description={`${summary.todayCrates} crate${summary.todayCrates !== 1 ? "s" : ""} sold`}
          icon={DollarSign}
        />
        <SummaryCard
          title="Pending Payments"
          value={`₦${summary.pendingPayments.toLocaleString()}`}
          description={`${summary.pendingCount} transaction${summary.pendingCount !== 1 ? "s" : ""}`}
          icon={DollarSign}
        />
        <SummaryCard
          title="Total Customers"
          value={String(summary.totalCustomers)}
          description="Registered customers"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {showNewSale && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="display-heading text-2xl">
                  New Sale Entry
                </CardTitle>
                <CardDescription className="text-sm">
                  Record a new sale transaction
                </CardDescription>
              </div>
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                Stock: {availableCrates}c {availablePieces > 0 ? `+ ${availablePieces}p` : ""}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer (optional)</Label>
                  <Select
                    value={saleForm.customerId}
                    onValueChange={(value) =>
                      handleSaleFieldChange("customerId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Walk-in / No customer" />
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
                    onChange={(event) =>
                      handleSaleFieldChange("saleDate", event.target.value)
                    }
                  />
                </div>
              </div>

              <Separator className="opacity-60" />

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
                <Label className="text-sm font-medium sm:text-base">
                  Crate Quantity & Pricing
                </Label>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Quantity (crates)</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      value={saleForm.quantity}
                      onChange={(event) =>
                        handleSaleFieldChange("quantity", event.target.value)
                      }
                      className={(parseInt(saleForm.quantity) || 0) > availableCrates ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {saleForm.quantity && (parseInt(saleForm.quantity) || 0) > availableCrates && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        ⚠️ You are selling {(parseInt(saleForm.quantity) || 0) - availableCrates} crates more than current stock.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Crate (₦)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={saleForm.pricePerCrate}
                      onChange={(event) =>
                        handleSaleFieldChange(
                          "pricePerCrate",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/45 p-3">
                  <span className="font-medium">Total Amount:</span>
                  <span className="display-heading text-3xl leading-none">
                    ₦{saleTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={saleForm.paymentMethod}
                    onValueChange={(value) =>
                      handleSaleFieldChange("paymentMethod", value)
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
                      handleSaleFieldChange("paymentStatus", value)
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

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowNewSale(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    void handleCreateSale();
                  }}
                  disabled={isCreatingSale}
                >
                  {isCreatingSale ? "Recording..." : "Record Sale"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={showNewSale ? "lg:col-span-1" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle className="display-heading text-2xl">
              Recent Sales
            </CardTitle>
            <CardDescription>Latest sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Crates</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.slice(0, 10).map((sale) => (
                    <SaleRow
                      key={sale.id}
                      sale={sale}
                      customer={sale.customerId != null ? customerNames.get(sale.customerId) : undefined}
                    />
                  ))}
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

      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">
            Customer Management
          </CardTitle>
          <CardDescription>Manage your customer database</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {customers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
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

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof DollarSign;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium sm:text-sm">{title}</CardTitle>
        <Icon className="hidden h-4 w-4 text-muted-foreground sm:block" />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold sm:text-2xl">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function SaleRow({
  sale,
  customer,
}: {
  sale: Sale;
  customer?: Customer;
}) {
  const totalCrates = Number(sale.quantity) || 0;

  return (
    <TableRow>
      <TableCell className="font-medium">#{sale.id}</TableCell>
      <TableCell>{sale.customer?.customerName || customer?.customerName || "Unknown"}</TableCell>
      <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
      <TableCell>
        {totalCrates}
      </TableCell>
      <TableCell>₦{Number(sale.totalAmount).toLocaleString()}</TableCell>
      <TableCell>
        <Badge variant={sale.paymentStatus === "paid" ? "default" : "destructive"}>
          {sale.paymentStatus}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="truncate text-sm font-medium sm:text-base">
          {customer.customerName}
        </h4>
        <Badge variant="outline" className="shrink-0 text-xs">
          {customer.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
      <p className="truncate text-xs text-muted-foreground sm:text-sm">
        {customer.phone || "No phone"}
      </p>
      {customer.email && (
        <p className="truncate text-xs text-muted-foreground sm:text-sm">
          {customer.email}
        </p>
      )}
    </div>
  );
}
