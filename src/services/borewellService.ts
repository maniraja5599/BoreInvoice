import { 
  Customer, 
  BorewellDetails, 
  Payment, 
  ServiceReport, 
  DashboardStats,
  Reminder,
  BillingRecord,
  Notification
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock data storage
const STORAGE_KEYS = {
  CUSTOMERS: 'anjaneya_customers',
  BOREWELLS: 'anjaneya_borewells',
  PAYMENTS: 'anjaneya_payments',
  PROJECTS: 'anjaneya_projects',
  REPORTS: 'anjaneya_reports',
  REMINDERS: 'anjaneya_reminders',
  BILLING_RECORDS: 'anjaneya_billing_records',
  NOTIFICATIONS: 'anjaneya_notifications'
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

// Reminder Service
export const reminderService = {
  getAll: (): Reminder[] => {
    return getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
  },

  getById: (id: string): Reminder | undefined => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    return reminders.find(r => r.id === id);
  },

  getByCustomerId: (customerId: string): Reminder[] => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    return reminders.filter(r => r.customerId === customerId);
  },

  getTodaysReminders: (): Reminder[] => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderDate);
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate.getTime() === today.getTime() && !reminder.isCompleted;
    });
  },

  getOverdueReminders: (): Reminder[] => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderDate);
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate.getTime() < today.getTime() && !reminder.isCompleted;
    });
  },

  getActiveReminders: (): Reminder[] => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    return reminders.filter(r => !r.isCompleted);
  },

  create: (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Reminder => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    const newReminder: Reminder = {
      ...reminderData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    reminders.push(newReminder);
    saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
    return newReminder;
  },

  update: (id: string, reminderData: Partial<Reminder>): Reminder | null => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    reminders[index] = {
      ...reminders[index],
      ...reminderData,
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
    return reminders[index];
  },

  markCompleted: (id: string): Reminder | null => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    reminders[index] = {
      ...reminders[index],
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.REMINDERS, reminders);
    return reminders[index];
  },

  delete: (id: string): boolean => {
    const reminders = getFromStorage<Reminder>(STORAGE_KEYS.REMINDERS);
    const filtered = reminders.filter(r => r.id !== id);
    if (filtered.length === reminders.length) return false;
    saveToStorage(STORAGE_KEYS.REMINDERS, filtered);
    return true;
  }
};

// Notification Service
export const notificationService = {
  getAll: (): Notification[] => {
    return getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
  },

  getUnread: (): Notification[] => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    return notifications.filter(n => !n.read);
  },

  create: (notificationData: Omit<Notification, 'id' | 'timestamp'>): Notification => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const newNotification: Notification = {
      ...notificationData,
      id: uuidv4(),
      timestamp: new Date()
    };
    notifications.unshift(newNotification); // Add to beginning
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotification;
  },

  markAsRead: (id: string): boolean => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return false;
    
    notifications[index].read = true;
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return true;
  },

  markAllAsRead: (): boolean => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    notifications.forEach(n => n.read = true);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return true;
  },

  delete: (id: string): boolean => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS);
    const filtered = notifications.filter(n => n.id !== id);
    if (filtered.length === notifications.length) return false;
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, filtered);
    return true;
  },

  // Check for reminder notifications and create them
  checkAndCreateReminderNotifications: (): Notification[] => {
    const todaysReminders = reminderService.getTodaysReminders();
    const overdueReminders = reminderService.getOverdueReminders();
    const notifications: Notification[] = [];

    // Create notifications for today's reminders
    todaysReminders.forEach(reminder => {
      const notification = notificationService.create({
        type: 'reminder',
        title: `Reminder: ${reminder.type.toLowerCase()} Due Today`,
        message: `${reminder.note} - Customer: ${reminder.customerName}`,
        read: false,
        reminderId: reminder.id,
        customerId: reminder.customerId,
        actionRequired: true
      });
      notifications.push(notification);
    });

    // Create notifications for overdue reminders
    overdueReminders.forEach(reminder => {
      const daysPast = Math.floor((new Date().getTime() - new Date(reminder.reminderDate).getTime()) / (1000 * 60 * 60 * 24));
      const notification = notificationService.create({
        type: 'warning',
        title: `Overdue Reminder (${daysPast} days)`,
        message: `${reminder.note} - Customer: ${reminder.customerName}`,
        read: false,
        reminderId: reminder.id,
        customerId: reminder.customerId,
        actionRequired: true
      });
      notifications.push(notification);
    });

    return notifications;
  }
};

// Enhanced Customer Service with billing features
export const enhancedCustomerService = {
  ...customerService,

  // Migration helper to ensure customers have billing fields
  migrateCustomers: (): void => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const migratedCustomers = customers.map(customer => ({
      ...customer,
      serviceTaken: customer.serviceTaken || '',
      billingStatus: customer.billingStatus || 'UNPAID' as 'PAID' | 'UNPAID',
      paymentAmount: customer.paymentAmount || 0,
      dueDate: customer.dueDate || undefined,
      billNumber: customer.billNumber || '',
      lastPaymentDate: customer.lastPaymentDate || undefined,
      totalOutstanding: customer.totalOutstanding || 0
    }));
    saveToStorage(STORAGE_KEYS.CUSTOMERS, migratedCustomers);
  },

  // Override getAll to ensure migration
  getAll: (): Customer[] => {
    enhancedCustomerService.migrateCustomers();
    return getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
  },

  // Get customers by billing status
  getByBillingStatus: (status: 'PAID' | 'UNPAID'): Customer[] => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    return customers.filter(c => c.billingStatus === status);
  },

  // Get overdue customers
  getOverdueCustomers: (): Customer[] => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const today = new Date();
    return customers.filter(c => 
      c.billingStatus === 'UNPAID' && 
      c.dueDate && 
      new Date(c.dueDate) < today
    );
  },

  // Update billing status
  updateBillingStatus: (id: string, status: 'PAID' | 'UNPAID', paymentData?: {
    paymentAmount?: number;
    paymentDate?: Date;
    billNumber?: string;
  }): Customer | null => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    customers[index] = {
      ...customers[index],
      billingStatus: status,
      ...(paymentData && {
        paymentAmount: paymentData.paymentAmount || customers[index].paymentAmount,
        lastPaymentDate: paymentData.paymentDate,
        billNumber: paymentData.billNumber || customers[index].billNumber,
        totalOutstanding: status === 'PAID' ? 0 : customers[index].totalOutstanding
      }),
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
  },

  // Get customer statistics
  getStats: () => {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const paidCustomers = customers.filter(c => c.billingStatus === 'PAID');
    const unpaidCustomers = customers.filter(c => c.billingStatus === 'UNPAID');
    const overdueCustomers = enhancedCustomerService.getOverdueCustomers();
    
    return {
      totalUsers: customers.length,
      paidUsers: paidCustomers.length,
      unpaidUsers: unpaidCustomers.length,
      overdueUsers: overdueCustomers.length,
      totalOutstanding: unpaidCustomers.reduce((sum, c) => sum + c.totalOutstanding, 0),
      averagePayment: customers.length > 0 ? 
        customers.reduce((sum, c) => sum + c.paymentAmount, 0) / customers.length : 0
    };
  }
};
