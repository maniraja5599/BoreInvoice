import React, { useState, useEffect, useCallback } from 'react';
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
  PencilIcon,
  Squares2X2Icon,
  TableCellsIcon,
  PhoneIcon,
  EnvelopeIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { ServiceInvoice, Customer, InvoiceItem, ServiceDetails } from '../types';
import { enhancedCustomerService } from '../services/borewellService';
import { serviceTypeService } from '../services/serviceTypeService';
import EnhancedInvoiceForm from './EnhancedInvoiceForm';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Create a type for quotations that extends ServiceInvoice
interface Quotation extends ServiceInvoice {
  quotationType: 'estimate' | 'formal' | 'revised';
  validityDays: number;
  quotationDate: Date;
}

const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showModal, setShowModal] = useState(false);
  const [showEnhancedForm, setShowEnhancedForm] = useState(false);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDepth, setEditDepth] = useState<number>(0);
  const [editPVC7, setEditPVC7] = useState<number>(0);
  const [editPVC10, setEditPVC10] = useState<number>(0);
  const [editBata, setEditBata] = useState<number>(2000);
  const [editSlabRateType, setEditSlabRateType] = useState<string>('1');
  const [editStartingRate, setEditStartingRate] = useState<number>(75);
  const [editPVC7Rate, setEditPVC7Rate] = useState<number>(400);
  const [editPVC10Rate, setEditPVC10Rate] = useState<number>(700);
  const [editCalculatedRates, setEditCalculatedRates] = useState<any>(null);

  const openEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    // Extract depth and PVC from items
    const depthItem = quotation.items.find(item => 
      item.description.toLowerCase().includes('boring') || 
      item.description.toLowerCase().includes('drilling')
    );
    const pvc7Item = quotation.items.find(item => 
      item.description.toLowerCase().includes('7') && 
      item.description.toLowerCase().includes('pvc')
    );
    const pvc10Item = quotation.items.find(item => 
      item.description.toLowerCase().includes('10') && 
      item.description.toLowerCase().includes('pvc')
    );

    setEditDepth(depthItem?.quantity || 0);
    setEditPVC7(pvc7Item?.quantity || 0);
    setEditPVC10(pvc10Item?.quantity || 0);
    setShowEditModal(true);
  };

  const updateQuotation = () => {
    if (!editingQuotation) return;

    const updatedQuotation = {
      ...editingQuotation,
      items: [
        {
          id: 'boring',
          description: `Borewell Drilling (${editDepth} feet)`,
          quantity: editDepth,
          unit: 'feet',
          rate: editStartingRate,
          amount: editDepth * editStartingRate,
          type: 'service' as const
        },
        ...(editPVC7 > 0 ? [{
          id: 'pvc7',
          description: '7" PVC Casing Pipe',
          quantity: editPVC7,
          unit: 'feet', 
          rate: editPVC7Rate,
          amount: editPVC7 * editPVC7Rate,
          type: 'material' as const
        }] : []),
        ...(editPVC10 > 0 ? [{
          id: 'pvc10',
          description: '10" PVC Casing Pipe',
          quantity: editPVC10,
          unit: 'feet',
          rate: editPVC10Rate,
          amount: editPVC10 * editPVC10Rate,
          type: 'material' as const
        }] : []),
        ...(editBata > 0 ? [{
          id: 'bata',
          description: 'Labour & Transportation',
          quantity: 1,
          unit: 'lot',
          rate: editBata,
          amount: editBata,
          type: 'labor' as const
        }] : [])
      ] as InvoiceItem[]
    };

    // Recalculate totals
    const subtotal = updatedQuotation.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * 0.18;
    const totalAmount = subtotal + taxAmount;

    updatedQuotation.subtotal = subtotal;
    updatedQuotation.taxAmount = taxAmount;
    updatedQuotation.totalAmount = totalAmount;
    updatedQuotation.updatedAt = new Date();

    // Update in localStorage
    const savedQuotations = getQuotationsFromStorage();
    const updatedQuotations = savedQuotations.map(q => 
      q.id === updatedQuotation.id ? updatedQuotation : q
    );
    saveQuotationsToStorage(updatedQuotations);

    // Update state
    setQuotations(updatedQuotations);
    setShowEditModal(false);
    setEditingQuotation(null);
    toast.success('Quotation updated successfully');
  };

  // Storage functions
  const getQuotationsFromStorage = (): Quotation[] => {
    try {
      const stored = localStorage.getItem('anjaneya_quotations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading quotations from storage:', error);
      return [];
    }
  };

  const saveQuotationsToStorage = (quotationsData: Quotation[]) => {
    try {
      localStorage.setItem('anjaneya_quotations', JSON.stringify(quotationsData));
    } catch (error) {
      console.error('Error saving quotations to storage:', error);
    }
  };

  const loadQuotations = useCallback(() => {
    try {
      const quotationsData = getQuotationsFromStorage();
      setQuotations(quotationsData);
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast.error('Failed to load quotations');
    }
  }, []);

  const loadCustomers = useCallback(() => {
    try {
      const customersData = enhancedCustomerService.getAll();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  }, []);

  useEffect(() => {
    loadQuotations();
    loadCustomers();
  }, [loadQuotations, loadCustomers]);

  useEffect(() => {
    // Load view mode preference
    const savedViewMode = localStorage.getItem('quotation_view_mode') as 'grid' | 'table';
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    // Filter quotations based on search term
    if (searchTerm.trim() === '') {
      setFilteredQuotations(quotations);
    } else {
      const filtered = quotations.filter(quotation =>
        quotation.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.serviceDetails?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuotations(filtered);
    }
  }, [quotations, searchTerm]);

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('quotation_view_mode', mode);
  };

  const deleteQuotation = (id: string) => {
    const updatedQuotations = quotations.filter(q => q.id !== id);
    setQuotations(updatedQuotations);
    saveQuotationsToStorage(updatedQuotations);
    toast.success('Quotation deleted successfully');
  };

  const duplicateQuotation = (quotation: Quotation) => {
    const newQuotation: Quotation = {
      ...quotation,
      id: Date.now().toString(),
      invoiceNumber: generateQuotationNumber(),
      quotationDate: new Date(),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedQuotations = [newQuotation, ...quotations];
    setQuotations(updatedQuotations);
    saveQuotationsToStorage(updatedQuotations);
    toast.success('Quotation duplicated successfully');
  };

  const generateQuotationNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QT${year}${month}${day}${random}`;
  };

  const exportToPDF = (quotation: Quotation) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('BOREWELL QUOTATION', pageWidth / 2, 30, { align: 'center' });

    // Company details
    doc.setFontSize(12);
    doc.text('Anjaneya Borewells', margin, 50);
    doc.text('Professional Borewell Services', margin, 60);
    doc.text('Phone: +91 XXXXXXXXXX', margin, 70);
    doc.text('Email: info@anjaneyaborewells.com', margin, 80);

    // Quotation details
    doc.text(`Quotation No: ${quotation.invoiceNumber}`, pageWidth - margin - 80, 50);
    doc.text(`Date: ${new Date((quotation as any).quotationDate || quotation.invoiceDate).toLocaleDateString('en-IN')}`, pageWidth - margin - 80, 60);
    doc.text(`Valid Till: ${new Date(Date.now() + ((quotation as any).validityDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`, pageWidth - margin - 80, 70);

    // Customer details
    let yPos = 100;
    doc.setFontSize(14);
    doc.text('Bill To:', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(quotation.customer.name, margin, yPos);
    yPos += 8;
    doc.text(quotation.customer.address, margin, yPos);
    yPos += 8;
    doc.text(`Phone: ${quotation.customer.phoneNumber}`, margin, yPos);
    if (quotation.customer.email) {
      yPos += 8;
      doc.text(`Email: ${quotation.customer.email}`, margin, yPos);
    }

    yPos += 20;
    if (quotation.serviceDetails && quotation.serviceDetails.location) {
      doc.text(`Service Location: ${quotation.serviceDetails.location}`, margin, yPos);
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
    doc.text(`Tax (18%): ₹${quotation.taxAmount.toLocaleString('en-IN')}`, totalsX, finalY + 10);
    doc.setFontSize(14);
    doc.text(`Total: ₹${quotation.totalAmount.toLocaleString('en-IN')}`, totalsX, finalY + 20);

    // Terms and conditions
    const terms = [
      '50% advance payment required',
      'Balance payment on completion',
      'GST extra as applicable',
      `Quotation valid for ${(quotation as any).validityDays || 30} days`
    ];

    let termsY = finalY + 40;
    doc.setFontSize(12);
    doc.text('Terms & Conditions:', margin, termsY);
    termsY += 10;
    
    terms.forEach((term, index) => {
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${term}`, margin, termsY);
      termsY += 8;
    });

    // Save PDF
    doc.save(`Quotation_${quotation.invoiceNumber}.pdf`);
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Draft';
      case 'PAID': return 'Accepted';
      case 'CANCELLED': return 'Rejected';
      default: return status;
    }
  };

  const onQuotationCreated = (newQuotation: ServiceInvoice) => {
    // Convert ServiceInvoice to Quotation
    const quotation: Quotation = {
      ...newQuotation,
      quotationType: 'estimate',
      validityDays: 30,
      quotationDate: new Date(),
      invoiceNumber: generateQuotationNumber()
    };

    const updatedQuotations = [quotation, ...quotations];
    setQuotations(updatedQuotations);
    saveQuotationsToStorage(updatedQuotations);
    setShowEnhancedForm(false);
    toast.success('Quotation created successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage quotations for borewell services
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0 flex-shrink-0">
          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowEnhancedForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-0 whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">New Quotation</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search quotations by customer name, number, or location..."
          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Quotations List */}
      {viewMode === 'table' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Till
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {quotation.customer?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {quotation.customer?.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {quotation.customer?.phoneNumber}
                          </div>
                          {quotation.customer?.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {quotation.customer?.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quotation.invoiceNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(quotation.quotationDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quotation.quotationType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start text-sm text-gray-900">
                        <MapPinIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{quotation.serviceDetails?.location || 'Not specified'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(quotation.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quotation.items?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                        {getStatusDisplayName(quotation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(new Date(Date.now() + quotation.validityDays * 24 * 60 * 60 * 1000))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewingQuotation(quotation)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEdit(quotation)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => exportToPDF(quotation)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Export PDF"
                        >
                          <PrinterIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => duplicateQuotation(quotation)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Duplicate"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteQuotation(quotation.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuotations.length === 0 && (
            <div className="text-center py-12">
              <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No quotations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {quotations.length === 0 
                  ? 'Get started by creating a new quotation.' 
                  : 'Try adjusting your search criteria.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowEnhancedForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-0 whitespace-nowrap"
                >
                  <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">New Quotation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuotations.map((quotation) => (
            <div key={quotation.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {quotation.customer?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {quotation.customer?.name}
                      </h3>
                      <p className="text-sm text-gray-500">{quotation.invoiceNumber}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                    {getStatusDisplayName(quotation.status)}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {quotation.customer?.phoneNumber}
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{quotation.serviceDetails?.location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Valid till: {formatDate(new Date(Date.now() + quotation.validityDays * 24 * 60 * 60 * 1000))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(quotation.totalAmount)}
                    </p>
                    <p className="text-sm text-gray-500">{quotation.items?.length || 0} items</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewingQuotation(quotation)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEdit(quotation)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => exportToPDF(quotation)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Export PDF"
                    >
                      <PrinterIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => duplicateQuotation(quotation)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Duplicate"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteQuotation(quotation.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Invoice Form Modal - Direct usage without wrapper */}
      {showEnhancedForm && (
        <EnhancedInvoiceForm
          onClose={() => setShowEnhancedForm(false)}
          onSave={onQuotationCreated}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingQuotation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
            
            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Quotation
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Depth (feet)</label>
                    <input
                      type="number"
                      value={editDepth}
                      onChange={(e) => setEditDepth(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">7" PVC (feet)</label>
                    <input
                      type="number"
                      value={editPVC7}
                      onChange={(e) => setEditPVC7(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">10" PVC (feet)</label>
                    <input
                      type="number"
                      value={editPVC10}
                      onChange={(e) => setEditPVC10(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Labour & Transportation</label>
                    <input
                      type="number"
                      value={editBata}
                      onChange={(e) => setEditBata(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={updateQuotation}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingQuotation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setViewingQuotation(null)} />
            
            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Quotation Details - {viewingQuotation.invoiceNumber}
                  </h3>
                  <button
                    onClick={() => setViewingQuotation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer</dt>
                      <dd className="mt-1 text-sm text-gray-900">{viewingQuotation.customer?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{viewingQuotation.customer?.phoneNumber}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Service Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">{viewingQuotation.serviceDetails?.location}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Quotation Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(viewingQuotation.quotationDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valid Till</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(new Date(Date.now() + viewingQuotation.validityDays * 24 * 60 * 60 * 1000))}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Items</h4>
                  <div className="overflow-x-auto">
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
                        {viewingQuotation.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.unit}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.rate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-end">
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Subtotal:</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatCurrency(viewingQuotation.subtotal)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Tax (18%):</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatCurrency(viewingQuotation.taxAmount)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <dt className="text-base font-medium text-gray-900">Total:</dt>
                        <dd className="text-base font-medium text-gray-900">{formatCurrency(viewingQuotation.totalAmount)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement;
