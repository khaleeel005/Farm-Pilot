/**
 * Customer - Matches backend Customer model exactly
 */
export interface Customer {
  id: number;
  customerName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sales - Matches backend Sales model exactly
 */
export interface Sale {
  id: number;
  saleDate: string;
  customerId: number;
  quantity: number;
  pricePerEgg: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'check';
  paymentStatus: 'paid' | 'pending';
  supervisorId: number | null;
  createdAt?: string;
  updatedAt?: string;
  // Included associations
  customer?: Customer;
}

/**
 * Payload for creating/updating customers
 */
export interface CustomerPayload {
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

/**
 * Payload for creating/updating sales
 */
export interface SalePayload {
  saleDate: string;
  customerId: number;
  quantity: number;
  pricePerEgg: number;
  totalAmount: number;
  paymentMethod?: 'cash' | 'transfer' | 'check';
  paymentStatus?: 'paid' | 'pending';
  supervisorId?: number;
}
