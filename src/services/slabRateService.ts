import { SlabRate, SlabRateCalculation, SlabCalculation } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock data storage
const STORAGE_KEYS = {
  SLAB_RATES: 'anjaneya_slab_rates',
  INVOICE_SETTINGS: 'anjaneya_invoice_settings'
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

// Default slab rates based on image pricing structure
const DEFAULT_SLAB_RATES: Omit<SlabRate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '0-300 Feet',
    description: 'Initial drilling depth (0-300 feet)',
    fromDepth: 0,
    toDepth: 300,
    ratePerFoot: 200,
    isActive: true
  },
  {
    name: '301-400 Feet',
    description: 'Medium depth drilling (301-400 feet)',
    fromDepth: 301,
    toDepth: 400,
    ratePerFoot: 120,
    isActive: true
  },
  {
    name: '401-500 Feet',
    description: 'Deep drilling (401-500 feet)',
    fromDepth: 401,
    toDepth: 500,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '501-600 Feet',
    description: 'Deep drilling (501-600 feet)',
    fromDepth: 501,
    toDepth: 600,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '601-700 Feet',
    description: 'Deep drilling (601-700 feet)',
    fromDepth: 601,
    toDepth: 700,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '701-800 Feet',
    description: 'Deep drilling (701-800 feet)',
    fromDepth: 701,
    toDepth: 800,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '801-900 Feet',
    description: 'Deep drilling (801-900 feet)',
    fromDepth: 801,
    toDepth: 900,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '901-1000 Feet',
    description: 'Deep drilling (901-1000 feet)',
    fromDepth: 901,
    toDepth: 1000,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '1001-1100 Feet',
    description: 'Deep drilling (1001-1100 feet)',
    fromDepth: 1001,
    toDepth: 1100,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '1101-1200 Feet',
    description: 'Deep drilling (1101-1200 feet)',
    fromDepth: 1101,
    toDepth: 1200,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '1201-1300 Feet',
    description: 'Deep drilling (1201-1300 feet)',
    fromDepth: 1201,
    toDepth: 1300,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '1301-1400 Feet',
    description: 'Deep drilling (1301-1400 feet)',
    fromDepth: 1301,
    toDepth: 1400,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '1401-1500 Feet',
    description: 'Deep drilling (1401-1500 feet)',
    fromDepth: 1401,
    toDepth: 1500,
    ratePerFoot: 130,
    isActive: true
  },
  {
    name: '1500+ Feet',
    description: 'Beyond 1500 feet - Special pricing',
    fromDepth: 1501,
    toDepth: 9999,
    ratePerFoot: 130,
    isActive: true
  }
];

// Initialize default slab rates if none exist
const initializeDefaultSlabRates = () => {
  const existingRates = getFromStorage<SlabRate>(STORAGE_KEYS.SLAB_RATES);
  if (existingRates.length === 0) {
    const defaultRates: SlabRate[] = DEFAULT_SLAB_RATES.map(rate => ({
      ...rate,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    saveToStorage(STORAGE_KEYS.SLAB_RATES, defaultRates);
  }
};

// Reset slab rates to default (useful for updates)
const resetToDefaultSlabRates = () => {
  const defaultRates: SlabRate[] = DEFAULT_SLAB_RATES.map(rate => ({
    ...rate,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  saveToStorage(STORAGE_KEYS.SLAB_RATES, defaultRates);
  return defaultRates;
};

// Slab Rate Service
export const slabRateService = {
  getAll: (): SlabRate[] => {
    initializeDefaultSlabRates();
    return getFromStorage<SlabRate>(STORAGE_KEYS.SLAB_RATES);
  },

  getActive: (): SlabRate[] => {
    return slabRateService.getAll().filter(rate => rate.isActive);
  },

  getById: (id: string): SlabRate | undefined => {
    const rates = getFromStorage<SlabRate>(STORAGE_KEYS.SLAB_RATES);
    return rates.find(rate => rate.id === id);
  },

  create: (rateData: Omit<SlabRate, 'id' | 'createdAt' | 'updatedAt'>): SlabRate => {
    const rates = getFromStorage<SlabRate>(STORAGE_KEYS.SLAB_RATES);
    const newRate: SlabRate = {
      ...rateData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    rates.push(newRate);
    saveToStorage(STORAGE_KEYS.SLAB_RATES, rates);
    return newRate;
  },

  update: (id: string, rateData: Partial<SlabRate>): SlabRate | null => {
    const rates = getFromStorage<SlabRate>(STORAGE_KEYS.SLAB_RATES);
    const index = rates.findIndex(rate => rate.id === id);
    if (index === -1) return null;
    
    rates[index] = {
      ...rates[index],
      ...rateData,
      updatedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.SLAB_RATES, rates);
    return rates[index];
  },

  delete: (id: string): boolean => {
    const rates = getFromStorage<SlabRate>(STORAGE_KEYS.SLAB_RATES);
    const filtered = rates.filter(rate => rate.id !== id);
    if (filtered.length === rates.length) return false;
    saveToStorage(STORAGE_KEYS.SLAB_RATES, filtered);
    return true;
  },

  calculateSlabRate: (depth: number): SlabRateCalculation => {
    const activeRates = slabRateService.getActive();
    const slabs: SlabCalculation[] = [];
    let totalAmount = 0;
    let breakdown = '';

    // Sort rates by fromDepth to ensure proper calculation
    const sortedRates = activeRates.sort((a, b) => a.fromDepth - b.fromDepth);

    for (const rate of sortedRates) {
      if (depth > rate.fromDepth) {
        const applicableDepth = Math.min(depth, rate.toDepth) - rate.fromDepth;
        if (applicableDepth > 0) {
          const amount = applicableDepth * rate.ratePerFoot;
          slabs.push({
            slab: rate,
            applicableDepth,
            amount
          });
          totalAmount += amount;
          breakdown += `${rate.name}: ${applicableDepth} ft × ₹${rate.ratePerFoot}/ft = ₹${amount.toLocaleString('en-IN')}\n`;
        }
      }
    }

    return {
      depth,
      slabs,
      totalAmount,
      breakdown: breakdown.trim()
    };
  },

  getSlabBreakdown: (depth: number): string => {
    const calculation = slabRateService.calculateSlabRate(depth);
    return calculation.breakdown;
  },

  getTotalAmount: (depth: number): number => {
    const calculation = slabRateService.calculateSlabRate(depth);
    return calculation.totalAmount;
  },

  resetToDefaults: (): SlabRate[] => {
    return resetToDefaultSlabRates();
  }
};

// Invoice Settings Service
export const invoiceSettingsService = {
  getSettings: () => {
    const settings = localStorage.getItem(STORAGE_KEYS.INVOICE_SETTINGS);
    if (settings) {
      return JSON.parse(settings);
    }
    
    // Default settings
    const defaultSettings = {
      companyName: 'Anjaneya Borewells',
      companyAddress: 'Your Company Address Here',
      companyPhone: '+91 98765 43210',
      companyEmail: 'info@anjaneyaborewells.com',
      gstNumber: 'GST123456789',
      panNumber: 'ABCDE1234F',
      bankDetails: {
        accountName: 'Anjaneya Borewells',
        accountNumber: '1234567890',
        ifscCode: 'ABCD0001234',
        bankName: 'State Bank of India'
      },
      defaultTaxRate: 18, // 18% GST
      defaultTerms: 'Payment due within 30 days of invoice date',
      invoicePrefix: 'INV',
      nextInvoiceNumber: 1001
    };
    
    localStorage.setItem(STORAGE_KEYS.INVOICE_SETTINGS, JSON.stringify(defaultSettings));
    return defaultSettings;
  },

  updateSettings: (settings: any) => {
    localStorage.setItem(STORAGE_KEYS.INVOICE_SETTINGS, JSON.stringify(settings));
  },

  getNextInvoiceNumber: () => {
    const settings = invoiceSettingsService.getSettings();
    const nextNumber = settings.nextInvoiceNumber;
    settings.nextInvoiceNumber += 1;
    invoiceSettingsService.updateSettings(settings);
    return `${settings.invoicePrefix}-${nextNumber.toString().padStart(4, '0')}`;
  }
};

