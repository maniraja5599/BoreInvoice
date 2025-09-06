import React, { useState, useEffect } from 'react';
import { enhancedCustomerService } from '../services/borewellService';
import { Customer } from '../types';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

type SortField = 'name' | 'paymentAmount' | 'totalOutstanding' | 'dueDate' | 'lastPaymentDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type PaymentFilter = 'all' | 'paid' | 'unpaid' | 'overdue';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface PaymentStats {
  totalCustomers: number;
  paidCustomers: number;
  unpaidCustomers: number;
  overdueCustomers: number;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
}

const PaymentManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { field: 'name', direction: 'asc' }
  ]);
  const [stats, setStats] = useState<PaymentStats>({
    totalCustomers: 0,
    paidCustomers: 0,
    unpaidCustomers: 0,
    overdueCustomers: 0,
    totalReceived: 0,
    totalPending: 0,
    totalOverdue: 0
  });

  // Date range filtering
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    dateType: 'dueDate' as 'dueDate' | 'lastPaymentDate' | 'createdAt'
  });

  // Amount range filtering
  const [amountRange, setAmountRange] = useState({
    minAmount: '',
    maxAmount: '',
    amountType: 'totalOutstanding' as 'totalOutstanding' | 'paymentAmount'
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [customers, searchTerm, paymentFilter, sortConfigs, dateRange, amountRange]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerData = enhancedCustomerService.getAll();
      setCustomers(customerData);
      calculateStats(customerData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (customerData: Customer[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paidCustomers = customerData.filter(c => c.billingStatus === 'PAID');
    const unpaidCustomers = customerData.filter(c => c.billingStatus === 'UNPAID');
    const overdueCustomers = customerData.filter(c => 
      c.billingStatus === 'UNPAID' && 
      c.dueDate && 
      new Date(c.dueDate) < today
    );

    const totalReceived = paidCustomers.reduce((sum, c) => sum + (c.paymentAmount || 0), 0);
    const totalPending = unpaidCustomers.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0);
    const totalOverdue = overdueCustomers.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0);

    setStats({
      totalCustomers: customerData.length,
      paidCustomers: paidCustomers.length,
      unpaidCustomers: unpaidCustomers.length,
      overdueCustomers: overdueCustomers.length,
      totalReceived,
      totalPending,
      totalOverdue
    });
  };

  const applyFiltersAndSort = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.phoneNumber.includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.address.toLowerCase().includes(term) ||
        customer.billNumber?.toLowerCase().includes(term)
      );
    }

    // Payment status filter
    if (paymentFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(customer => {
        switch (paymentFilter) {
          case 'paid':
            return customer.billingStatus === 'PAID';
          case 'unpaid':
            return customer.billingStatus === 'UNPAID';
          case 'overdue':
            return customer.billingStatus === 'UNPAID' && 
                   customer.dueDate && 
                   new Date(customer.dueDate) < today;
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(customer => {
        const dateValue = customer[dateRange.dateType];
        if (!dateValue) return false;

        const customerDate = new Date(dateValue);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date('1900-01-01');
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date('2100-12-31');

        return customerDate >= startDate && customerDate <= endDate;
      });
    }

    // Amount range filter
    if (amountRange.minAmount || amountRange.maxAmount) {
      filtered = filtered.filter(customer => {
        const amount = customer[amountRange.amountType] || 0;
        const minAmount = amountRange.minAmount ? parseFloat(amountRange.minAmount) : 0;
        const maxAmount = amountRange.maxAmount ? parseFloat(amountRange.maxAmount) : Infinity;

        return amount >= minAmount && amount <= maxAmount;
      });
    }

    // Multiple sorting
    if (sortConfigs.length > 0) {
      filtered.sort((a, b) => {
        for (const { field, direction } of sortConfigs) {
          let aValue = a[field];
          let bValue = b[field];

          // Handle different data types and ensure no undefined values
          if (field === 'dueDate' || field === 'lastPaymentDate' || field === 'createdAt') {
            aValue = aValue ? new Date(aValue).getTime() : 0;
            bValue = bValue ? new Date(bValue).getTime() : 0;
          } else if (field === 'paymentAmount' || field === 'totalOutstanding') {
            aValue = aValue || 0;
            bValue = bValue || 0;
          } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          } else {
            // Handle any remaining undefined cases
            aValue = aValue || '';
            bValue = bValue || '';
          }

          // Ensure both values are defined before comparison
          if (aValue != null && bValue != null) {
            if (aValue < bValue) {
              return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
              return direction === 'asc' ? 1 : -1;
            }
          }
        }
        return 0;
      });
    }

    setFilteredCustomers(filtered);
  };

  const handleSort = (field: SortField) => {
    setSortConfigs(prevConfigs => {
      const existingIndex = prevConfigs.findIndex(config => config.field === field);
      
      if (existingIndex >= 0) {
        // If field already exists, toggle direction or remove if it's desc
        const newConfigs = [...prevConfigs];
        if (newConfigs[existingIndex].direction === 'asc') {
          newConfigs[existingIndex].direction = 'desc';
        } else {
          newConfigs.splice(existingIndex, 1);
        }
        return newConfigs;
      } else {
        // Add new sort field
        return [...prevConfigs, { field, direction: 'asc' }];
      }
    });
  };

  const getSortIcon = (field: SortField) => {
    const config = sortConfigs.find(c => c.field === field);
    if (!config) return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />;
    
    return config.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-blue-500" />
      : <ChevronDownIcon className="h-4 w-4 text-blue-500" />;
  };

  const getSortBadge = (field: SortField) => {
    const index = sortConfigs.findIndex(c => c.field === field);
    if (index === -1) return null;
    
    return (
      <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
        {index + 1}
      </span>
    );
  };

  const clearAllSorts = () => {
    setSortConfigs([]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setPaymentFilter('all');
    setDateRange({ startDate: '', endDate: '', dateType: 'dueDate' });
    setAmountRange({ minAmount: '', maxAmount: '', amountType: 'totalOutstanding' });
    setSortConfigs([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPaymentStatusBadge = (customer: Customer) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (customer.billingStatus === 'PAID') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Paid
        </span>
      );
    } else if (customer.dueDate && new Date(customer.dueDate) < today) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Overdue
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
  };

  const updatePaymentStatus = async (customerId: string, status: 'PAID' | 'UNPAID') => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const updateData: Partial<Customer> = {
        billingStatus: status,
        lastPaymentDate: status === 'PAID' ? new Date() : customer.lastPaymentDate,
        totalOutstanding: status === 'PAID' ? 0 : customer.totalOutstanding
      };

      enhancedCustomerService.update(customerId, updateData);
      toast.success(`Payment status updated to ${status.toLowerCase()}`);
      loadCustomers();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track customer payments, manage billing status, and monitor outstanding amounts
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paid Customers</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.paidCustomers}</dd>
                  <dd className="text-sm text-green-600">{formatCurrency(stats.totalReceived)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.unpaidCustomers}</dd>
                  <dd className="text-sm text-yellow-600">{formatCurrency(stats.totalPending)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue Payments</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.overdueCustomers}</dd>
                  <dd className="text-sm text-red-600">{formatCurrency(stats.totalOverdue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyRupeeIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Outstanding</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalPending)}</dd>
                  <dd className="text-sm text-gray-600">{stats.totalCustomers} customers</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {/* Search and Payment Status Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, email, address, or bill number..."
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Customers</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Type</label>
                <select
                  value={dateRange.dateType}
                  onChange={(e) => setDateRange(prev => ({ ...prev, dateType: e.target.value as any }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="lastPaymentDate">Last Payment</option>
                  <option value="createdAt">Created Date</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Amount Range Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Type</label>
                <select
                  value={amountRange.amountType}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, amountType: e.target.value as any }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="totalOutstanding">Outstanding Amount</option>
                  <option value="paymentAmount">Payment Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  placeholder="0"
                  value={amountRange.minAmount}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={amountRange.maxAmount}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear All Filters
              </button>
              
              {sortConfigs.length > 0 && (
                <button
                  onClick={clearAllSorts}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear All Sorts ({sortConfigs.length})
                </button>
              )}

              <span className="text-sm text-gray-500">
                Showing {filteredCustomers.length} of {customers.length} customers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Customer
                    {getSortIcon('name')}
                    {getSortBadge('name')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th
                  onClick={() => handleSort('paymentAmount')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Payment Amount
                    {getSortIcon('paymentAmount')}
                    {getSortBadge('paymentAmount')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalOutstanding')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Outstanding
                    {getSortIcon('totalOutstanding')}
                    {getSortBadge('totalOutstanding')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dueDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Due Date
                    {getSortIcon('dueDate')}
                    {getSortBadge('dueDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lastPaymentDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Last Payment
                    {getSortIcon('lastPaymentDate')}
                    {getSortBadge('lastPaymentDate')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.address}</div>
                        {customer.billNumber && (
                          <div className="text-xs text-gray-400">Bill: {customer.billNumber}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {customer.phoneNumber}
                      </div>
                      {customer.email && (
                        <div className="flex items-center mt-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(customer.paymentAmount || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      (customer.totalOutstanding || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(customer.totalOutstanding || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(customer.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(customer.lastPaymentDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentStatusBadge(customer)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {customer.billingStatus === 'UNPAID' ? (
                        <button
                          onClick={() => updatePaymentStatus(customer.id, 'PAID')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Paid"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updatePaymentStatus(customer.id, 'UNPAID')}
                          className="text-red-600 hover:text-red-900"
                          title="Mark as Unpaid"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <CurrencyRupeeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {customers.length === 0 
                ? 'No customers available.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;