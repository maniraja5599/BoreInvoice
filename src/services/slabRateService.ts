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

// Enhanced default slab rates with multiple slab types
const DEFAULT_SLAB_RATES: Omit<SlabRate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Slab Type 1: Standard 300-foot increments
  {
    name: '0-300 Feet (Type 1)',
    description: 'Initial drilling depth (0-300 feet)',
    fromDepth: 0,
    toDepth: 300,
    ratePerFoot: 90,
    isActive: true
  },
  {
    name: '301-400 Feet (Type 1)',
    description: 'Medium depth drilling (301-400 feet)',
    fromDepth: 301,
    toDepth: 400,
    ratePerFoot: 100,
    isActive: true
  },
  {
    name: '401-500 Feet (Type 1)',
    description: 'Deep drilling (401-500 feet)',
    fromDepth: 401,
    toDepth: 500,
    ratePerFoot: 120,
    isActive: true
  },
  {
    name: '501-600 Feet (Type 1)',
    description: 'Deep drilling (501-600 feet)',
    fromDepth: 501,
    toDepth: 600,
    ratePerFoot: 150,
    isActive: true
  },
  {
    name: '601-700 Feet (Type 1)',
    description: 'Deep drilling (601-700 feet)',
    fromDepth: 601,
    toDepth: 700,
    ratePerFoot: 190,
    isActive: true
  },
  {
    name: '701-800 Feet (Type 1)',
    description: 'Deep drilling (701-800 feet)',
    fromDepth: 701,
    toDepth: 800,
    ratePerFoot: 240,
    isActive: true
  },
  {
    name: '801-900 Feet (Type 1)',
    description: 'Deep drilling (801-900 feet)',
    fromDepth: 801,
    toDepth: 900,
    ratePerFoot: 300,
    isActive: true
  },
  {
    name: '901-1000 Feet (Type 1)',
    description: 'Deep drilling (901-1000 feet)',
    fromDepth: 901,
    toDepth: 1000,
    ratePerFoot: 370,
    isActive: true
  },
  {
    name: '1001-1100 Feet (Type 1)',
    description: 'Deep drilling (1001-1100 feet)',
    fromDepth: 1001,
    toDepth: 1100,
    ratePerFoot: 470,
    isActive: true
  },
  {
    name: '1101-1200 Feet (Type 1)',
    description: 'Deep drilling (1101-1200 feet)',
    fromDepth: 1101,
    toDepth: 1200,
    ratePerFoot: 570,
    isActive: true
  },
  {
    name: '1201-1300 Feet (Type 1)',
    description: 'Deep drilling (1201-1300 feet)',
    fromDepth: 1201,
    toDepth: 1300,
    ratePerFoot: 670,
    isActive: true
  },
  {
    name: '1301-1400 Feet (Type 1)',
    description: 'Deep drilling (1301-1400 feet)',
    fromDepth: 1301,
    toDepth: 1400,
    ratePerFoot: 770,
    isActive: true
  },
  {
    name: '1401-1500 Feet (Type 1)',
    description: 'Deep drilling (1401-1500 feet)',
    fromDepth: 1401,
    toDepth: 1500,
    ratePerFoot: 870,
    isActive: true
  },
  {
    name: '1501-1600 Feet (Type 1)',
    description: 'Deep drilling (1501-1600 feet)',
    fromDepth: 1501,
    toDepth: 1600,
    ratePerFoot: 970,
    isActive: true
  },
  {
    name: '1600+ Feet (Type 1)',
    description: 'Beyond 1600 feet - Special pricing',
    fromDepth: 1601,
    toDepth: 9999,
    ratePerFoot: 1070,
    isActive: true
  },
  
  // Slab Type 2: Enhanced 100-foot increments
  {
    name: '1-100 Feet (Type 2)',
    description: 'Initial drilling depth (1-100 feet)',
    fromDepth: 1,
    toDepth: 100,
    ratePerFoot: 90,
    isActive: true
  },
  {
    name: '101-200 Feet (Type 2)',
    description: 'Shallow drilling (101-200 feet)',
    fromDepth: 101,
    toDepth: 200,
    ratePerFoot: 100,
    isActive: true
  },
  {
    name: '201-300 Feet (Type 2)',
    description: 'Medium drilling (201-300 feet)',
    fromDepth: 201,
    toDepth: 300,
    ratePerFoot: 120,
    isActive: true
  },
  {
    name: '301-400 Feet (Type 2)',
    description: 'Medium drilling (301-400 feet)',
    fromDepth: 301,
    toDepth: 400,
    ratePerFoot: 150,
    isActive: true
  },
  {
    name: '401-500 Feet (Type 2)',
    description: 'Deep drilling (401-500 feet)',
    fromDepth: 401,
    toDepth: 500,
    ratePerFoot: 190,
    isActive: true
  },
  {
    name: '501-600 Feet (Type 2)',
    description: 'Deep drilling (501-600 feet)',
    fromDepth: 501,
    toDepth: 600,
    ratePerFoot: 240,
    isActive: true
  },
  {
    name: '601-700 Feet (Type 2)',
    description: 'Deep drilling (601-700 feet)',
    fromDepth: 601,
    toDepth: 700,
    ratePerFoot: 300,
    isActive: true
  },
  {
    name: '701-800 Feet (Type 2)',
    description: 'Deep drilling (701-800 feet)',
    fromDepth: 701,
    toDepth: 800,
    ratePerFoot: 370,
    isActive: true
  },
  {
    name: '801-900 Feet (Type 2)',
    description: 'Deep drilling (801-900 feet)',
    fromDepth: 801,
    toDepth: 900,
    ratePerFoot: 450,
    isActive: true
  },
  {
    name: '901-1000 Feet (Type 2)',
    description: 'Deep drilling (901-1000 feet)',
    fromDepth: 901,
    toDepth: 1000,
    ratePerFoot: 550,
    isActive: true
  },
  {
    name: '1001-1100 Feet (Type 2)',
    description: 'Deep drilling (1001-1100 feet)',
    fromDepth: 1001,
    toDepth: 1100,
    ratePerFoot: 660,
    isActive: true
  },
  {
    name: '1101-1200 Feet (Type 2)',
    description: 'Deep drilling (1101-1200 feet)',
    fromDepth: 1101,
    toDepth: 1200,
    ratePerFoot: 780,
    isActive: true
  },
  {
    name: '1201-1300 Feet (Type 2)',
    description: 'Deep drilling (1201-1300 feet)',
    fromDepth: 1201,
    toDepth: 1300,
    ratePerFoot: 910,
    isActive: true
  },
  {
    name: '1301-1400 Feet (Type 2)',
    description: 'Deep drilling (1301-1400 feet)',
    fromDepth: 1301,
    toDepth: 1400,
    ratePerFoot: 1050,
    isActive: true
  },
  {
    name: '1401-1500 Feet (Type 2)',
    description: 'Deep drilling (1401-1500 feet)',
    fromDepth: 1401,
    toDepth: 1500,
    ratePerFoot: 1200,
    isActive: true
  },
  {
    name: '1501-1600 Feet (Type 2)',
    description: 'Deep drilling (1501-1600 feet)',
    fromDepth: 1501,
    toDepth: 1600,
    ratePerFoot: 1360,
    isActive: true
  },
  {
    name: '1600+ Feet (Type 2)',
    description: 'Beyond 1600 feet - Special pricing',
    fromDepth: 1601,
    toDepth: 9999,
    ratePerFoot: 1520,
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
  },

  // Generate slab rates from configuration
  generateFromConfig: (config: any, slabType: 'type1' | 'type2' | 'type3'): SlabRate[] => {
    const rates: SlabRate[] = [];
    const currentTime = new Date();
    
    if (slabType === 'type2') {
      // Enhanced Slab #2 with 100-foot increments
      const type2Ranges = [
        { key: 'rate1_100', from: 1, to: 100 },
        { key: 'rate101_200', from: 101, to: 200 },
        { key: 'rate201_300', from: 201, to: 300 },
        { key: 'rate301_400', from: 301, to: 400 },
        { key: 'rate401_500', from: 401, to: 500 },
        { key: 'rate501_600', from: 501, to: 600 },
        { key: 'rate601_700', from: 601, to: 700 },
        { key: 'rate701_800', from: 701, to: 800 },
        { key: 'rate801_900', from: 801, to: 900 },
        { key: 'rate901_1000', from: 901, to: 1000 },
        { key: 'rate1001_1100', from: 1001, to: 1100 },
        { key: 'rate1101_1200', from: 1101, to: 1200 },
        { key: 'rate1201_1300', from: 1201, to: 1300 },
        { key: 'rate1301_1400', from: 1301, to: 1400 },
        { key: 'rate1401_1500', from: 1401, to: 1500 },
        { key: 'rate1501_1600', from: 1501, to: 1600 },
        { key: 'rate1600_plus', from: 1601, to: 9999 }
      ];
      
      type2Ranges.forEach(range => {
        rates.push({
          id: uuidv4(),
          name: `${range.from}-${range.to === 9999 ? '∞' : range.to} Feet (Type 2)`,
          description: `Drilling depth (${range.from}-${range.to === 9999 ? '∞' : range.to} feet)`,
          fromDepth: range.from,
          toDepth: range.to,
          ratePerFoot: config[range.key] || 90,
          isActive: true,
          createdAt: currentTime,
          updatedAt: currentTime
        });
      });
    } else {
      // Original structure for type1 and type3
      const standardRanges = [
        { key: 'rate1_300', from: 0, to: 300 },
        { key: 'rate301_400', from: 301, to: 400 },
        { key: 'rate401_500', from: 401, to: 500 },
        { key: 'rate501_600', from: 501, to: 600 },
        { key: 'rate601_700', from: 601, to: 700 },
        { key: 'rate701_800', from: 701, to: 800 },
        { key: 'rate801_900', from: 801, to: 900 },
        { key: 'rate901_1000', from: 901, to: 1000 },
        { key: 'rate1001_1100', from: 1001, to: 1100 },
        { key: 'rate1101_1200', from: 1101, to: 1200 },
        { key: 'rate1201_1300', from: 1201, to: 1300 },
        { key: 'rate1301_1400', from: 1301, to: 1400 },
        { key: 'rate1401_1500', from: 1401, to: 1500 },
        { key: 'rate1501_1600', from: 1501, to: 1600 },
        { key: 'rate1600_plus', from: 1601, to: 9999 }
      ];
      
      standardRanges.forEach(range => {
        rates.push({
          id: uuidv4(),
          name: `${range.from}-${range.to === 9999 ? '∞' : range.to} Feet (Type ${slabType === 'type1' ? '1' : '3'})`,
          description: `Drilling depth (${range.from}-${range.to === 9999 ? '∞' : range.to} feet)`,
          fromDepth: range.from,
          toDepth: range.to,
          ratePerFoot: config[range.key] || 90,
          isActive: true,
          createdAt: currentTime,
          updatedAt: currentTime
        });
      });
      
      // Add rate1_500 for type3
      if (slabType === 'type3') {
        rates.push({
          id: uuidv4(),
          name: '1-500 Feet (Type 3)',
          description: 'Drilling depth (1-500 feet)',
          fromDepth: 1,
          toDepth: 500,
          ratePerFoot: config.rate1_500 || 90,
          isActive: true,
          createdAt: currentTime,
          updatedAt: currentTime
        });
      }
    }
    
    return rates;
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

