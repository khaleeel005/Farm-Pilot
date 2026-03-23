import type {
  Customer,
  CustomerPayload,
  Sale,
  SalePayload,
} from "@/types";

export interface SaleFormData {
  customerId: string;
  saleDate: string;
  quantity: string;
  pricePerEgg: string;
  paymentMethod: string;
  paymentStatus: "paid" | "pending";
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  customerType: string;
}

export interface SalesOverviewMetrics {
  todayRevenue: number;
  todaySalesCount: number;
  todayEggs: number;
  pendingPayments: number;
  pendingCount: number;
  totalCustomers: number;
}

export function getTodayDateValue() {
  return new Date().toISOString().split("T")[0];
}

export function createEmptySaleForm(): SaleFormData {
  return {
    customerId: "",
    saleDate: getTodayDateValue(),
    quantity: "",
    pricePerEgg: "",
    paymentMethod: "",
    paymentStatus: "pending",
  };
}

export function createEmptyCustomerForm(): CustomerFormData {
  return {
    name: "",
    phone: "",
    email: "",
    address: "",
    customerType: "individual",
  };
}

export function calculateSaleFormTotal(formData: SaleFormData) {
  const quantity = Number.parseFloat(formData.quantity) || 0;
  const pricePerEgg = Number.parseFloat(formData.pricePerEgg) || 0;
  return quantity * pricePerEgg;
}

export function buildSalePayload(formData: SaleFormData): SalePayload {
  return {
    customerId: Number.parseInt(formData.customerId, 10),
    saleDate: formData.saleDate,
    quantity: Number.parseFloat(formData.quantity) || 0,
    pricePerEgg: Number.parseFloat(formData.pricePerEgg) || 0,
    totalAmount: calculateSaleFormTotal(formData),
    paymentStatus: formData.paymentStatus,
    paymentMethod:
      formData.paymentMethod === "cash" ||
      formData.paymentMethod === "transfer" ||
      formData.paymentMethod === "check"
        ? formData.paymentMethod
        : undefined,
  };
}

export function buildCustomerPayload(
  formData: CustomerFormData,
): CustomerPayload {
  return {
    customerName: formData.name.trim(),
    phone: formData.phone.trim() || undefined,
    email: formData.email.trim() || undefined,
    address: formData.address.trim() || undefined,
  };
}

export function calculateSalesOverview(
  sales: Sale[],
  customers: Customer[],
  today = getTodayDateValue(),
): SalesOverviewMetrics {
  const todaySales = sales.filter((sale) => sale.saleDate === today);
  const pendingSales = sales.filter((sale) => sale.paymentStatus === "pending");

  return {
    todayRevenue: todaySales.reduce(
      (sum, sale) => sum + (Number(sale.totalAmount) || 0),
      0,
    ),
    todaySalesCount: todaySales.length,
    todayEggs: todaySales.reduce(
      (sum, sale) => sum + (Number(sale.quantity) || 0),
      0,
    ),
    pendingPayments: pendingSales.reduce(
      (sum, sale) => sum + (Number(sale.totalAmount) || 0),
      0,
    ),
    pendingCount: pendingSales.length,
    totalCustomers: customers.length,
  };
}
