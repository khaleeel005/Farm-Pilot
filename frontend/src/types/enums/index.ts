// House status - matches backend House.status
export enum HouseStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

// User roles - matches backend User.role
export enum UserRole {
  OWNER = 'owner',
  STAFF = 'staff',
}

// Payment status - matches backend Sales.paymentStatus
export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
}

// Payment method - matches backend Sales.paymentMethod
export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CHECK = 'check',
}

// Attendance status - matches backend WorkAssignment.attendanceStatus
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  LATE = 'late',
}

// Payroll status - matches backend Payroll.paymentStatus
export enum PayrollStatus {
  PENDING = 'pending',
  PAID = 'paid',
}

// Cost category - matches backend CostEntry.category
export enum CostCategory {
  OPERATIONAL = 'operational',
  CAPITAL = 'capital',
  EMERGENCY = 'emergency',
}

// Cost payment method - matches backend CostEntry.paymentMethod
export enum CostPaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
}

// Notification type for UI
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}
