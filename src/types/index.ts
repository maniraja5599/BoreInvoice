// Core User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  isActive: boolean;
  createdAt: Date;
}

// Borewell Service Types
export interface Customer {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BorewellDetails {
  id: string;
  customerId: string;
  location: string;
  drillingDate: Date;
  totalDepth: number; // in feet
  diameter: number; // in inches
  drillingCostPerFoot: number;
  casingPipeLength: number; // in feet
  casingPipeCostPerFoot: number;
  numberOfFlushes: number;
  flushingCharges: number;
  additionalServices: AdditionalService[];
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdditionalService {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Payment {
  id: string;
  borewellId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  isAdvance: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'CARD';

export interface ServiceInvoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  serviceDetails: ServiceDetails;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  invoiceDate: Date;
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceDetails {
  id: string;
  serviceType: string;
  location: string;
  serviceDate: Date;
  description: string;
  technician?: string;
  materials?: string[];
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface ServiceReport {
  id: string;
  projectId: string;
  customerId: string;
  reportDate: Date;
  serviceType: string;
  description: string;
  technician: string;
  materials: string[];
  cost: number;
  status: 'DRAFT' | 'COMPLETED' | 'APPROVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalRevenue: number;
  pendingPayments: number;
  thisMonthRevenue: number;
  thisMonthInvoices: number;
}

// Slab Rate Types
export interface SlabRate {
  id: string;
  name: string;
  description: string;
  fromDepth: number; // in feet
  toDepth: number; // in feet
  ratePerFoot: number; // in INR
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlabRateCalculation {
  depth: number;
  slabs: SlabCalculation[];
  totalAmount: number;
  breakdown: string;
}

export interface SlabCalculation {
  slab: SlabRate;
  applicableDepth: number;
  amount: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  type: 'service' | 'material' | 'labor' | 'additional' | 'tax';
}

export interface Invoice {
  id: string;
  projectId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  gstNumber: string;
  panNumber: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  defaultTaxRate: number;
  defaultTerms: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
}




// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface AlertSettings {
  telegramEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  emailEnabled: boolean;
  emailAddress?: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: any;
  timestamp: Date;
  ipAddress?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Theme Types
export interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

// Dashboard State Types
export interface DashboardState {
  totalInvoices: number;
  totalRevenue: number;
  pendingPayments: number;
  recentInvoices: ServiceInvoice[];
  notifications: Notification[];
}

