import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserPlusIcon,
  CalculatorIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Customer } from '../types';
import { customerService } from '../services/borewellService';
import { serviceTypeService } from '../services/serviceTypeService';
import { invoiceNumberService } from '../services/invoiceNumberService';
import toast from 'react-hot-toast';

interface EnhancedInvoiceFormProps {
  onClose: () => void;
  onSave: (invoiceData: any) => void;
}

interface SlabRange {
  start: number;
  end: number;
  label: string;
  key: string;
}

interface CustomSlab {
  id: string;
  name: string;
  ranges: SlabRange[];
  rates: { [key: string]: number };
  calcValues: { [key: string]: string };
  startRate: number;
  incrementPattern: number[];
}

interface SlabRateConfig {
  type1: {
    rate1_300: number;
    rate301_400: number;
    rate401_500: number;
    rate501_600: number;
    rate601_700: number;
    rate701_800: number;
    rate801_900: number;
    rate901_1000: number;
    rate1001_1100: number;
    rate1101_1200: number;
    rate1201_1300: number;
    rate1301_1400: number;
    rate1401_1500: number;
    rate1501_1600: number;
    rate1600_plus: number;
  };
  type2: {
    rate1_100: number;
    rate101_200: number;
    rate201_300: number;
    rate301_400: number;
    rate401_500: number;
    rate501_600: number;
    rate601_700: number;
    rate701_800: number;
    rate801_900: number;
    rate901_1000: number;
    rate1001_1100: number;
    rate1101_1200: number;
    rate1201_1300: number;
    rate1301_1400: number;
    rate1401_1500: number;
    rate1501_1600: number;
    rate1600_plus: number;
  };
  type3: {
    rate1_300: number;
    rate301_400: number;
    rate401_500: number;
    rate501_600: number;
    rate601_700: number;
    rate701_800: number;
    rate801_900: number;
    rate901_1000: number;
    rate1001_1100: number;
    rate1101_1200: number;
    rate1201_1300: number;
    rate1301_1400: number;
    rate1401_1500: number;
    rate1501_1600: number;
    rate1600_plus: number;
    rate1_500: number;
  };
}

const EnhancedInvoiceForm: React.FC<EnhancedInvoiceFormProps> = ({ onClose, onSave }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [slabRateConfig, setSlabRateConfig] = useState<SlabRateConfig | null>(null);
  const [customSlabs, setCustomSlabs] = useState<CustomSlab[]>([]);
  const [slabNames, setSlabNames] = useState({
    type1: 'Slab #1',
    type2: 'Slab #2', 
    type3: 'Slab #3'
  });
  const [calculatedRates, setCalculatedRates] = useState<any>(null);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  
  // Customer search functionality
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    serviceType: 'Bore Drilling', // Default service type
    location: '',
    serviceDate: new Date().toISOString().split('T')[0],
    description: '',
    totalDepth: 0,
    slabRateType: '1', // Default to type 1
    startingRate: 75, // Default starting rate
    pvc7Inch: 0,
    pvc10Inch: 0,
    pvc7InchRate: 400, // ₹400 per foot for 7" PVC
    pvc10InchRate: 700, // ₹700 per foot for 10" PVC
    bata: 2000,
    notes: '',
    terms: `Payment is due within 30 days. 6-month warranty on workmanship. 24-hour cancellation notice required.`,
    enableTax: false,
    taxRate: 18,
    advanceAmount: 0
  });

  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: ''
  });

  const loadCustomers = () => {
    try {
      const allCustomers = customerService.getAll();
      setCustomers(allCustomers);
      setFilteredCustomers(allCustomers);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  // Filter customers based on search term
  const filterCustomers = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [customers]);

  useEffect(() => {
    loadCustomers();
    loadSlabRateConfig();
    loadServiceTypes();
  }, []);

  // Update filtered customers when customers list changes
  useEffect(() => {
    filterCustomers(customerSearchTerm);
  }, [customers, filterCustomers, customerSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.customer-dropdown-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle customer search
  const handleCustomerSearch = (searchTerm: string) => {
    setCustomerSearchTerm(searchTerm);
    filterCustomers(searchTerm);
    setShowCustomerDropdown(true);
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setFormData({ ...formData, customerId: customer.id });
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(false);
  };

  // Get selected customer details
  const getSelectedCustomer = () => {
    return customers.find(customer => customer.id === formData.customerId);
  };

  const loadSlabRateConfig = () => {
    try {
      const savedConfig = localStorage.getItem('anjaneya_slab_rate_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setSlabRateConfig(parsed);
      }
      
      // Load custom slab names
      const savedNames = localStorage.getItem('anjaneya_slab_names');
      if (savedNames) {
        const parsedNames = JSON.parse(savedNames);
        setSlabNames(parsedNames);
      }

      // Load custom slabs
      const savedCustomSlabs = localStorage.getItem('anjaneya_custom_slabs');
      if (savedCustomSlabs) {
        const parsedCustomSlabs = JSON.parse(savedCustomSlabs);
        setCustomSlabs(parsedCustomSlabs);
      }
    } catch (error) {
      console.error('Error loading slab rate config:', error);
    }
  };

  const loadServiceTypes = () => {
    try {
      const allServiceTypes = serviceTypeService.getAllServiceTypes();
      setServiceTypes(allServiceTypes);
    } catch (error) {
      console.error('Error loading service types:', error);
    }
  };

  const generateDefaultRates = (startRate: number, type: 'type1' | 'type2' | 'type3') => {
    const rates: { [key: string]: number } = {};
    
    if (type === 'type2') {
      // Enhanced Slab #2 with 100-foot increments
      const type2Ranges = [
        'rate1_100', 'rate101_200', 'rate201_300', 'rate301_400', 'rate401_500',
        'rate501_600', 'rate601_700', 'rate701_800', 'rate801_900', 'rate901_1000',
        'rate1001_1100', 'rate1101_1200', 'rate1201_1300', 'rate1301_1400',
        'rate1401_1500', 'rate1501_1600', 'rate1600_plus'
      ];
      
      const type2Increments = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      
      type2Ranges.forEach((key, index) => {
        rates[key] = startRate + type2Increments[index];
      });
    } else {
      // Pattern for type1 and type3: 1-300ft calc +0, 301-400ft calc +5, 401-500ft calc +10, etc.
      const increments = [0, 5, 10, 20, 30, 40, 50, 60];
      
      const rateKeys = [
        'rate1_300', 'rate301_400', 'rate401_500', 'rate501_600',
        'rate601_700', 'rate701_800', 'rate801_900', 'rate901_1000'
      ];
      
      rateKeys.forEach((key, index) => {
        rates[key] = startRate + increments[index];
      });
      
      const baseFor1001Plus = startRate + 60;
      const additionalRanges = [
        'rate1001_1100', 'rate1101_1200', 'rate1201_1300', 'rate1301_1400',
        'rate1401_1500', 'rate1501_1600', 'rate1600_plus'
      ];
      
      additionalRanges.forEach((key, index) => {
        rates[key] = baseFor1001Plus + ((index + 1) * 100);
      });
      
      if (type === 'type3') {
        rates['rate1_500'] = startRate;
      }
    }
    
    return rates;
  };

  // Enhanced slab rate calculation with detailed breakdown
  const calculateSlabRateWithBreakdown = useCallback((depth: number, rates: any) => {
    let totalCost = 0;
    let remainingDepth = depth;
    const breakdown = [];
    
    // Check if it's a custom slab to use custom ranges
    const customSlab = customSlabs.find(slab => slab.id === formData.slabRateType);
    let ranges;
    
    if (customSlab) {
      // Use custom slab ranges
      ranges = customSlab.ranges.map(range => ({
        key: range.key,
        from: range.start,
        to: range.end,
        label: range.label
      }));
    } else {
      // Use default ranges
      ranges = [
        { key: 'rate1_300', from: 1, to: 300, label: '1-300 feet' },
        { key: 'rate301_400', from: 301, to: 400, label: '301-400 feet' },
        { key: 'rate401_500', from: 401, to: 500, label: '401-500 feet' },
        { key: 'rate501_600', from: 501, to: 600, label: '501-600 feet' },
        { key: 'rate601_700', from: 601, to: 700, label: '601-700 feet' },
        { key: 'rate701_800', from: 701, to: 800, label: '701-800 feet' },
        { key: 'rate801_900', from: 801, to: 900, label: '801-900 feet' },
        { key: 'rate901_1000', from: 901, to: 1000, label: '901-1000 feet' },
        { key: 'rate1001_1100', from: 1001, to: 1100, label: '1001-1100 feet' },
        { key: 'rate1101_1200', from: 1101, to: 1200, label: '1101-1200 feet' },
        { key: 'rate1201_1300', from: 1201, to: 1300, label: '1201-1300 feet' },
        { key: 'rate1301_1400', from: 1301, to: 1400, label: '1301-1400 feet' },
        { key: 'rate1401_1500', from: 1401, to: 1500, label: '1401-1500 feet' },
        { key: 'rate1501_1600', from: 1501, to: 1600, label: '1501-1600 feet' },
        { key: 'rate1600_plus', from: 1601, to: 9999, label: '1600+ feet' }
      ];
    }

    // Handle type2 differently if it's not a custom slab
    if (!customSlab && formData.slabRateType === '2') {
      ranges = [
        { key: 'rate1_100', from: 1, to: 100, label: '1-100 feet' },
        { key: 'rate101_200', from: 101, to: 200, label: '101-200 feet' },
        { key: 'rate201_300', from: 201, to: 300, label: '201-300 feet' },
        { key: 'rate301_400', from: 301, to: 400, label: '301-400 feet' },
        { key: 'rate401_500', from: 401, to: 500, label: '401-500 feet' },
        { key: 'rate501_600', from: 501, to: 600, label: '501-600 feet' },
        { key: 'rate601_700', from: 601, to: 700, label: '601-700 feet' },
        { key: 'rate701_800', from: 701, to: 800, label: '701-800 feet' },
        { key: 'rate801_900', from: 801, to: 900, label: '801-900 feet' },
        { key: 'rate901_1000', from: 901, to: 1000, label: '901-1000 feet' },
        { key: 'rate1001_1100', from: 1001, to: 1100, label: '1001-1100 feet' },
        { key: 'rate1101_1200', from: 1101, to: 1200, label: '1101-1200 feet' },
        { key: 'rate1201_1300', from: 1201, to: 1300, label: '1201-1300 feet' },
        { key: 'rate1301_1400', from: 1301, to: 1400, label: '1301-1400 feet' },
        { key: 'rate1401_1500', from: 1401, to: 1500, label: '1401-1500 feet' },
        { key: 'rate1501_1600', from: 1501, to: 1600, label: '1501-1600 feet' },
        { key: 'rate1600_plus', from: 1601, to: 9999, label: '1600+ feet' }
      ];
    }

    // Calculate breakdown using the determined ranges
    for (const range of ranges) {
      if (remainingDepth <= 0) break;
      
      if (depth >= range.from) {
        const rangeStart = Math.max(1, range.from);
        const rangeEnd = Math.min(depth, range.to);
        const applicableDepth = rangeEnd - rangeStart + 1;
        
        if (applicableDepth > 0) {
          const rate = rates[range.key] || 0;
          const cost = applicableDepth * rate;
          totalCost += cost;
          
          breakdown.push({
            range: range.label,
            depth: applicableDepth,
            rate: rate,
            cost: cost,
            calculation: `${applicableDepth} ft × ₹${rate}/ft = ₹${cost.toLocaleString('en-IN')}`
          });
        }
      }
    }
    
    return { totalCost, breakdown };
  }, [formData.slabRateType, customSlabs]);


  const calculateRates = useCallback(() => {
    if (!slabRateConfig || formData.totalDepth <= 0) return;

    let rates: { [key: string]: number };
    
    // Check if it's a custom slab
    const customSlab = customSlabs.find(slab => slab.id === formData.slabRateType);
    if (customSlab) {
      // Use custom slab rates
      rates = customSlab.rates;
    } else {
      // Use standard slab rates
      const typeKey = `type${formData.slabRateType}` as keyof SlabRateConfig;
      rates = generateDefaultRates(formData.startingRate, typeKey);
    }
    
    // Get detailed breakdown
    const slabResult = calculateSlabRateWithBreakdown(formData.totalDepth, rates);
    const slabCost = slabResult.totalCost;
    const slabBreakdown = slabResult.breakdown;
    
    const pvc7Cost = formData.pvc7Inch * formData.pvc7InchRate;
    const pvc10Cost = formData.pvc10Inch * formData.pvc10InchRate;
    const subtotal = slabCost + pvc7Cost + pvc10Cost + formData.bata;
    const taxAmount = formData.enableTax ? (subtotal * formData.taxRate) / 100 : 0;
    const total = subtotal + taxAmount;

    setCalculatedRates({
      slabCost,
      pvc7Cost,
      pvc10Cost,
      bata: formData.bata,
      subtotal,
      taxAmount,
      total,
      rates,
      slabBreakdown
    });
  }, [slabRateConfig, formData.totalDepth, formData.slabRateType, formData.startingRate, formData.pvc7Inch, formData.pvc10Inch, formData.pvc7InchRate, formData.pvc10InchRate, formData.bata, formData.enableTax, formData.taxRate, calculateSlabRateWithBreakdown, customSlabs]);

  useEffect(() => {
    calculateRates();
  }, [calculateRates]);


  const handleAddNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCustomerData.name.trim() || !newCustomerData.address.trim() || !newCustomerData.phoneNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const customerWithBilling = {
        ...newCustomerData,
        billingStatus: 'UNPAID' as 'PAID' | 'UNPAID',
        paymentAmount: 0,
        totalOutstanding: 0
      };
      const customer = customerService.create(customerWithBilling);
      setCustomers([...customers, customer]);
      setFormData({ ...formData, customerId: customer.id });
      setCustomerSearchTerm(customer.name);
      setShowNewCustomerForm(false);
      setShowCustomerDropdown(false);
      setNewCustomerData({ name: '', address: '', phoneNumber: '', whatsappNumber: '', email: '' });
      toast.success('Customer added successfully');
    } catch (error) {
      toast.error('Failed to add customer');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.serviceType || !formData.location || formData.totalDepth <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    const invoiceData = {
      ...formData,
      customer: selectedCustomer,
      calculatedRates,
      invoiceNumber: invoiceNumberService.generateInvoiceNumber(),
      createdAt: new Date(),
      status: 'draft'
    };

    onSave(invoiceData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Invoice
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                  
                  {/* Customer Selection */}
                  <div className="relative customer-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer *
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={customerSearchTerm}
                            onChange={(e) => handleCustomerSearch(e.target.value)}
                            onFocus={() => setShowCustomerDropdown(true)}
                            placeholder="Search customers by name, phone, or email..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Customer Dropdown */}
                        {showCustomerDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredCustomers.length === 0 ? (
                              <div className="p-3 text-center text-sm text-gray-500">
                                {customerSearchTerm ? 'No customers found matching your search' : 'No customers available'}
                              </div>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <div
                                  key={customer.id}
                                  onClick={() => handleCustomerSelect(customer)}
                                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                                    formData.customerId === customer.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{customer.name}</div>
                                      <div className="text-sm text-gray-600">{customer.phoneNumber}</div>
                                      {customer.email && (
                                        <div className="text-sm text-gray-500">{customer.email}</div>
                                      )}
                                      {customer.address && (
                                        <div className="text-sm text-gray-500 truncate">{customer.address}</div>
                                      )}
                                    </div>
                                    {formData.customerId === customer.id && (
                                      <div className="text-blue-600">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewCustomerForm(true)}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                        title="Add New Customer"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Selected Customer Info */}
                    {formData.customerId && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-sm">
                          <span className="font-medium text-blue-900">Selected: </span>
                          <span className="text-blue-700">{getSelectedCustomer()?.name}</span>
                          <span className="text-blue-600 ml-2">({getSelectedCustomer()?.phoneNumber})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {serviceTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter service location"
                      required
                    />
                  </div>

                  {/* Service Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Date *
                    </label>
                    <input
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Right Column - Slab Rate Configuration */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 border-b pb-2">Slab Rate Configuration</h4>
                  
                  {/* Slab Rate Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slab Rate Type *
                    </label>
                    <select
                      value={formData.slabRateType}
                      onChange={(e) => setFormData({ ...formData, slabRateType: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="1">{slabNames.type1}: Standard (1-300, 301-400, 401-500...)</option>
                      <option value="2">{slabNames.type2}: Enhanced (1-100, 101-200, 201-300...)</option>
                      <option value="3">{slabNames.type3}: Manual Configuration</option>
                      {customSlabs.map((slab) => (
                        <option key={slab.id} value={slab.id}>
                          {slab.name}: Custom ({slab.ranges.length} ranges)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Starting Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Starting Rate (₹/ft) *
                    </label>
                    <input
                      type="number"
                      value={formData.startingRate}
                      onChange={(e) => setFormData({ ...formData, startingRate: parseFloat(e.target.value) || 75 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="75"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be used as the base rate for automatic calculation
                    </p>
                  </div>

                  {/* Total Depth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Depth (feet) *
                    </label>
                    <input
                      type="number"
                      value={formData.totalDepth}
                      onChange={(e) => setFormData({ ...formData, totalDepth: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter total drilling depth"
                      required
                    />
                  </div>

                  {/* PVC Rates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        7" PVC (feet)
                      </label>
                      <input
                        type="number"
                        value={formData.pvc7Inch}
                        onChange={(e) => setFormData({ ...formData, pvc7Inch: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        7" PVC Rate (₹/ft)
                      </label>
                      <input
                        type="number"
                        value={formData.pvc7InchRate}
                        onChange={(e) => setFormData({ ...formData, pvc7InchRate: parseFloat(e.target.value) || 400 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        10" PVC (feet)
                      </label>
                      <input
                        type="number"
                        value={formData.pvc10Inch}
                        onChange={(e) => setFormData({ ...formData, pvc10Inch: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        10" PVC Rate (₹/ft)
                      </label>
                      <input
                        type="number"
                        value={formData.pvc10InchRate}
                        onChange={(e) => setFormData({ ...formData, pvc10InchRate: parseFloat(e.target.value) || 700 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="700"
                      />
                    </div>
                  </div>

                  {/* Bata */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bata (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.bata}
                      onChange={(e) => setFormData({ ...formData, bata: parseFloat(e.target.value) || 2000 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2000"
                    />
                  </div>
                </div>
              </div>

              {/* Calculation Results */}
              {calculatedRates && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-md font-medium text-blue-900 mb-3 flex items-center">
                    <CalculatorIcon className="h-5 w-5 mr-2" />
                    Calculation Results
                  </h4>
                  {/* Detailed Slab Rate Breakdown */}
                  {calculatedRates.slabBreakdown && calculatedRates.slabBreakdown.length > 0 && (
                    <div className="mb-4 p-3 bg-white rounded border border-blue-200">
                      <h5 className="text-sm font-semibold text-blue-900 mb-2">
                        Slab Rate Breakdown for {formData.totalDepth} feet:
                      </h5>
                      <div className="space-y-1 text-xs">
                        {calculatedRates.slabBreakdown.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-700">{item.range}:</span>
                            <span className="font-medium text-blue-800">{item.calculation}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-blue-200 font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-900">Total Slab Cost:</span>
                            <span className="text-blue-900">₹{calculatedRates.slabCost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Depth:</span>
                      <div className="font-semibold text-blue-900">{formData.totalDepth} feet</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Slab Cost:</span>
                      <div className="font-semibold text-blue-900">₹{calculatedRates.slabCost.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">7" PVC:</span>
                      <div className="font-semibold text-blue-900">₹{calculatedRates.pvc7Cost.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">10" PVC:</span>
                      <div className="font-semibold text-blue-900">₹{calculatedRates.pvc10Cost.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Bata:</span>
                      <div className="font-semibold text-blue-900">₹{calculatedRates.bata.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-blue-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-900">₹{calculatedRates.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Create Invoice
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowNewCustomerForm(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddNewCustomer}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add New Customer
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomerForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomerData.name}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter customer name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newCustomerData.phoneNumber}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, phoneNumber: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newCustomerData.address}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter complete address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={newCustomerData.whatsappNumber}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, whatsappNumber: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter WhatsApp number (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={newCustomerData.email}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedInvoiceForm;
