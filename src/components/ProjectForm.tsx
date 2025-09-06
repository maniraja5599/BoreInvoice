import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { customerService, borewellService, paymentService } from '../services/borewellService';
import { slabRateService } from '../services/slabRateService';
import { Customer, PaymentMethod } from '../types';
import toast from 'react-hot-toast';

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id !== 'new';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    location: '',
    drillingDate: '',
    totalDepth: '',
    diameter: '',
    casingPipeLength: '',
    casingPipeCostPerFoot: '',
    numberOfFlushes: '',
    flushingCharges: '',
    additionalServices: [] as any[],
    advancePayment: '',
    paymentMethod: 'CASH' as PaymentMethod,
    paymentDescription: ''
  });

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: ''
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [duplicateCustomers, setDuplicateCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const allCustomers = customerService.getAll();
      setCustomers(allCustomers);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    // Use slab rate calculation for drilling cost
    const drillingCost = slabRateService.getTotalAmount(parseFloat(formData.totalDepth) || 0);
    const casingCost = parseFloat(formData.casingPipeLength) * parseFloat(formData.casingPipeCostPerFoot) || 0;
    const flushingCost = parseFloat(formData.flushingCharges) || 0;
    return drillingCost + casingCost + flushingCost;
  };

  const handleCreateCustomer = () => {
    if (!newCustomerData.name.trim() || !newCustomerData.address.trim() || !newCustomerData.phoneNumber.trim()) {
      toast.error('Please fill in all required customer fields');
      return;
    }

    // Check for duplicates before creating
    const duplicates = checkForDuplicates(newCustomerData.name, newCustomerData.phoneNumber, newCustomerData.email);
    if (duplicates.length > 0) {
      setDuplicateCustomers(duplicates);
      toast.error('Potential duplicate customers found. Please review before creating.');
      return;
    }

    try {
      const newCustomer = customerService.create({
        name: newCustomerData.name.trim(),
        address: newCustomerData.address.trim(),
        phoneNumber: newCustomerData.phoneNumber.trim(),
        email: newCustomerData.email.trim() || undefined,
        billingStatus: 'UNPAID' as 'PAID' | 'UNPAID',
        paymentAmount: 0,
        totalOutstanding: 0
      });

      // Add the new customer to the list and select it
      setCustomers([...customers, newCustomer]);
      setFormData({ ...formData, customerId: newCustomer.id });
      
      // Reset the new customer form
      setNewCustomerData({
        name: '',
        address: '',
        phoneNumber: '',
        email: ''
      });
      setShowNewCustomerForm(false);
      setDuplicateCustomers([]);
      
      toast.success('Customer created successfully');
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  const handleNewCustomerInputChange = (field: string, value: string) => {
    setNewCustomerData({ ...newCustomerData, [field]: value });
    
    // Check for duplicates when name, phone, or email changes
    if (field === 'name' || field === 'phoneNumber' || field === 'email') {
      const currentName = field === 'name' ? value : newCustomerData.name;
      const currentPhone = field === 'phoneNumber' ? value : newCustomerData.phoneNumber;
      const currentEmail = field === 'email' ? value : newCustomerData.email;
      
      const duplicates = checkForDuplicates(currentName, currentPhone, currentEmail);
      setDuplicateCustomers(duplicates);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phoneNumber.includes(searchLower) ||
      customer.address.toLowerCase().includes(searchLower) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  // Check for duplicate customers
  const checkForDuplicates = (name: string, phone: string, email: string) => {
    const duplicates: Customer[] = [];
    
    customers.forEach(customer => {
      let matchScore = 0;
      
      // Check name similarity (exact match or very similar)
      if (name.trim().toLowerCase() === customer.name.toLowerCase()) {
        matchScore += 3;
      } else if (name.trim().toLowerCase().includes(customer.name.toLowerCase()) || 
                 customer.name.toLowerCase().includes(name.trim().toLowerCase())) {
        matchScore += 2;
      }
      
      // Check phone number (exact match)
      if (phone.trim() === customer.phoneNumber) {
        matchScore += 3;
      }
      
      // Check email (if both have emails)
      if (email.trim() && customer.email && email.trim().toLowerCase() === customer.email.toLowerCase()) {
        matchScore += 2;
      }
      
      // If match score is 3 or higher, consider it a potential duplicate
      if (matchScore >= 3) {
        duplicates.push(customer);
      }
    });
    
    return duplicates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.location || !formData.drillingDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const totalCost = calculateTotalCost();
      
             const borewellData = {
         customerId: formData.customerId,
         location: formData.location,
         drillingDate: new Date(formData.drillingDate),
         totalDepth: parseFloat(formData.totalDepth) || 0,
         diameter: parseFloat(formData.diameter) || 0,
         drillingCostPerFoot: 0, // Not used with slab rates
         casingPipeLength: parseFloat(formData.casingPipeLength) || 0,
         casingPipeCostPerFoot: parseFloat(formData.casingPipeCostPerFoot) || 0,
         numberOfFlushes: parseInt(formData.numberOfFlushes) || 0,
         flushingCharges: parseFloat(formData.flushingCharges) || 0,
         additionalServices: formData.additionalServices,
         totalCost
       };

      let borewellId: string;
      if (isEditing && id) {
        borewellService.update(id, borewellData);
        borewellId = id;
        toast.success('Project updated successfully');
      } else {
        const newBorewell = borewellService.create(borewellData);
        borewellId = newBorewell.id;
        toast.success('Project created successfully');
      }

      if (formData.advancePayment && parseFloat(formData.advancePayment) > 0) {
        const paymentData = {
          borewellId,
          customerId: formData.customerId,
          amount: parseFloat(formData.advancePayment),
          paymentMethod: formData.paymentMethod,
          paymentDate: new Date(),
          isAdvance: true,
          description: formData.paymentDescription || 'Advance payment',
          updatedAt: new Date()
        };
        paymentService.create(paymentData);
      }

      navigate('/projects');
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/projects')} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Project' : 'New Borewell Project'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewCustomerForm(false);
                  setCustomerSearchTerm('');
                }}
                className={`px-3 py-1 text-sm rounded-md ${
                  !showNewCustomerForm 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewCustomerForm(true);
                  setCustomerSearchTerm('');
                }}
                className={`px-3 py-1 text-sm rounded-md ${
                  showNewCustomerForm 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Create New
              </button>
            </div>
          </div>

          {!showNewCustomerForm ? (
            // Existing customer selection with search
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Customers</label>
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by name, phone, address, or email..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                    {customerSearchTerm ? 'No customers found matching your search' : 'No customers available'}
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => setFormData({ ...formData, customerId: customer.id })}
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
                          </div>
                          {formData.customerId === customer.id && (
                            <div className="text-blue-600">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 truncate">{customer.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.customerId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {customers.find(c => c.id === formData.customerId)?.name}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // New customer creation form
            <div className="space-y-4">
              {/* Duplicate Warning */}
              {duplicateCustomers.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Potential duplicate customers found
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>The following customers have similar information:</p>
                        <div className="mt-2 space-y-1">
                          {duplicateCustomers.map((customer, index) => (
                            <div key={customer.id} className="flex items-center space-x-2">
                              <span className="font-medium">{customer.name}</span>
                              <span className="text-yellow-600">•</span>
                              <span>{customer.phoneNumber}</span>
                              {customer.email && (
                                <>
                                  <span className="text-yellow-600">•</span>
                                  <span>{customer.email}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 font-medium">Please review before creating to avoid duplicates.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerData.name}
                    onChange={(e) => handleNewCustomerInputChange('name', e.target.value)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      duplicateCustomers.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newCustomerData.phoneNumber}
                    onChange={(e) => handleNewCustomerInputChange('phoneNumber', e.target.value)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      duplicateCustomers.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <textarea
                  required
                  rows={3}
                  value={newCustomerData.address}
                  onChange={(e) => handleNewCustomerInputChange('address', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => handleNewCustomerInputChange('email', e.target.value)}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    duplicateCustomers.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewCustomerData({
                      name: '',
                      address: '',
                      phoneNumber: '',
                      email: ''
                    });
                    setDuplicateCustomers([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Form
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={duplicateCustomers.length > 0}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    duplicateCustomers.length > 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {duplicateCustomers.length > 0 ? 'Review Duplicates First' : 'Create Customer'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Borewell Details</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location/Address *</label>
              <textarea
                required
                rows={3}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter borewell site location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Drilling Date *</label>
              <input
                type="date"
                required
                value={formData.drillingDate}
                onChange={(e) => setFormData({ ...formData, drillingDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Depth (feet) *</label>
              <input
                type="number"
                required
                step="0.1"
                value={formData.totalDepth}
                onChange={(e) => setFormData({ ...formData, totalDepth: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 150.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Diameter (inches) *</label>
              <input
                type="number"
                required
                step="0.1"
                value={formData.diameter}
                onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 6.5"
              />
            </div>
          </div>
        </div>

                 <div className="bg-white shadow rounded-lg p-6">
           <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Details</h3>
           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
             <div>
               <label className="block text-sm font-medium text-gray-700">Drilling Cost (Auto-calculated)</label>
               <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600">
                 {formData.totalDepth ? 
                   `₹${slabRateService.getTotalAmount(parseFloat(formData.totalDepth)).toLocaleString('en-IN')} (based on slab rates)` :
                   'Enter depth to see calculated cost'
                 }
               </div>
               <p className="mt-1 text-xs text-gray-500">
                 Cost is automatically calculated based on configured slab rates
               </p>
             </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Casing Pipe Length (feet) *</label>
              <input
                type="number"
                required
                step="0.1"
                value={formData.casingPipeLength}
                onChange={(e) => setFormData({ ...formData, casingPipeLength: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 120.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Casing Pipe Cost per Foot (₹) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.casingPipeCostPerFoot}
                onChange={(e) => setFormData({ ...formData, casingPipeCostPerFoot: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 200.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Flushes *</label>
              <input
                type="number"
                required
                value={formData.numberOfFlushes}
                onChange={(e) => setFormData({ ...formData, numberOfFlushes: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Flushing Charges (₹) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.flushingCharges}
                onChange={(e) => setFormData({ ...formData, flushingCharges: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 500.00"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Advance Payment (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.advancePayment}
                onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 5000.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>
        </div>

                 <div className="bg-white shadow rounded-lg p-6">
           <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Summary</h3>
           <div className="space-y-4">
             {formData.totalDepth && (
               <div className="p-4 bg-gray-50 rounded-lg">
                 <h4 className="text-sm font-medium text-gray-900 mb-2">Drilling Cost Breakdown</h4>
                 <div className="text-sm text-gray-600 whitespace-pre-line">
                   {slabRateService.getSlabBreakdown(parseFloat(formData.totalDepth))}
                 </div>
               </div>
             )}
             
             <div className="space-y-2">
               <div className="flex justify-between">
                 <span className="text-gray-600">Drilling Cost:</span>
                 <span className="font-medium text-gray-900">
                   ₹{formData.totalDepth ? slabRateService.getTotalAmount(parseFloat(formData.totalDepth)).toLocaleString('en-IN') : '0'}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Casing Pipe Cost:</span>
                 <span className="font-medium text-gray-900">
                   ₹{((parseFloat(formData.casingPipeLength) || 0) * (parseFloat(formData.casingPipeCostPerFoot) || 0)).toLocaleString('en-IN')}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Flushing Charges:</span>
                 <span className="font-medium text-gray-900">
                   ₹{(parseFloat(formData.flushingCharges) || 0).toLocaleString('en-IN')}
                 </span>
               </div>
               <div className="border-t pt-2 flex justify-between font-semibold">
                 <span className="text-gray-900">Total Cost:</span>
                 <span className="text-blue-600">
                   ₹{calculateTotalCost().toLocaleString('en-IN')}
                 </span>
               </div>
             </div>
           </div>
         </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
