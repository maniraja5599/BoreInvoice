import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { customerService, paymentService } from '../services/borewellService';
import { ServiceInvoice, Customer, Payment } from '../types';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Load invoices from localStorage
      const storedInvoices = localStorage.getItem('anjaneya_invoices');
      const allInvoices = storedInvoices ? JSON.parse(storedInvoices) : [];
      const allCustomers = customerService.getAll();
      const allPayments = paymentService.getAll();
      
      setInvoices(allInvoices);
      setCustomers(allCustomers);
      setPayments(allPayments);
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMonthlyData = () => {
    const monthlyData = new Array(12).fill(0).map(() => ({ revenue: 0, invoices: 0 }));
    
    invoices.forEach(invoice => {
      const month = new Date(invoice.createdAt).getMonth();
      monthlyData[month].invoices++;
      monthlyData[month].revenue += invoice.paidAmount;
    });
    
    return monthlyData;
  };

  const getPaymentMethodBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      const method = payment.paymentMethod.replace('_', ' ');
      breakdown[method] = (breakdown[method] || 0) + payment.amount;
    });
    
    return breakdown;
  };

  const getTopCustomers = () => {
    const customerStats: { [key: string]: { name: string; totalSpent: number; invoices: number } } = {};
    
    invoices.forEach(invoice => {
      const customerId = invoice.customer.id;
      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          name: invoice.customer.name,
          totalSpent: 0,
          invoices: 0
        };
      }
      customerStats[customerId].totalSpent += invoice.paidAmount;
      customerStats[customerId].invoices++;
    });
    
    return Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                                      <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                    <dd className="text-lg font-medium text-gray-900">{invoices.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(invoices.reduce((sum, p) => sum + p.paidAmount, 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="text-lg font-medium text-gray-900">{customers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(invoices.reduce((sum, p) => sum + p.pendingAmount, 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Status Distribution</h3>
          <div className="space-y-3">
            {['PENDING', 'PAID', 'CANCELLED'].map(status => {
              const count = invoices.filter(p => p.status === status).length;
              const percentage = invoices.length > 0 ? (count / invoices.length) * 100 : 0;
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{status.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(getPaymentMethodBreakdown()).map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{method}</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue & Invoices</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoices</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Revenue/Invoice</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getMonthlyData().map((data, index) => {
                const monthName = new Date(2024, index).toLocaleDateString('en-IN', { month: 'long' });
                const avgRevenue = data.invoices > 0 ? data.revenue / data.invoices : 0;
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{monthName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(data.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.invoices}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(avgRevenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoices</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Spent/Invoice</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getTopCustomers().map((customer, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(customer.totalSpent)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.invoices}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(customer.totalSpent / customer.invoices)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInvoiceReport = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.slice(0, 10).map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">{invoice.serviceDetails.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(invoice.paidAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            View detailed reports and analytics for your borewell service business
          </p>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'financial', name: 'Financial', icon: CurrencyRupeeIcon },
              { id: 'invoices', name: 'Invoices', icon: WrenchScrewdriverIcon }
            ].map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedReport === report.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <report.icon className="h-5 w-5 inline mr-2" />
                {report.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          {selectedReport === 'overview' && renderOverviewReport()}
          {selectedReport === 'financial' && renderFinancialReport()}
          {selectedReport === 'invoices' && renderInvoiceReport()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
