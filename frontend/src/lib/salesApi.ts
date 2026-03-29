import type {
  Customer,
  CustomerPayload,
  Sale,
  SalePayload,
} from "@/types";
import {
  API_BASE_URL,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";

const BASE = API_BASE_URL;

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetchWithAuth(`${BASE}/api/customers`);
  const data = await handleResponse<{ data?: Customer[] }>(res);
  return data?.data || [];
}

export async function createCustomer(
  payload: CustomerPayload,
): Promise<Customer> {
  const res = await fetchWithAuth(`${BASE}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Customer }>(res);
  return data?.data as Customer;
}

export async function updateCustomer(
  id: number | string,
  payload: Partial<CustomerPayload>,
): Promise<Customer> {
  const res = await fetchWithAuth(`${BASE}/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Customer }>(res);
  return data?.data as Customer;
}

export async function deleteCustomer(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/customers/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function getSales(
  filters: Record<string, string> = {},
): Promise<Sale[]> {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${BASE}/api/sales?${params}`);
  const data = await handleResponse<{ data?: Sale[] }>(res);
  return data?.data || [];
}

export async function createSale(payload: SalePayload): Promise<Sale> {
  const res = await fetchWithAuth(`${BASE}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Sale }>(res);
  return data?.data as Sale;
}

export async function updateSale(
  id: number | string,
  payload: Partial<SalePayload>,
): Promise<Sale> {
  const res = await fetchWithAuth(`${BASE}/api/sales/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Sale }>(res);
  return data?.data as Sale;
}

export async function deleteSale(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/sales/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function createBulkSales(
  payloads: SalePayload[],
): Promise<Sale[]> {
  const res = await fetchWithAuth(`${BASE}/api/sales/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payloads),
  });
  const data = await handleResponse<{ data?: Sale[] }>(res);
  return data?.data || [];
}
