import { NotificationType } from '../enums';

export interface Notification {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  [key: string]: string | number | boolean | undefined;
}
