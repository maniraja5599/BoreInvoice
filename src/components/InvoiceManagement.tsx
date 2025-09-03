import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  MapPinIcon,
  EyeIcon,
  Cog6ToothIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { ServiceInvoice, Customer, InvoiceItem, ServiceDetails } from '../types';
import { customerService } from '../services/borewellService';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ServiceInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<ServiceInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<ServiceInvoice | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDepth, setEditDepth] = useState<number>(0);
  const [editPVC7, setEditPVC7] = useState<number>(0);
  const [editPVC10, setEditPVC10] = useState<number>(0);
  const [editBata, setEditBata] = useState<number>(2000);

  const openEdit = (invoice: ServiceInvoice) => {
    setEditingInvoice(invoice);
    // derive depth and pvc from items
    const items = invoice.items || [];
    const depth = items
      .filter(i => (i.type === 'service') && (i.description || '').toLowerCase().includes('drilling'))
      .reduce((sum, i) => sum + (i.quantity || 0), 0);
    const pvc7 = items
      .filter(i => (i.description || '').includes('7" PVC'))
      .reduce((sum, i) => sum + (i.quantity || 0), 0);
    const pvc10 = items
      .filter(i => (i.description || '').includes('10" PVC'))
      .reduce((sum, i) => sum + (i.quantity || 0), 0);
    const bataItem = items.find(i => (i.description || '').toUpperCase() === 'BATA');
    setEditDepth(depth || 0);
    setEditPVC7(pvc7 || 0);
    setEditPVC10(pvc10 || 0);
    setEditBata((bataItem?.rate as number) || (bataItem?.amount as number) || 2000);
    setShowEditModal(true);
  };
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerId: '',
    serviceType: '',
    customServiceType: '',
    location: '',
    serviceDate: new Date().toISOString().split('T')[0],
    description: '',
    totalDepth: 0,
    pvc7Inch: 0,
    pvc10Inch: 0,
    bata: 2000,
    slabRateType: '1', // 1, 2, or 3
    existingBoreDepth: 0, // For type 3 (rebore)
    existingBoreRate: 40, // Rate per foot for existing bore
    reboreSlabType: '1', // For type 3: which slab rate to use (1 or 2)
    notes: '',
    terms: `Payment is due within 30 days. 6-month warranty on workmanship. 24-hour cancellation notice required.`,
    enableTax: false,
    taxRate: 18,
    advanceAmount: 0
  });

  // Load slab rate configuration from localStorage
  const [slabRateConfig, setSlabRateConfig] = useState({
    type1: {
      rate1_300: 200,
      rate301_400: 210,
      rate401_500: 220,
      rate501_600: 230,
      rate601_700: 240,
      rate701_800: 250,
      rate801_900: 260,
      rate901_1000: 270,
      rate1001_1100: 280,
      rate1101_1200: 290,
      rate1201_1300: 300,
      rate1301_1400: 310,
      rate1401_1500: 320,
      rate1501_1600: 330,
      rate1600_plus: 340
    },
    type2: {
      rate1_500: 200,
      rate501_600: 210,
      rate601_700: 220,
      rate701_800: 230,
      rate801_900: 240,
      rate901_1000: 250,
      rate1001_1100: 260,
      rate1101_1200: 270,
      rate1201_1300: 280,
      rate1301_1400: 290,
      rate1401_1500: 300,
      rate1501_1600: 310,
      rate1600_plus: 320
    },
    type3: {
      rate1_300: 200,
      rate301_400: 210,
      rate401_500: 220,
      rate501_600: 230,
      rate601_700: 240,
      rate701_800: 250,
      rate801_900: 260,
      rate901_1000: 270,
      rate1001_1100: 280,
      rate1101_1200: 290,
      rate1201_1300: 300,
      rate1301_1400: 310,
      rate1401_1500: 320,
      rate1501_1600: 330,
      rate1600_plus: 340,
      rate1_500: 200
    }
  });

  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const [customServiceTypes, setCustomServiceTypes] = useState<string[]>([]);

  // Predefined service types
  const predefinedServiceTypes = ['Bore Drilling', 'Repair', 'Flushing', 'Earth Purpose'];

  useEffect(() => {
    loadData();
    loadSlabRateConfig();
  }, []);

  // Global ESC handler to close any open panels in this screen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (viewingInvoice) setViewingInvoice(null);
        if (showEditModal) setShowEditModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal, viewingInvoice, showEditModal]);

  const loadSlabRateConfig = () => {
    try {
      const savedConfig = localStorage.getItem('anjaneya_slab_rate_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Ensure all required rate fields exist, fallback to defaults if missing
        const defaultRates = {
          type1: {
            rate1_300: 200,
            rate301_400: 210,
            rate401_500: 220,
            rate501_600: 230,
            rate601_700: 240,
            rate701_800: 250,
            rate801_900: 260,
            rate901_1000: 270,
            rate1001_1100: 280,
            rate1101_1200: 290,
            rate1201_1300: 300,
            rate1301_1400: 310,
            rate1401_1500: 320,
            rate1501_1600: 330,
            rate1600_plus: 340
          },
          type2: {
            rate1_500: 200,
            rate501_600: 210,
            rate601_700: 220,
            rate701_800: 230,
            rate801_900: 240,
            rate901_1000: 250,
            rate1001_1100: 260,
            rate1101_1200: 270,
            rate1201_1300: 280,
            rate1301_1400: 290,
            rate1401_1500: 300,
            rate1501_1600: 310,
            rate1600_plus: 320
          },
          type3: {
            rate1_300: 200,
            rate301_400: 210,
            rate401_500: 220,
            rate501_600: 230,
            rate601_700: 240,
            rate701_800: 250,
            rate801_900: 260,
            rate901_1000: 270,
            rate1001_1100: 280,
            rate1101_1200: 290,
            rate1201_1300: 300,
            rate1301_1400: 310,
            rate1401_1500: 320,
            rate1501_1600: 330,
            rate1600_plus: 340,
            rate1_500: 200
          }
        };
        
        // Merge saved config with defaults to ensure all fields exist
        const mergedConfig = {
          type1: { ...defaultRates.type1, ...parsed.type1 },
          type2: { ...defaultRates.type2, ...parsed.type2 },
          type3: { ...defaultRates.type3, ...parsed.type3 }
        };
        
        setSlabRateConfig(mergedConfig);
      }
    } catch (error) {
      console.error('Error loading slab rate config:', error);
    }
  };

  useEffect(() => {
    const filtered = invoices.filter(invoice =>
      invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.serviceDetails.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm]);

  const loadData = () => {
    try {
      const allCustomers = customerService.getAll();
      setCustomers(allCustomers);
      
      // Load invoices from localStorage (mock data for now)
      const storedInvoices = localStorage.getItem('anjaneya_invoices');
      const allInvoices = storedInvoices ? JSON.parse(storedInvoices) : [];
      setInvoices(allInvoices);
      setFilteredInvoices(allInvoices);

      // Load custom service types from localStorage
      const storedCustomTypes = localStorage.getItem('anjaneya_custom_service_types');
      const customTypes = storedCustomTypes ? JSON.parse(storedCustomTypes) : [];
      setCustomServiceTypes(customTypes);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };



  const calculateSlabRates = () => {
    const { totalDepth, pvc7Inch, pvc10Inch, bata, slabRateType, existingBoreDepth, existingBoreRate, reboreSlabType } = formData;
    
    let slabRate = 0;
    let existingBoreCost = 0;
    
    if (totalDepth > 0) {
      if (slabRateType === '1') {
        // #1 Slab Rate: 1-300 feet (using configured rates for all ranges)
        slabRate = calculateSlabRateByRanges(totalDepth, slabRateConfig.type1);
      } else if (slabRateType === '2') {
        // #2 Slab Rate: 1-500 feet (using configured rates for all ranges)
        slabRate = calculateSlabRateByRanges(totalDepth, slabRateConfig.type2);
      } else if (slabRateType === '3') {
        // #3 Slab Rate: For rebore/extension (existing bore + new drilling)
        if (existingBoreDepth > 0) {
          existingBoreCost = existingBoreDepth * existingBoreRate; // Cost for existing bore
        }
        
        // New drilling starts from existing bore depth, using selected slab rate type
        const newDrillingDepth = totalDepth - existingBoreDepth;
        if (newDrillingDepth > 0) {
          if (reboreSlabType === '1') {
            // Use Type #1 logic for new drilling
            slabRate = calculateSlabRateByRanges(newDrillingDepth, slabRateConfig.type3);
      } else {
            // Use Type #2 logic for new drilling
            slabRate = calculateSlabRateByRanges(newDrillingDepth, slabRateConfig.type3);
          }
        }
      }
    }

    // PVC casing rates (as per image)
    const pvc7InchRate = pvc7Inch * 400; // ₹400 per foot for 7" PVC
    const pvc10InchRate = pvc10Inch * 700; // ₹700 per foot for 10" PVC

    return {
      slabRate,
      pvc7InchRate,
      pvc10InchRate,
      bata: bata || 2000,
      existingBoreCost,
      total: slabRate + pvc7InchRate + pvc10InchRate + (bata || 2000) + existingBoreCost
    };
  };

  // Helper function to calculate slab rate based on depth ranges
  const calculateSlabRateByRanges = (depth: number, config: any) => {
    let totalRate = 0;
    let remainingDepth = depth;
    
    // Define depth ranges and their corresponding rate keys
    const ranges = [
      { maxDepth: 300, rateKey: 'rate1_300' },
      { maxDepth: 400, rateKey: 'rate301_400' },
      { maxDepth: 500, rateKey: 'rate401_500' },
      { maxDepth: 600, rateKey: 'rate501_600' },
      { maxDepth: 700, rateKey: 'rate601_700' },
      { maxDepth: 800, rateKey: 'rate701_800' },
      { maxDepth: 900, rateKey: 'rate801_900' },
      { maxDepth: 1000, rateKey: 'rate901_1000' },
      { maxDepth: 1100, rateKey: 'rate1001_1100' },
      { maxDepth: 1200, rateKey: 'rate1101_1200' },
      { maxDepth: 1300, rateKey: 'rate1201_1300' },
      { maxDepth: 1400, rateKey: 'rate1301_1400' },
      { maxDepth: 1500, rateKey: 'rate1401_1500' },
      { maxDepth: 1600, rateKey: 'rate1501_1600' },
      { maxDepth: Infinity, rateKey: 'rate1600_plus' }
    ];
    
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const prevMaxDepth = i === 0 ? 0 : ranges[i - 1].maxDepth;
      
      if (remainingDepth > prevMaxDepth) {
        const depthInThisRange = Math.min(remainingDepth - prevMaxDepth, range.maxDepth - prevMaxDepth);
        const rate = config[range.rateKey] || 0;
        totalRate += depthInThisRange * rate;
        
        if (remainingDepth <= range.maxDepth) {
          break;
        }
      }
    }
    
    return totalRate;
  };

  // Helper function to create drilling items for invoice
  const createDrillingItems = (allItems: InvoiceItem[], depth: number, config: any, prefix: string, startDepth: number) => {
    let remainingDepth = depth;
    
    // Define depth ranges and their corresponding rate keys
    const ranges = [
      { maxDepth: 300, rateKey: 'rate1_300', label: '1-300' },
      { maxDepth: 400, rateKey: 'rate301_400', label: '301-400' },
      { maxDepth: 500, rateKey: 'rate401_500', label: '401-500' },
      { maxDepth: 600, rateKey: 'rate501_600', label: '501-600' },
      { maxDepth: 700, rateKey: 'rate601_700', label: '601-700' },
      { maxDepth: 800, rateKey: 'rate701_800', label: '701-800' },
      { maxDepth: 900, rateKey: 'rate801_900', label: '801-900' },
      { maxDepth: 1000, rateKey: 'rate901_1000', label: '901-1000' },
      { maxDepth: 1100, rateKey: 'rate1001_1100', label: '1001-1100' },
      { maxDepth: 1200, rateKey: 'rate1101_1200', label: '1101-1200' },
      { maxDepth: 1300, rateKey: 'rate1201_1300', label: '1201-1300' },
      { maxDepth: 1400, rateKey: 'rate1301_1400', label: '1301-1400' },
      { maxDepth: 1500, rateKey: 'rate1401_1500', label: '1401-1500' },
      { maxDepth: 1600, rateKey: 'rate1501_1600', label: '1501-1600' },
      { maxDepth: Infinity, rateKey: 'rate1600_plus', label: '1600+' }
    ];
    
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const prevMaxDepth = i === 0 ? 0 : ranges[i - 1].maxDepth;
      
      if (remainingDepth > prevMaxDepth) {
        const depthInThisRange = Math.min(remainingDepth - prevMaxDepth, range.maxDepth - prevMaxDepth);
        const rate = config[range.rateKey] || 0;
        
        if (depthInThisRange > 0) {
          const description = startDepth > 0 
            ? `${prefix} ${range.label} (from ${startDepth + prevMaxDepth + 1})`
            : `${prefix} ${range.label}`;
          
          allItems.push({
            id: `slab_${range.label.replace(/\s+/g, '_')}_${Date.now()}_${Math.random()}`,
            description: description,
            quantity: depthInThisRange,
            unit: 'feet',
            rate: rate,
            amount: depthInThisRange * rate,
            type: 'service'
          });
        }
        
        if (remainingDepth <= range.maxDepth) {
          break;
        }
      }
    }
  };

  // Helper function to render slab rate breakdown for display
  const renderSlabRateBreakdown = (depth: number, config: any, prefix: string, startDepth: number) => {
    let remainingDepth = depth;
    const breakdownItems = [];
    
    // Define depth ranges and their corresponding rate keys
    const ranges = [
      { maxDepth: 300, rateKey: 'rate1_300', label: '1-300' },
      { maxDepth: 400, rateKey: 'rate301_400', label: '301-400' },
      { maxDepth: 500, rateKey: 'rate401_500', label: '401-500' },
      { maxDepth: 600, rateKey: 'rate501_600', label: '501-600' },
      { maxDepth: 700, rateKey: 'rate601_700', label: '601-700' },
      { maxDepth: 800, rateKey: 'rate701_800', label: '701-800' },
      { maxDepth: 900, rateKey: 'rate801_900', label: '801-900' },
      { maxDepth: 1000, rateKey: 'rate901_1000', label: '901-1000' },
      { maxDepth: 1100, rateKey: 'rate1001_1100', label: '1001-1100' },
      { maxDepth: 1200, rateKey: 'rate1101_1200', label: '1101-1200' },
      { maxDepth: 1300, rateKey: 'rate1201_1300', label: '1201-1300' },
      { maxDepth: 1400, rateKey: 'rate1301_1400', label: '1301-1400' },
      { maxDepth: 1500, rateKey: 'rate1401_1500', label: '1401-1500' },
      { maxDepth: 1600, rateKey: 'rate1501_1600', label: '1501-1600' },
      { maxDepth: Infinity, rateKey: 'rate1600_plus', label: '1600+' }
    ];
    
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const prevMaxDepth = i === 0 ? 0 : ranges[i - 1].maxDepth;
      
      if (remainingDepth > prevMaxDepth) {
        const depthInThisRange = Math.min(remainingDepth - prevMaxDepth, range.maxDepth - prevMaxDepth);
        const rate = config[range.rateKey] || 0;
        
        if (depthInThisRange > 0) {
          const bgColor = i === 0 ? 'bg-blue-50' : 
                         i === 1 ? 'bg-green-50' : 
                         i === 2 ? 'bg-yellow-50' : 
                         i === 3 ? 'bg-orange-50' : 
                         i === 4 ? 'bg-red-50' : 
                         i === 5 ? 'bg-pink-50' : 
                         i === 6 ? 'bg-indigo-50' : 
                         i === 7 ? 'bg-purple-50' : 
                         i === 8 ? 'bg-teal-50' : 
                         i === 9 ? 'bg-cyan-50' : 
                         i === 10 ? 'bg-lime-50' : 
                         i === 11 ? 'bg-amber-50' : 
                         i === 12 ? 'bg-emerald-50' : 
                         i === 13 ? 'bg-violet-50' : 'bg-gray-50';
          
          breakdownItems.push(
            <div key={range.label} className={`${bgColor} p-2 rounded border`}>
              <span className="text-gray-600">{range.label} ft:</span>
              <div className="font-medium">{depthInThisRange} ft × ₹{rate} = ₹{(depthInThisRange * rate).toFixed(2)}</div>
            </div>
          );
        }
        
        if (remainingDepth <= range.maxDepth) {
          break;
        }
      }
    }
    
    return breakdownItems;
  };

  const addCustomServiceType = () => {
    if (!formData.customServiceType.trim()) {
      toast.error('Please enter a service type name');
      return;
    }

    const newType = formData.customServiceType.trim();
    if (predefinedServiceTypes.includes(newType) || customServiceTypes.includes(newType)) {
      toast.error('This service type already exists');
      return;
    }

    const updatedCustomTypes = [...customServiceTypes, newType];
    setCustomServiceTypes(updatedCustomTypes);
    localStorage.setItem('anjaneya_custom_service_types', JSON.stringify(updatedCustomTypes));
    
    setFormData({
      ...formData,
      serviceType: newType,
      customServiceType: ''
    });
    setShowCustomServiceInput(false);
    toast.success('Custom service type added successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.serviceType || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if slab rates are calculated
    const initialSlabRates = calculateSlabRates();
    if (initialSlabRates.total === 2000) {
      toast.error('Please enter borewell depth for slab rate calculation');
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) {
      toast.error('Customer not found');
      return;
    }

    const slabRates = calculateSlabRates();

    // Create items from slab rates with breakdown as per image
    const allItems: InvoiceItem[] = [];
    
        // Add slab rate items with breakdown by depth ranges based on slab rate type
    if (slabRates.slabRate > 0 || slabRates.existingBoreCost > 0) {
      const { totalDepth, slabRateType, existingBoreDepth } = formData;
      
      // Add existing bore cost item for type 3
      if (slabRateType === '3' && slabRates.existingBoreCost > 0) {
      allItems.push({
          id: `existing_bore_${Date.now()}`,
          description: `Existing Bore (${existingBoreDepth} feet)`,
          quantity: existingBoreDepth,
        unit: 'feet',
          rate: formData.existingBoreRate,
          amount: slabRates.existingBoreCost,
        type: 'service'
      });
      }
      
      if (slabRates.slabRate > 0) {
        if (slabRateType === '1') {
          // #1 Slab Rate: Create items for all depth ranges
          createDrillingItems(allItems, totalDepth, slabRateConfig.type1, 'Drilling', 0);
        } else if (slabRateType === '2') {
          // #2 Slab Rate: Create items for all depth ranges
          createDrillingItems(allItems, totalDepth, slabRateConfig.type2, 'Drilling', 0);
        } else if (slabRateType === '3') {
          // #3 Slab Rate: For rebore/extension
          const newDrillingDepth = totalDepth - existingBoreDepth;
          if (newDrillingDepth > 0) {
            if (formData.reboreSlabType === '1') {
              // Use Type #1 logic for new drilling
              createDrillingItems(allItems, newDrillingDepth, slabRateConfig.type3, 'New Drilling', existingBoreDepth);
            } else {
              // Use Type #2 logic for new drilling
              createDrillingItems(allItems, newDrillingDepth, slabRateConfig.type3, 'New Drilling', existingBoreDepth);
            }
          }
        }
      }
    }

    if (slabRates.pvc7InchRate > 0) {
      allItems.push({
        id: `pvc7_${Date.now()}`,
        description: '7" PVC',
        quantity: formData.pvc7Inch,
        unit: 'feet',
        rate: 400,
        amount: slabRates.pvc7InchRate,
        type: 'material'
      });
    }

    if (slabRates.pvc10InchRate > 0) {
      allItems.push({
        id: `pvc10_${Date.now()}`,
        description: '10" PVC',
        quantity: formData.pvc10Inch,
        unit: 'feet',
        rate: 700,
        amount: slabRates.pvc10InchRate,
        type: 'material'
      });
    }

    if (slabRates.bata > 0) {
      allItems.push({
        id: `bata_${Date.now()}`,
        description: 'BATA',
        quantity: 1,
        unit: 'Per Bore',
        rate: slabRates.bata,
        amount: slabRates.bata,
        type: 'additional'
      });
    }

    const finalSubtotal = allItems.reduce((sum, item) => sum + item.amount, 0);
    const finalTaxAmount = formData.enableTax ? finalSubtotal * (formData.taxRate / 100) : 0;
    const finalTotal = finalSubtotal + finalTaxAmount;

    const serviceDetails: ServiceDetails = {
      id: `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceType: formData.serviceType,
      location: formData.location,
      serviceDate: new Date(formData.serviceDate),
      description: formData.description,
      materials: []
    };

    const invoiceData = {
      customerId: formData.customerId,
      serviceDetails,
      items: allItems,
      subtotal: finalSubtotal,
      taxAmount: finalTaxAmount,
      taxRate: formData.enableTax ? formData.taxRate / 100 : 0,
      totalAmount: finalTotal,
      paidAmount: formData.advanceAmount || 0,
      pendingAmount: Math.max(finalTotal - (formData.advanceAmount || 0), 0),
      notes: formData.notes,
      terms: formData.terms
    };

    try {
      // API call to create invoice
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Invoice created successfully:', result);

      // Save to localStorage as well
      const newInvoice: ServiceInvoice = {
        ...result.data,
        customer,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        invoiceDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedInvoices = [...invoices, newInvoice];
      setInvoices(updatedInvoices);
      localStorage.setItem('anjaneya_invoices', JSON.stringify(updatedInvoices));

      toast.success('Invoice created successfully');
      handleCloseModal();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const generatePDF = (invoice: ServiceInvoice) => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 10;
      let y = 12;

      // Simple header
      // Load company details from settings
      let companyName = 'Anjaneya Borewells';
      let companyContact = '+91 98765 43210';
      let companyAddress = '123 Main Street, City, State - PIN';
      let companyLogo: string | undefined;
      let companyTagline = '';
      try {
        const saved = localStorage.getItem('anjaneya_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          companyName = parsed?.company?.name || companyName;
          companyContact = parsed?.company?.contact || companyContact;
          companyAddress = parsed?.company?.address || companyAddress;
          companyLogo = parsed?.company?.logo || parsed?.company?.logoDataUrl || companyLogo;
          companyTagline = parsed?.company?.tagline || companyTagline;
        }
      } catch {}

      // Clean white header band (template style)
      const headerHeight = 42;
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');

      // Header titles (company left, details right)
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(companyName || 'Anjaneya Borewells', marginX, 18);
      if (companyTagline) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(companyTagline, marginX, 24);
      }

      // Right-side key details
      const rightLabelX = pageWidth - marginX - 65;
      const rightValueX = pageWidth - marginX;
      let headerLineY = 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Date:', rightLabelX, headerLineY);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.invoiceDate).toLocaleDateString(), rightValueX, headerLineY, { align: 'right' });
      headerLineY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Number:', rightLabelX, headerLineY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${invoice.invoiceNumber || 'N/A'}`, rightValueX, headerLineY, { align: 'right' });
      headerLineY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Estimate For:', rightLabelX, headerLineY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${invoice.customer.name || ''}`, rightValueX, headerLineY, { align: 'right' });

      // Optional logo in header (left)
      if (companyLogo && companyLogo.startsWith('data:image')) {
        try {
          (doc as any).addImage(companyLogo, 'PNG', marginX, 3, 12, 12);
        } catch (e) {
          // ignore logo errors
        }
      }

      // Status badge removed (no DRAFT label on PDF)
      let headerBottomY = headerHeight + 6;
      y = headerBottomY;

      // Optional watermark for PAID
      if (invoice.status && invoice.status.toUpperCase() === 'PAID') {
        doc.setTextColor(180, 180, 180);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(60);
        (doc as any).text('PAID', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 30 });
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }

      y = 22;

      // Company details (left)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Company', marginX, y);
    doc.setFont('helvetica', 'normal');
      const addrLines = doc.splitTextToSize(companyAddress, 90);
      doc.text(`Contact: ${companyContact}`, marginX, y + 5);
      doc.text(addrLines, marginX, y + 10);

      // Billing to block (left) and Invoice info (right)
      const blockTop = headerHeight + 10;
      const leftBlockW = (pageWidth - marginX * 2) * 0.5 - 5;
      const rightBlockX = marginX + leftBlockW + 10;
      // Billing To
      doc.setFillColor(27, 94, 32);
      doc.rect(marginX, blockTop, 40, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('BILLING TO', marginX + 2, blockTop + 3.6);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.customer.name || '', marginX, blockTop + 11);
      doc.setFont('helvetica', 'normal');
      if (invoice.customer.phoneNumber) doc.text(`P: ${invoice.customer.phoneNumber}`, marginX, blockTop + 16);
      if (invoice.customer.email) doc.text(`E: ${invoice.customer.email}`, marginX, blockTop + 21);
      if (invoice.customer.address) {
        const lines = doc.splitTextToSize(`A: ${invoice.customer.address}`, leftBlockW);
        doc.text(lines, marginX, blockTop + 26);
      }

      // Invoice info (right)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(27, 94, 32);
      doc.setFontSize(12);
      doc.text('INVOICE', rightBlockX, blockTop + 2);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Invoice  : ${invoice.invoiceNumber || 'N/A'}`, rightBlockX, blockTop + 10);
      doc.text(`Date     : ${new Date(invoice.invoiceDate).toLocaleDateString()}`, rightBlockX, blockTop + 15);
      doc.text(`Due Date : ${new Date(invoice.dueDate).toLocaleDateString()}`, rightBlockX, blockTop + 20);
      y = blockTop + 28;

      // Advance cursor after header blocks
      const headerBlockHeight = Math.max(18, 12 + addrLines.length * 4);
      y += headerBlockHeight + 4;

      // Remove duplicate invoice and customer blocks (details already shown above)
      // Keep current y as starting point for the items table.

      // Items table - compact (template layout)
    const tableData = invoice.items.map((item, index) => [
      String(index + 1),
      item.description,
      `Rs. ${item.rate.toFixed(2)}`,
      String(item.quantity),
      `Rs. ${item.amount.toFixed(2)}`
    ]);
    
    (doc as any).autoTable({
        startY: y,
      head: [['ST', 'ITEM DESCRIPTION', 'RATE', 'QTY', 'AMOUNT']],
      body: tableData,
      theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.2, lineColor: [200, 230, 201], lineWidth: 0.2 },
        headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 249, 245] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 92, halign: 'left' },
          2: { cellWidth: 24, halign: 'right' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 28, halign: 'right' }
        },
        margin: { left: marginX, right: marginX },
        tableWidth: pageWidth - marginX * 2
      });

      let afterTableY = (doc as any).lastAutoTable.finalY + 6;

      // Totals - compact, right aligned
      const totalsX = pageWidth - marginX - 60;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      // decorative green accent line above totals
      doc.setDrawColor(46, 125, 50);
      doc.setLineWidth(0.4);
      doc.line(totalsX - 2, afterTableY - 3, pageWidth - marginX, afterTableY - 3);
      doc.text('Subtotal:', totalsX, afterTableY);
    doc.setFont('helvetica', 'normal');
      doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, totalsX + 40, afterTableY, { align: 'right' });
    
    if (invoice.taxAmount > 0) {
      doc.setFont('helvetica', 'bold');
        doc.text(`Tax (${(invoice.taxRate * 100).toFixed(0)}%):`, totalsX, afterTableY + 5);
      doc.setFont('helvetica', 'normal');
        doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, totalsX + 40, afterTableY + 5, { align: 'right' });
        afterTableY += 5;
      }

      // Advance
      if (invoice.paidAmount && invoice.paidAmount > 0) {
    doc.setFont('helvetica', 'bold');
        doc.text('Advance:', totalsX, afterTableY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Rs. ${invoice.paidAmount.toFixed(2)}`, totalsX + 40, afterTableY + 5, { align: 'right' });
        afterTableY += 5;
      }

      // Total and Balance
      doc.setFont('helvetica', 'bold');
      // highlight total row with light green
      doc.setFillColor(232, 245, 233);
      doc.rect(totalsX - 2, afterTableY + 2, 62, 6, 'F');
      doc.text('Total:', totalsX, afterTableY + 5);
      doc.text(`Rs. ${invoice.totalAmount.toFixed(2)}`, totalsX + 40, afterTableY + 5, { align: 'right' });
      afterTableY += 5;

      const balance = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Balance:', totalsX, afterTableY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Rs. ${Math.max(balance, 0).toFixed(2)}`, totalsX + 40, afterTableY + 5, { align: 'right' });
      afterTableY += 8;
    
      // Amount in words
      const words = numberToWordsIndian(Math.round(invoice.totalAmount || 0));
      if (words) {
        doc.setFont('helvetica', 'bold');
        doc.text('Amount in words:', marginX, afterTableY);
        doc.setFont('helvetica', 'normal');
        const wordsLines = doc.splitTextToSize(`${words} rupees only`, pageWidth - marginX * 2);
        doc.text(wordsLines, marginX + 32, afterTableY);
        afterTableY += 8 + (Array.isArray(wordsLines) ? wordsLines.length * 4 : 0);
      }

      // Notes & Terms block (styled)
      const boxWidth = pageWidth - marginX * 2;
      if (invoice.notes) {
        doc.setFillColor(232, 245, 233);
        doc.roundedRect(marginX, afterTableY, boxWidth, 12, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 94, 32);
        doc.text('Notes', marginX + 2, afterTableY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const noteLines = doc.splitTextToSize(invoice.notes, boxWidth - 4);
        doc.text(noteLines, marginX + 2, afterTableY + 9);
        afterTableY += 14 + (Array.isArray(noteLines) ? noteLines.length * 4 : 8);
      }
      if (invoice.terms) {
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(marginX, afterTableY, boxWidth, 12, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 94, 32);
        doc.text('Terms & Conditions', marginX + 2, afterTableY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const termLines = doc.splitTextToSize(invoice.terms, boxWidth - 4);
        doc.text(termLines, marginX + 2, afterTableY + 9);
        afterTableY += 14 + (Array.isArray(termLines) ? termLines.length * 4 : 8);
      }

      // Footer bar (letterpad style)
      doc.setFillColor(46, 125, 50);
      doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`${companyName} • ${companyAddress} • ${companyContact}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Reset text color to black before save
      doc.setTextColor(0, 0, 0);

      // No notes/terms to keep single page
      doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const shareToWhatsApp = (invoice: ServiceInvoice) => {
    const whatsappNumber = invoice.customer.whatsappNumber || invoice.customer.phoneNumber;
    const message = `Hello ${invoice.customer.name},\n\nYour invoice #${invoice.invoiceNumber} for ${invoice.serviceDetails.serviceType} service is ready.\n\nTotal Amount: ₹${invoice.totalAmount.toFixed(2)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nPlease contact us for payment.\n\nThank you,\nAnjaneya Borewells`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // setEditingInvoice(null);
    setFormData({
      customerId: '',
      serviceType: '',
      customServiceType: '',
      location: '',
      serviceDate: new Date().toISOString().split('T')[0],
      description: '',
      totalDepth: 0,
      pvc7Inch: 0,
      pvc10Inch: 0,
      bata: 2000,
      slabRateType: '1',
      existingBoreDepth: 0,
      existingBoreRate: 40,
      reboreSlabType: '1',
      notes: '',
      terms: `Payment is due within 30 days. 6-month warranty on workmanship. 24-hour cancellation notice required.`,
      enableTax: false,
      taxRate: 18,
      advanceAmount: 0
    });
    setShowCustomServiceInput(false);
  };

  const handleCloseViewModal = () => {
    setViewingInvoice(null);
  };

  const applyEditsToInvoice = (original: ServiceInvoice, updates: Partial<ServiceInvoice>): ServiceInvoice => {
    const updated: ServiceInvoice = { ...original, ...updates, updatedAt: new Date() } as ServiceInvoice;
    return updated;
  };

  // Debug function to log invoice structure
  const debugInvoice = (invoice: ServiceInvoice) => {
    console.log('🔍 Debug Invoice Structure:', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      customer: invoice.customer,
      serviceDetails: invoice.serviceDetails,
      items: invoice.items,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      terms: invoice.terms
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const numberToWordsIndian = (num: number): string => {
    if (isNaN(num) || num < 0) return '';
    if (num === 0) return 'zero';

    const belowTwenty = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
    const tens = ['','', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

    const toWords = (n: number): string => {
      let str = '';
      if (n > 19) {
        str += tens[Math.floor(n / 10)] + (n % 10 ? ' ' + belowTwenty[n % 10] : '');
      } else {
        str += belowTwenty[n];
      }
      return str.trim();
    };

    const crores = Math.floor(num / 10000000);
    num %= 10000000;
    const lakhs = Math.floor(num / 100000);
    num %= 100000;
    const thousands = Math.floor(num / 1000);
    num %= 1000;
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;

    let words = '';
    if (crores) words += toWords(crores) + ' crore ';
    if (lakhs) words += toWords(lakhs) + ' lakh ';
    if (thousands) words += toWords(thousands) + ' thousand ';
    if (hundreds) words += belowTwenty[hundreds] + ' hundred ';
    if (remainder) words += (words ? 'and ' : '') + toWords(remainder);

    return words.replace(/\s+/g, ' ').trim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage service invoices with PDF export and WhatsApp sharing
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => window.location.href = '/slab-rates'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Slab Rate Config
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Invoices Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <DocumentArrowDownIcon className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No invoices found matching your search.' : 'Get started by creating a new invoice.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Invoice
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-500">{invoice.customer.name}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {invoice.serviceDetails.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {new Date(invoice.serviceDetails.serviceDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CurrencyRupeeIcon className="h-4 w-4 mr-2" />
                    ₹{invoice.totalAmount.toFixed(2)}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewingInvoice(invoice)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="View invoice"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => generatePDF(invoice)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Download PDF"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => shareToWhatsApp(invoice)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Share to WhatsApp"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(invoice)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                      title="Edit invoice"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this invoice?')) {
                          const updatedInvoices = invoices.filter(i => i.id !== invoice.id);
                          setInvoices(updatedInvoices);
                          localStorage.setItem('anjaneya_invoices', JSON.stringify(updatedInvoices));
                          toast.success('Invoice deleted successfully');
                        }
                      }}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete invoice"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Create New Invoice
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                            Customer *
                          </label>
                          <select
                            id="customerId"
                            required
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a customer</option>
                            {customers.map(customer => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name} - {customer.phoneNumber}
                              </option>
                            ))}
                          </select>
                        </div>

                                                 <div>
                           <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                             Service Type *
                           </label>
                           <div className="mt-1">
                             {!showCustomServiceInput ? (
                               <div className="flex space-x-2">
                                 <select
                                   id="serviceType"
                                   required
                                   value={formData.serviceType}
                                   onChange={(e) => {
                                     if (e.target.value === 'custom') {
                                       setShowCustomServiceInput(true);
                                     } else {
                                       setFormData({ ...formData, serviceType: e.target.value });
                                     }
                                   }}
                                   className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                 >
                                   <option value="">Select a service type</option>
                                   {predefinedServiceTypes.map(type => (
                                     <option key={type} value={type}>{type}</option>
                                   ))}
                                   {customServiceTypes.map(type => (
                                     <option key={type} value={type}>{type}</option>
                                   ))}
                                   <option value="custom">+ Add Custom Service Type</option>
                                 </select>
                               </div>
                             ) : (
                               <div className="flex space-x-2">
                                 <input
                                   type="text"
                                   value={formData.customServiceType}
                                   onChange={(e) => setFormData({ ...formData, customServiceType: e.target.value })}
                                   className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Enter custom service type"
                                 />
                                 <button
                                   type="button"
                                   onClick={addCustomServiceType}
                                   className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                 >
                                   Add
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setShowCustomServiceInput(false);
                                     setFormData({ ...formData, customServiceType: '' });
                                   }}
                                   className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                                 >
                                   Cancel
                                 </button>
                               </div>
                             )}
                           </div>
                         </div>

                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                            Location *
                          </label>
                          <input
                            type="text"
                            id="location"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Service location"
                          />
                        </div>

                        <div>
                          <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700">
                            Service Date *
                          </label>
                          <input
                            type="date"
                            id="serviceDate"
                            required
                            value={formData.serviceDate}
                            onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Service description"
                          />
                        </div>

                        
                       </div>

                       {/* Slab Rate Calculation */}
                       <div className="mt-6">
                         <h4 className="text-md font-medium text-gray-900 mb-3">Borewell Slab Rate Calculation</h4>
                          
                                                     {/* Slab Rate Type Selection */}
                           <div className="mb-4">
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               Slab Rate Type
                             </label>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                                 <input
                                   type="radio"
                                   name="slabRateType"
                                   value="1"
                                   checked={formData.slabRateType === '1'}
                                   onChange={(e) => setFormData({ ...formData, slabRateType: e.target.value })}
                                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                 />
                                 <div className="ml-3">
                                   <div className="text-sm font-medium text-gray-900">Type #1</div>
                                   <div className="text-xs text-gray-500">1-300 feet at ₹{slabRateConfig.type1.rate1_300}/ft</div>
                                 </div>
                               </label>
                               
                               <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                                 <input
                                   type="radio"
                                   name="slabRateType"
                                   value="2"
                                   checked={formData.slabRateType === '2'}
                                   onChange={(e) => setFormData({ ...formData, slabRateType: e.target.value })}
                                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                 />
                                 <div className="ml-3">
                                   <div className="text-sm font-medium text-gray-900">Type #2</div>
                                   <div className="text-xs text-gray-500">1-500 feet at ₹{slabRateConfig.type2.rate1_500}/ft</div>
                                 </div>
                               </label>
                               
                               <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                                 <input
                                   type="radio"
                                   name="slabRateType"
                                   value="3"
                                   checked={formData.slabRateType === '3'}
                                   onChange={(e) => setFormData({ ...formData, slabRateType: e.target.value })}
                                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                 />
                                 <div className="ml-3">
                                   <div className="text-sm font-medium text-gray-900">Type #3</div>
                                   <div className="text-xs text-gray-500">Rebore/Extension</div>
                                 </div>
                               </label>
                             </div>
                           </div>

                           
                          
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                           <div>
                             <label htmlFor="totalDepth" className="block text-sm font-medium text-gray-700">
                               Total Depth (feet)
                             </label>
                             <input
                               type="number"
                               id="totalDepth"
                               value={formData.totalDepth}
                               onChange={(e) => setFormData({ ...formData, totalDepth: parseFloat(e.target.value) || 0 })}
                               className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="0"
                             />
                           </div>
                           <div>
                             <label htmlFor="pvc7Inch" className="block text-sm font-medium text-gray-700">
                               7" PVC (feet)
                             </label>
                             <input
                               type="number"
                               id="pvc7Inch"
                               value={formData.pvc7Inch}
                               onChange={(e) => setFormData({ ...formData, pvc7Inch: parseFloat(e.target.value) || 0 })}
                               className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="0"
                             />
                           </div>
                           <div>
                             <label htmlFor="pvc10Inch" className="block text-sm font-medium text-gray-700">
                               10" PVC (feet)
                             </label>
                             <input
                               type="number"
                               id="pvc10Inch"
                               value={formData.pvc10Inch}
                               onChange={(e) => setFormData({ ...formData, pvc10Inch: parseFloat(e.target.value) || 0 })}
                               className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="0"
                             />
                           </div>
                           <div>
                             <label htmlFor="bata" className="block text-sm font-medium text-gray-700">
                               BATA (₹)
                             </label>
                             <input
                               type="number"
                               id="bata"
                               value={formData.bata}
                               onChange={(e) => setFormData({ ...formData, bata: parseFloat(e.target.value) || 2000 })}
                               className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="2000"
                             />
                           </div>
                           <div>
                             <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700">
                               Advance Amount (₹)
                             </label>
                             <input
                               type="number"
                               id="advanceAmount"
                               value={formData.advanceAmount}
                               onChange={(e) => setFormData({ ...formData, advanceAmount: parseFloat(e.target.value) || 0 })}
                               className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="0"
                               min="0"
                             />
                           </div>
                         </div>
                          
                                                     {/* Existing Bore Fields for Type 3 */}
                           {formData.slabRateType === '3' && (
                             <div className="mt-4 space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div>
                                   <label htmlFor="existingBoreDepth" className="block text-sm font-medium text-gray-700">
                                     Existing Bore Depth (feet)
                                   </label>
                                   <input
                                     type="number"
                                     id="existingBoreDepth"
                                     value={formData.existingBoreDepth}
                                     onChange={(e) => setFormData({ ...formData, existingBoreDepth: parseFloat(e.target.value) || 0 })}
                                     className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                     placeholder="0"
                                   />
                                 </div>
                                 <div>
                                   <label htmlFor="existingBoreRate" className="block text-sm font-medium text-gray-700">
                                     Existing Bore Rate (₹/feet)
                                   </label>
                                   <input
                                     type="number"
                                     id="existingBoreRate"
                                     value={formData.existingBoreRate}
                                     onChange={(e) => setFormData({ ...formData, existingBoreRate: parseFloat(e.target.value) || 40 })}
                                     className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                     placeholder="40"
                                   />
                                 </div>
                                 <div>
                                   <label htmlFor="reboreSlabType" className="block text-sm font-medium text-gray-700">
                                     Use Slab Rate Type
                                   </label>
                                   <select
                                     id="reboreSlabType"
                                     value={formData.reboreSlabType}
                                     onChange={(e) => setFormData({ ...formData, reboreSlabType: e.target.value })}
                                     className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                   >
                                     <option value="1">Type #1 (1-300 ft system)</option>
                                     <option value="2">Type #2 (1-500 ft system)</option>
                                   </select>
                                 </div>
                               </div>
                               <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border">
                                 <strong>Note:</strong> New drilling will start from {formData.existingBoreDepth} feet and use {formData.reboreSlabType === '1' ? 'Type #1' : 'Type #2'} slab rate system.
                               </div>
                             </div>
                           )}

                         {/* Slab Rate Summary */}
                         {formData.totalDepth > 0 && (
                           <div className="mt-4 p-4 bg-gray-50 rounded-md">
                             <h5 className="text-sm font-medium text-gray-900 mb-2">Slab Rate Summary:</h5>
                             
                                                           {/* Depth-based breakdown */}
                              <div className="mb-3">
                                <h6 className="text-xs font-medium text-gray-700 mb-2">
                                  {formData.slabRateType === '1' ? 'Type #1: 1-300 feet Slab Rate' : 
                                   formData.slabRateType === '2' ? 'Type #2: 1-500 feet Slab Rate' : 
                                   'Type #3: Rebore/Extension Slab Rate'}
                                </h6>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs max-h-64 overflow-y-auto">
                                                                     {formData.slabRateType === '1' && (
                                     renderSlabRateBreakdown(formData.totalDepth, slabRateConfig.type1, 'Drilling', 0)
                                   )}
                                    
                                   {formData.slabRateType === '2' && (
                                     renderSlabRateBreakdown(formData.totalDepth, slabRateConfig.type2, 'Drilling', 0)
                                   )}
                                    
                                   {formData.slabRateType === '3' && (
                                     <>
                                       {formData.existingBoreDepth > 0 && (
                                         <div className="bg-purple-50 p-2 rounded border">
                                           <span className="text-gray-600">Existing Bore:</span>
                                           <div className="font-medium">{formData.existingBoreDepth} ft × ₹{formData.existingBoreRate} = ₹{(formData.existingBoreDepth * formData.existingBoreRate).toFixed(2)}</div>
                                         </div>
                                       )}
                                       {formData.totalDepth > formData.existingBoreDepth && (
                                         <div className="bg-blue-50 p-2 rounded border">
                                           <span className="text-gray-600">New Drilling:</span>
                                           <div className="font-medium">
                                             {renderSlabRateBreakdown(formData.totalDepth - formData.existingBoreDepth, slabRateConfig.type3, 'New Drilling', formData.existingBoreDepth)}
                                           </div>
                                         </div>
                                       )}
                                     </>
                                   )}
                                </div>
                              </div>
                             
                                                           {/* Material breakdown */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                               <div>
                                 <span className="text-gray-600">7" PVC:</span>
                                 <div className="font-medium">₹{calculateSlabRates().pvc7InchRate.toFixed(2)}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">10" PVC:</span>
                                 <div className="font-medium">₹{calculateSlabRates().pvc10InchRate.toFixed(2)}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">BATA:</span>
                                 <div className="font-medium">₹{calculateSlabRates().bata.toFixed(2)}</div>
                               </div>
                                <div>
                                  <span className="text-gray-600">Total Drilling:</span>
                                  <div className="font-medium">₹{calculateSlabRates().slabRate.toFixed(2)}</div>
                             </div>
                              </div>
                              
                              {/* Existing Bore Cost for Type 3 */}
                              {formData.slabRateType === '3' && calculateSlabRates().existingBoreCost > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Existing Bore Cost:</span>
                                    <span className="font-medium">₹{calculateSlabRates().existingBoreCost.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                             <div className="mt-2 pt-2 border-t border-gray-200">
                               <span className="text-sm font-medium text-gray-900">Total Slab Rate: ₹{calculateSlabRates().total.toFixed(2)}</span>
                             </div>
                           </div>
                         )}
                       </div>

                                             {/* Invoice Summary */}
                       {formData.totalDepth > 0 && (
                         <div className="mt-6">
                           <h4 className="text-md font-medium text-gray-900 mb-3">Invoice Summary</h4>
                           <div className="bg-gray-50 p-4 rounded-md">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                               <div>
                                 <span className="text-gray-600">Total Drilling:</span>
                                 <div className="font-medium">₹{calculateSlabRates().slabRate.toFixed(2)}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">7" PVC:</span>
                                 <div className="font-medium">₹{calculateSlabRates().pvc7InchRate.toFixed(2)}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">10" PVC:</span>
                                 <div className="font-medium">₹{calculateSlabRates().pvc10InchRate.toFixed(2)}</div>
                               </div>
                               <div>
                                 <span className="text-gray-600">BATA:</span>
                                 <div className="font-medium">₹{calculateSlabRates().bata.toFixed(2)}</div>
                               </div>
                             </div>
                             <div className="border-t border-gray-200 pt-4">
                                <div className="text-right space-y-1">
                                  <div className="text-sm text-gray-600">
                                    Subtotal: ₹{calculateSlabRates().total.toFixed(2)}
                                  </div>
                                  {formData.enableTax && (
                                    <div className="text-sm text-gray-600">
                                      Tax ({formData.taxRate}%): ₹{(calculateSlabRates().total * (formData.taxRate / 100)).toFixed(2)}
                                    </div>
                                  )}
                                  <div className="text-lg font-medium text-gray-900">
                                    Total: ₹{formData.enableTax ? (calculateSlabRates().total * (1 + formData.taxRate / 100)).toFixed(2) : calculateSlabRates().total.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                           </div>
                         </div>
                       )}

                      {/* Tax Options */}
                      <div className="mt-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Tax Options</h4>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.enableTax}
                              onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Enable GST</span>
                          </label>
                          {formData.enableTax && (
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-700">Rate:</label>
                              <input
                                type="number"
                                value={formData.taxRate}
                                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 18 })}
                                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                max="100"
                                step="0.01"
                              />
                              <span className="text-sm text-gray-700">%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Notes
                          </label>
                          <textarea
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Additional notes"
                          />
                        </div>

                        <div>
                          <label htmlFor="terms" className="block text-sm font-medium text-gray-700">
                            Terms
                          </label>
                          <textarea
                            id="terms"
                            rows={3}
                            value={formData.terms}
                            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Payment terms"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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
                    onClick={handleCloseModal}
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

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseViewModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Invoice #{viewingInvoice.invoiceNumber || 'N/A'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingInvoice.status || 'DRAFT')}`}>
                        {viewingInvoice.status || 'DRAFT'}
                      </span>
                    </div>
                    
                    {/* Company Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg mb-6">
                      <h1 className="text-2xl font-bold text-center">ANJANEYA BOREWELLS</h1>
                      <p className="text-center text-blue-100">ஆழமான நம்பிக்கை (Deep Trust)</p>
                    </div>
                    
                    {/* Invoice Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                             {/* Invoice Info */}
                       <div className="bg-gray-50 p-4 rounded-lg">
                         <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Invoice #:</span>
                             <span className="font-medium">{viewingInvoice.invoiceNumber || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Date:</span>
                             <span>{viewingInvoice.invoiceDate ? new Date(viewingInvoice.invoiceDate).toLocaleDateString() : 'N/A'}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Due Date:</span>
                             <span>{viewingInvoice.dueDate ? new Date(viewingInvoice.dueDate).toLocaleDateString() : 'N/A'}</span>
                           </div>
                         </div>
                       </div>
                      
                                             {/* Service Info */}
                       <div className="bg-gray-50 p-4 rounded-lg">
                         <h4 className="font-medium text-gray-900 mb-3">Service Details</h4>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Type:</span>
                             <span className="font-medium">{viewingInvoice.serviceDetails?.serviceType || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Location:</span>
                             <span>{viewingInvoice.serviceDetails?.location || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Date:</span>
                             <span>{viewingInvoice.serviceDetails?.serviceDate ? new Date(viewingInvoice.serviceDetails.serviceDate).toLocaleDateString() : 'N/A'}</span>
                           </div>
                         </div>
                       </div>
                    </div>
                    
                                         {/* Customer Details */}
                     <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                       <h4 className="font-medium text-gray-900 mb-3">Bill To</h4>
                       <div className="space-y-1 text-sm">
                         <p className="font-medium text-gray-900">{viewingInvoice.customer?.name || 'N/A'}</p>
                         <p className="text-gray-600">{viewingInvoice.customer?.address || 'N/A'}</p>
                         <p className="text-gray-600">Phone: {viewingInvoice.customer?.phoneNumber || 'N/A'}</p>
                         {viewingInvoice.customer?.whatsappNumber && (
                           <p className="text-gray-600">WhatsApp: {viewingInvoice.customer.whatsappNumber}</p>
                         )}
                         {viewingInvoice.customer?.email && (
                           <p className="text-gray-600">Email: {viewingInvoice.customer.email}</p>
                         )}
                       </div>
                     </div>
                    
                                         {/* Slab Rate Details (if available) */}
                     {viewingInvoice.serviceDetails?.serviceType === 'Bore Drilling' && viewingInvoice.items && viewingInvoice.items.length > 0 && (
                       <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                         <h4 className="font-medium text-gray-900 mb-3">Slab Rate Calculation</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                           {viewingInvoice.items.filter(item => item.description && item.description.includes('Borewell Drilling')).map((item, index) => (
                             <div key={index} className="space-y-1">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Drilling Depth:</span>
                                 <span className="font-medium">{item.quantity || 0} feet</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Rate per foot:</span>
                                 <span className="font-medium">₹{((item.amount || 0) / (item.quantity || 1)).toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">Total Drilling:</span>
                                 <span className="font-medium">₹{(item.amount || 0).toFixed(2)}</span>
                               </div>
                             </div>
                           ))}
                           
                           {viewingInvoice.items.filter(item => item.description && item.description.includes('7" PVC')).map((item, index) => (
                             <div key={index} className="space-y-1">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">7" PVC Casing:</span>
                                 <span className="font-medium">{item.quantity || 0} feet</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">PVC Calculation:</span>
                                 <span className="font-medium">{item.quantity || 0} × ₹120/ft = ₹{(item.amount || 0).toFixed(2)}</span>
                               </div>
                             </div>
                           ))}
                           
                           {viewingInvoice.items.filter(item => item.description && item.description.includes('10" PVC')).map((item, index) => (
                             <div key={index} className="space-y-1">
                               <div className="flex justify-between">
                                 <span className="text-gray-600">10" PVC Casing:</span>
                                 <span className="font-medium">{item.quantity || 0} feet</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-gray-600">PVC Calculation:</span>
                                 <span className="font-medium">{item.quantity || 0} × ₹180/ft = ₹{(item.amount || 0).toFixed(2)}</span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                    
                                         {/* Items Table */}
                     {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                       <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
                         <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                             <tr>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                             </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                             {viewingInvoice.items.map((item, index) => (
                               <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description || 'N/A'}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity || 0}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.unit || 'N/A'}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(item.rate || 0).toFixed(2)}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(item.amount || 0).toFixed(2)}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     ) : (
                       <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                         <p className="text-gray-500">No items found for this invoice</p>
                       </div>
                     )}
                     
                     {/* Totals */}
                     <div className="bg-gray-50 p-4 rounded-lg mb-6">
                       <div className="space-y-2 text-right">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-600">Subtotal:</span>
                           <span className="font-medium">₹{(viewingInvoice.subtotal || 0).toFixed(2)}</span>
                         </div>
                         {viewingInvoice.taxAmount > 0 && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-600">Tax ({(viewingInvoice.taxRate * 100).toFixed(0)}%):</span>
                             <span className="font-medium">₹{(viewingInvoice.taxAmount || 0).toFixed(2)}</span>
                           </div>
                         )}
                         <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                           <span>Total:</span>
                           <span>₹{(viewingInvoice.totalAmount || 0).toFixed(2)}</span>
                         </div>
                       </div>
                     </div>
                    
                    {/* Notes and Terms */}
                    {(viewingInvoice.notes || viewingInvoice.terms) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {viewingInvoice.notes && (
                          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                            <p className="text-sm text-gray-700">{viewingInvoice.notes}</p>
                          </div>
                        )}
                        
                        {viewingInvoice.terms && (
                          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{viewingInvoice.terms}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                 <button
                   type="button"
                   onClick={() => generatePDF(viewingInvoice)}
                   className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                 >
                   Download PDF
                 </button>
                 <button
                   type="button"
                   onClick={() => { if (viewingInvoice) openEdit(viewingInvoice); }}
                   className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                 >
                   Edit
                 </button>
                 <button
                   type="button"
                   onClick={() => shareToWhatsApp(viewingInvoice)}
                   className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                 >
                   Share to WhatsApp
                 </button>
                 <button
                   type="button"
                   onClick={() => debugInvoice(viewingInvoice)}
                   className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                 >
                   Debug
                 </button>
                 <button
                   type="button"
                   onClick={handleCloseViewModal}
                   className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                 >
                   Close
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // persist update + recalc from edited depth/PVC
                  if (!editingInvoice) return;
                  // rebuild items from edited inputs
                  const newItems: InvoiceItem[] = [];
                  // Depth broken into simple rows
                  if (editDepth > 0) {
                    newItems.push({ id: `drill_${Date.now()}`, description: 'Drilling', quantity: editDepth, unit: 'feet', rate: slabRateConfig.type1.rate1_300, amount: editDepth * slabRateConfig.type1.rate1_300, type: 'service' });
                  }
                  if (editPVC7 > 0) {
                    newItems.push({ id: `pvc7_${Date.now()}`, description: '7" PVC', quantity: editPVC7, unit: 'feet', rate: 400, amount: editPVC7 * 400, type: 'material' });
                  }
                  if (editPVC10 > 0) {
                    newItems.push({ id: `pvc10_${Date.now()}`, description: '10" PVC', quantity: editPVC10, unit: 'feet', rate: 700, amount: editPVC10 * 700, type: 'material' });
                  }
                  if (editBata > 0) {
                    newItems.push({ id: `bata_${Date.now()}`, description: 'BATA', quantity: 1, unit: 'Per Bore', rate: editBata, amount: editBata, type: 'additional' });
                  }
                  const newSubtotal = newItems.reduce((s, it) => s + (it.amount || 0), 0);
                  const newTax = formData.enableTax ? newSubtotal * (formData.taxRate / 100) : 0;
                  const newTotal = newSubtotal + newTax;
                  const updatedInvoices = invoices.map((i) =>
                    i.id === editingInvoice.id ? applyEditsToInvoice(i, { ...editingInvoice, items: newItems, subtotal: newSubtotal, taxAmount: newTax, totalAmount: newTotal, pendingAmount: Math.max(newTotal - (editingInvoice.paidAmount || 0), 0) }) : i
                  );
                  setInvoices(updatedInvoices);
                  localStorage.setItem('anjaneya_invoices', JSON.stringify(updatedInvoices));
                  toast.success('Invoice updated');
                  setShowEditModal(false);
                }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Invoice</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={editingInvoice.status}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                      >
                        <option value="SENT">SENT</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Depth (feet)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={formData.totalDepth}
                        onChange={(e) => setFormData({ ...formData, totalDepth: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">7" PVC (feet)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={formData.pvc7Inch}
                        onChange={(e) => setFormData({ ...formData, pvc7Inch: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">10" PVC (feet)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={formData.pvc10Inch}
                        onChange={(e) => setFormData({ ...formData, pvc10Inch: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                      <input
                        type="date"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={new Date(editingInvoice.invoiceDate).toISOString().slice(0,10)}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, invoiceDate: new Date(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={new Date(editingInvoice.dueDate).toISOString().slice(0,10)}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: new Date(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Advance/Paid Amount</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={editingInvoice.paidAmount}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, paidAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Depth (feet)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={editDepth}
                        onChange={(e) => setEditDepth(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">7" PVC (feet)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={editPVC7}
                        onChange={(e) => setEditPVC7(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">10" PVC (feet)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={editPVC10}
                        onChange={(e) => setEditPVC10(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">BATA (₹)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={editBata}
                        onChange={(e) => setEditBata(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      rows={3}
                      value={editingInvoice.notes || ''}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Terms</label>
                    <textarea
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      rows={3}
                      value={editingInvoice.terms || ''}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, terms: e.target.value })}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">Save</button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
