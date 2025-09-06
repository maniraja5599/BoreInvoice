import React, { useState, useEffect } from 'react';
import { customerService, borewellService } from '../services/borewellService';
import { Customer, SlabRate } from '../types';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  DocumentTextIcon,
  CalculatorIcon,
  PrinterIcon,
  BookmarkIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface PVCItem {
  id: string;
  diameter: number; // in inches
  feet: number;
  pricePerFoot: number;
  description: string;
  total: number;
}

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  type: 'boring' | 'pvc' | 'other';
}

interface QuotationData {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerDetails: Customer | null;
  projectLocation: string;
  boringDepth: number;
  boringDiameter: number;
  items: QuotationItem[];
  pvcItems: PVCItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  validityDays: number;
  terms: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationCreator: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [slabRates, setSlabRates] = useState<SlabRate[]>([]);
  const [quotation, setQuotation] = useState<QuotationData>({
    id: '',
    quotationNumber: '',
    customerId: '',
    customerDetails: null,
    projectLocation: '',
    boringDepth: 0,
    boringDiameter: 6,
    items: [],
    pvcItems: [],
    subtotal: 0,
    taxPercentage: 18,
    taxAmount: 0,
    discount: 0,
    totalAmount: 0,
    validityDays: 30,
    terms: [
      '50% advance payment required',
      'Balance payment on completion',
      'GST extra as applicable',
      'Rates valid for 30 days'
    ],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [loading, setLoading] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    email: ''
  });

  // PVC Pipe standard sizes and rates
  const pvcSizes = [
    { diameter: 4, pricePerFoot: 45 },
    { diameter: 5, pricePerFoot: 65 },
    { diameter: 6, pricePerFoot: 85 },
    { diameter: 8, pricePerFoot: 150 },
    { diameter: 10, pricePerFoot: 220 },
    { diameter: 12, pricePerFoot: 320 }
  ];

  useEffect(() => {
    loadData();
    generateQuotationNumber();
  }, []);

  useEffect(() => {
    calculateBoringCost();
  }, [quotation.boringDepth, quotation.boringDiameter, slabRates]);

  useEffect(() => {
    calculateTotals();
  }, [quotation.items, quotation.pvcItems, quotation.taxPercentage, quotation.discount]);

  const loadData = async () => {
    try {
      const customerData = customerService.getAll();
      const slabData = borewellService.getSlabRates();
      setCustomers(customerData);
      setSlabRates(slabData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const generateQuotationNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const quotationNumber = `QT${year}${month}${random}`;
    
    setQuotation(prev => ({
      ...prev,
      id: Date.now().toString(),
      quotationNumber
    }));
  };

  const calculateBoringCost = () => {
    if (!quotation.boringDepth || slabRates.length === 0) return;

    // Find applicable slab rate based on depth
    const applicableRate = slabRates.find(rate => 
      quotation.boringDepth >= rate.fromDepth && 
      quotation.boringDepth <= rate.toDepth
    );

    if (applicableRate) {
      const boringAmount = quotation.boringDepth * applicableRate.ratePerFoot;
      
      // Update or add boring item
      setQuotation(prev => {
        const existingItems = prev.items.filter(item => item.type !== 'boring');
        const boringItem: QuotationItem = {
          id: 'boring-main',
          description: `Borewell drilling (${quotation.boringDiameter}" diameter)`,
          quantity: quotation.boringDepth,
          unit: 'feet',
          rate: applicableRate.ratePerFoot,
          amount: boringAmount,
          type: 'boring'
        };

        return {
          ...prev,
          items: [...existingItems, boringItem]
        };
      });
    }
  };

  const addPVCItem = () => {
    const newPVCItem: PVCItem = {
      id: Date.now().toString(),
      diameter: 6,
      feet: 0,
      pricePerFoot: 85,
      description: '6" PVC Pipe',
      total: 0
    };

    setQuotation(prev => ({
      ...prev,
      pvcItems: [...prev.pvcItems, newPVCItem]
    }));
  };

  const updatePVCItem = (id: string, field: keyof PVCItem, value: any) => {
    setQuotation(prev => ({
      ...prev,
      pvcItems: prev.pvcItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Update description and price when diameter changes
          if (field === 'diameter') {
            const sizeInfo = pvcSizes.find(size => size.diameter === value);
            if (sizeInfo) {
              updatedItem.pricePerFoot = sizeInfo.pricePerFoot;
              updatedItem.description = `${value}" PVC Pipe`;
            }
          }
          
          // Calculate total
          updatedItem.total = updatedItem.feet * updatedItem.pricePerFoot;
          
          return updatedItem;
        }
        return item;
      })
    }));

    // Convert PVC items to quotation items
    updateQuotationItemsFromPVC();
  };

  const updateQuotationItemsFromPVC = () => {
    setTimeout(() => {
      setQuotation(prev => {
        const nonPVCItems = prev.items.filter(item => item.type !== 'pvc');
        const pvcQuotationItems: QuotationItem[] = prev.pvcItems.map(pvcItem => ({
          id: `pvc-${pvcItem.id}`,
          description: pvcItem.description,
          quantity: pvcItem.feet,
          unit: 'feet',
          rate: pvcItem.pricePerFoot,
          amount: pvcItem.total,
          type: 'pvc'
        }));

        return {
          ...prev,
          items: [...nonPVCItems, ...pvcQuotationItems]
        };
      });
    }, 0);
  };

  const removePVCItem = (id: string) => {
    setQuotation(prev => ({
      ...prev,
      pvcItems: prev.pvcItems.filter(item => item.id !== id)
    }));
    updateQuotationItemsFromPVC();
  };

  const addCustomItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'nos',
      rate: 0,
      amount: 0,
      type: 'other'
    };

    setQuotation(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateCustomItem = (id: string, field: keyof QuotationItem, value: any) => {
    setQuotation(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id && item.type === 'other') {
          const updatedItem = { ...item, [field]: value };
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeCustomItem = (id: string) => {
    setQuotation(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id || item.type !== 'other')
    }));
  };

  const calculateTotals = () => {
    const subtotal = quotation.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * quotation.taxPercentage) / 100;
    const totalAmount = subtotal + taxAmount - quotation.discount;

    setQuotation(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }));
  };

  const selectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setQuotation(prev => ({
      ...prev,
      customerId,
      customerDetails: customer || null
    }));
  };

  const createNewCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phoneNumber) {
      toast.error('Name and phone number are required');
      return;
    }

    try {
      const customer = customerService.create({
        ...newCustomer,
        billingStatus: 'UNPAID',
        paymentAmount: 0,
        totalOutstanding: 0
      });
      
      setCustomers(prev => [...prev, customer]);
      selectCustomer(customer.id);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: '', phoneNumber: '', address: '', email: '' });
      toast.success('Customer created successfully');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('BOREWELL QUOTATION', pageWidth / 2, 30, { align: 'center' });

    // Company details (you can customize this)
    doc.setFontSize(12);
    doc.text('Your Company Name', margin, 50);
    doc.text('Address Line 1, Address Line 2', margin, 60);
    doc.text('Phone: +91 XXXXXXXXXX', margin, 70);
    doc.text('Email: info@company.com', margin, 80);

    // Quotation details
    doc.text(`Quotation No: ${quotation.quotationNumber}`, pageWidth - margin - 80, 50);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - margin - 80, 60);
    doc.text(`Valid Till: ${new Date(Date.now() + quotation.validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`, pageWidth - margin - 80, 70);

    // Customer details
    let yPos = 100;
    doc.setFontSize(14);
    doc.text('Bill To:', margin, yPos);
    yPos += 10;
    
    if (quotation.customerDetails) {
      doc.setFontSize(12);
      doc.text(quotation.customerDetails.name, margin, yPos);
      yPos += 8;
      doc.text(quotation.customerDetails.address, margin, yPos);
      yPos += 8;
      doc.text(`Phone: ${quotation.customerDetails.phoneNumber}`, margin, yPos);
      if (quotation.customerDetails.email) {
        yPos += 8;
        doc.text(`Email: ${quotation.customerDetails.email}`, margin, yPos);
      }
    }

    yPos += 20;
    if (quotation.projectLocation) {
      doc.text(`Project Location: ${quotation.projectLocation}`, margin, yPos);
      yPos += 10;
    }

    // Items table
    yPos += 10;
    const tableColumns = ['Description', 'Qty', 'Unit', 'Rate', 'Amount'];
    const tableRows = quotation.items.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit,
      `₹${item.rate.toLocaleString('en-IN')}`,
      `₹${item.amount.toLocaleString('en-IN')}`
    ]);

    (doc as any).autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: yPos,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [51, 122, 183] }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const totalsX = pageWidth - margin - 80;
    
    doc.text(`Subtotal: ₹${quotation.subtotal.toLocaleString('en-IN')}`, totalsX, finalY);
    doc.text(`Tax (${quotation.taxPercentage}%): ₹${quotation.taxAmount.toLocaleString('en-IN')}`, totalsX, finalY + 10);
    if (quotation.discount > 0) {
      doc.text(`Discount: -₹${quotation.discount.toLocaleString('en-IN')}`, totalsX, finalY + 20);
    }
    doc.setFontSize(14);
    doc.text(`Total: ₹${quotation.totalAmount.toLocaleString('en-IN')}`, totalsX, finalY + 30);

    // Terms and conditions
    if (quotation.terms.length > 0) {
      let termsY = finalY + 50;
      doc.setFontSize(12);
      doc.text('Terms & Conditions:', margin, termsY);
      termsY += 10;
      
      quotation.terms.forEach((term, index) => {
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${term}`, margin, termsY);
        termsY += 8;
      });
    }

    // Notes
    if (quotation.notes) {
      const notesY = Math.max(finalY + 80, (doc as any).internal.pageSize.height - 50);
      doc.setFontSize(12);
      doc.text('Notes:', margin, notesY);
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(quotation.notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, notesY + 10);
    }

    // Save PDF
    doc.save(`Quotation_${quotation.quotationNumber}.pdf`);
    toast.success('Quotation exported to PDF successfully');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation Creator</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create detailed quotations with slab rates and PVC calculations
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={exportToPDF}
            disabled={!quotation.customerDetails || quotation.items.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Project Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quotation Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quotation Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quotation Number</label>
                <input
                  type="text"
                  value={quotation.quotationNumber}
                  onChange={(e) => setQuotation(prev => ({ ...prev, quotationNumber: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valid for (days)</label>
                <input
                  type="number"
                  value={quotation.validityDays}
                  onChange={(e) => setQuotation(prev => ({ ...prev, validityDays: parseInt(e.target.value) || 30 }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
            
            {!showNewCustomerForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Customer</label>
                  <select
                    value={quotation.customerId}
                    onChange={(e) => selectCustomer(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phoneNumber}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Customer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={newCustomer.phoneNumber}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={createNewCustomer}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Save Customer
                  </button>
                  <button
                    onClick={() => setShowNewCustomerForm(false)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Selected Customer Display */}
            {quotation.customerDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{quotation.customerDetails.name}</h4>
                    <div className="flex items-center text-sm text-gray-500">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {quotation.customerDetails.phoneNumber}
                    </div>
                    {quotation.customerDetails.email && (
                      <div className="flex items-center text-sm text-gray-500">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        {quotation.customerDetails.email}
                      </div>
                    )}
                    <div className="flex items-start text-sm text-gray-500 mt-1">
                      <MapPinIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                      {quotation.customerDetails.address}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Location</label>
                <input
                  type="text"
                  value={quotation.projectLocation}
                  onChange={(e) => setQuotation(prev => ({ ...prev, projectLocation: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter project address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Boring Depth (feet)</label>
                  <input
                    type="number"
                    value={quotation.boringDepth}
                    onChange={(e) => setQuotation(prev => ({ ...prev, boringDepth: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Boring Diameter (inches)</label>
                  <select
                    value={quotation.boringDiameter}
                    onChange={(e) => setQuotation(prev => ({ ...prev, boringDiameter: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value={4}>4"</option>
                    <option value={6}>6"</option>
                    <option value={8}>8"</option>
                    <option value={10}>10"</option>
                    <option value={12}>12"</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Items & Calculations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Boring Cost Display */}
          {quotation.items.find(item => item.type === 'boring') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-900">Boring Cost Calculation</h4>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                Depth: {quotation.boringDepth} feet × Rate: ₹{quotation.items.find(item => item.type === 'boring')?.rate.toLocaleString('en-IN')}/feet = 
                <span className="font-medium ml-1">
                  ₹{quotation.items.find(item => item.type === 'boring')?.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* PVC Pipe Calculator */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">PVC Pipe Calculator</h3>
              <button
                onClick={addPVCItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add PVC
              </button>
            </div>

            <div className="space-y-4">
              {quotation.pvcItems.map((pvcItem) => (
                <div key={pvcItem.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Diameter</label>
                      <select
                        value={pvcItem.diameter}
                        onChange={(e) => updatePVCItem(pvcItem.id, 'diameter', parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {pvcSizes.map(size => (
                          <option key={size.diameter} value={size.diameter}>
                            {size.diameter}"
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Feet</label>
                      <input
                        type="number"
                        value={pvcItem.feet}
                        onChange={(e) => updatePVCItem(pvcItem.id, 'feet', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Rate/Foot</label>
                      <input
                        type="number"
                        value={pvcItem.pricePerFoot}
                        onChange={(e) => updatePVCItem(pvcItem.id, 'pricePerFoot', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700">Total</label>
                        <div className="mt-1 text-sm font-medium text-gray-900">
                          ₹{pvcItem.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        onClick={() => removePVCItem(pvcItem.id)}
                        className="ml-2 p-1 text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {quotation.pvcItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No PVC items</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a PVC pipe item.</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Items</h3>
              <button
                onClick={addCustomItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {quotation.items.filter(item => item.type === 'other').map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateCustomItem(item.id, 'description', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="Item description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCustomItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateCustomItem(item.id, 'unit', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Rate</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateCustomItem(item.id, 'rate', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700">Amount</label>
                        <div className="mt-1 text-sm font-medium text-gray-900">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCustomItem(item.id)}
                        className="ml-2 p-1 text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quotation Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quotation Summary</h3>
            
            {/* Items Table */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotation.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {quotation.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No items added</h3>
                  <p className="mt-1 text-sm text-gray-500">Add boring details and PVC items to generate quotation.</p>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tax Percentage (%)</label>
                    <input
                      type="number"
                      value={quotation.taxPercentage}
                      onChange={(e) => setQuotation(prev => ({ ...prev, taxPercentage: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discount Amount</label>
                    <input
                      type="number"
                      value={quotation.discount}
                      onChange={(e) => setQuotation(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">₹{quotation.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax ({quotation.taxPercentage}%):</span>
                    <span className="text-sm font-medium">₹{quotation.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {quotation.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Discount:</span>
                      <span className="text-sm font-medium text-red-600">-₹{quotation.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-blue-600">₹{quotation.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Notes */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={quotation.notes}
                  onChange={(e) => setQuotation(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Additional notes or specifications..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationCreator;
