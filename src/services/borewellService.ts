import { 
  Customer, 
  BorewellDetails, 
  Payment, 
  ServiceReport, 
  DashboardStats
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock data storage
const STORAGE_KEYS = {
  CUSTOMERS: 'anjaneya_customers',
  BOREWELLS: 'anjaneya_borewells',
  PAYMENTS: 'anjaneya_payments',
  PROJECTS: 'anjaneya_projects',
  REPORTS: 'anjaneya_reports'
};

// Helper functions for localStorage
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage for key ${key}:`, error);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error);
  }
};

// Customer Service
export const customerService = {
  getAll: (): Customer[] => {
    return getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
  },

  getById: (id: string): Customer | undefined => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    return customers.find(c => c.id === id);
  },

  create: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const newCustomer: Customer = {
      ...customerData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    customers.push(newCustomer);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  },

  update: (id: string, customerData: Partial<Customer>): Customer | null => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    customers[index] = {
      ...customers[index],
      ...customerData,
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
  },

  delete: (id: string): boolean => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const filtered = customers.filter(c => c.id !== id);
    if (filtered.length === customers.length) return false;
    saveToStorage(STORAGE_KEYS.CUSTOMERS, filtered);
    return true;
  }
};

// Borewell Service
export const borewellService = {
  getAll: (): BorewellDetails[] => {
    return getFromStorage<BorewellDetails>(STORAGE_KEYS.BOREWELLS);
  },

  getById: (id: string): BorewellDetails | undefined => {
    const borewells = getFromStorage<BorewellDetails>(STORAGE_KEYS.BOREWELLS);
    return borewells.find(b => b.id === id);
  },

  getByCustomerId: (customerId: string): BorewellDetails[] => {
    const borewells = getFromStorage<BorewellDetails>(STORAGE_KEYS.BOREWELLS);
    return borewells.filter(b => b.customerId === customerId);
  },

  create: (borewellData: Omit<BorewellDetails, 'id' | 'createdAt' | 'updatedAt'>): BorewellDetails => {
    const borewells = getFromStorage<BorewellDetails>(STORAGE_KEYS.BOREWELLS);
    const newBorewell: BorewellDetails = {
      ...borewellData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    borewells.push(newBorewell);
    saveToStorage(STORAGE_KEYS.BOREWELLS, borewells);
    return newBorewell;
  },

  update: (id: string, borewellData: Partial<BorewellDetails>): BorewellDetails | null => {
    const borewells = getFromStorage<BorewellDetails>(STORAGE_KEYS.BOREWELLS);
    const index = borewells.findIndex(b => b.id === id);
    if (index === -1) return null;
    
    borewells[index] = {
      ...borewells[index],
      ...borewellData,
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.BOREWELLS, borewells);
    return borewells[index];
  },

  delete: (id: string): boolean => {
    const borewells = getFromStorage<BorewellDetails>(STORAGE_KEYS.BOREWELLS);
    const filtered = borewells.filter(b => b.id !== id);
    if (filtered.length === borewells.length) return false;
    saveToStorage(STORAGE_KEYS.BOREWELLS, filtered);
    return true;
  }
};

// Payment Service
export const paymentService = {
  getAll: (): Payment[] => {
    return getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
  },

  getById: (id: string): Payment | undefined => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.find(p => p.id === id);
  },

  getByBorewellId: (borewellId: string): Payment[] => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.filter(p => p.borewellId === borewellId);
  },

  getByCustomerId: (customerId: string): Payment[] => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.filter(p => p.customerId === customerId);
  },

  create: (paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const newPayment: Payment = {
      ...paymentData,
      id: uuidv4(),
      createdAt: new Date()
    };
    payments.push(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  },

  update: (id: string, paymentData: Partial<Payment>): Payment | null => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    payments[index] = {
      ...payments[index],
      ...paymentData
    };
    saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
    return payments[index];
  },

  delete: (id: string): boolean => {
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const filtered = payments.filter(p => p.id !== id);
    if (filtered.length === payments.length) return false;
    saveToStorage(STORAGE_KEYS.PAYMENTS, filtered);
    return true;
  }
};

// Invoice Service (placeholder for now)
export const projectService = {
  getAll: (): any[] => {
    return [];
  },

  getById: (id: string): any => {
    return undefined;
  },

  getByCustomerId: (customerId: string): any[] => {
    return [];
  },

  getDashboardStats: (): DashboardStats => {
    return {
      totalInvoices: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      thisMonthRevenue: 0,
      thisMonthInvoices: 0
    };
  }
};

// Service Report Service
export const reportService = {
  getAll: (): ServiceReport[] => {
    return getFromStorage<ServiceReport>(STORAGE_KEYS.REPORTS);
  },

  getById: (id: string): ServiceReport | undefined => {
    const reports = getFromStorage<ServiceReport>(STORAGE_KEYS.REPORTS);
    return reports.find(r => r.id === id);
  },

  getByProjectId: (projectId: string): ServiceReport[] => {
    const reports = getFromStorage<ServiceReport>(STORAGE_KEYS.REPORTS);
    return reports.filter(r => r.projectId === projectId);
  },

  create: (reportData: Omit<ServiceReport, 'id' | 'createdAt'>): ServiceReport => {
    const reports = getFromStorage<ServiceReport>(STORAGE_KEYS.REPORTS);
    const newReport: ServiceReport = {
      ...reportData,
      id: uuidv4(),
      createdAt: new Date()
    };
    reports.push(newReport);
    saveToStorage(STORAGE_KEYS.REPORTS, reports);
    return newReport;
  },

  update: (id: string, reportData: Partial<ServiceReport>): ServiceReport | null => {
    const reports = getFromStorage<ServiceReport>(STORAGE_KEYS.REPORTS);
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    reports[index] = {
      ...reports[index],
      ...reportData
    };
    saveToStorage(STORAGE_KEYS.REPORTS, reports);
    return reports[index];
  },

  delete: (id: string): boolean => {
    const reports = getFromStorage<ServiceReport>(STORAGE_KEYS.REPORTS);
    const filtered = reports.filter(r => r.id !== id);
    if (filtered.length === reports.length) return false;
    saveToStorage(STORAGE_KEYS.REPORTS, filtered);
    return true;
  }
};
