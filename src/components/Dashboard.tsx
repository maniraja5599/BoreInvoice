import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  WrenchScrewdriverIcon, 
  CreditCardIcon, 
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
// import { projectService } from '../services/borewellService';
import { DashboardStats, ServiceInvoice } from '../types';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    thisMonthRevenue: 0,
    thisMonthInvoices: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<ServiceInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    try {
      // For now, create mock dashboard stats since we don't have invoice service yet
      // const mockStats: DashboardStats = {
      //   totalInvoices: 0,
      //   paidInvoices: 0,
      //   pendingInvoices: 0,
      //   totalRevenue: 0,
      //   pendingPayments: 0,
      //   thisMonthRevenue: 0,
      //   thisMonthInvoices: 0
      // };

      // Load invoices from localStorage
      const storedInvoices = localStorage.getItem('anjaneya_invoices');
      const allInvoices = storedInvoices ? JSON.parse(storedInvoices) : [];
      const recent = allInvoices
        .sort((a: ServiceInvoice, b: ServiceInvoice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Calculate stats from invoices
      const totalInvoices = allInvoices.length;
      const paidInvoices = allInvoices.filter((inv: ServiceInvoice) => inv.status === 'PAID').length;
      const pendingInvoices = allInvoices.filter((inv: ServiceInvoice) => inv.status !== 'PAID').length;
      const totalRevenue = allInvoices.reduce((sum: number, inv: ServiceInvoice) => sum + inv.paidAmount, 0);
      const pendingPayments = allInvoices.reduce((sum: number, inv: ServiceInvoice) => sum + inv.pendingAmount, 0);

      const now = new Date();
      const thisMonthInvoices = allInvoices.filter((inv: ServiceInvoice) => {
        const invoiceDate = new Date(inv.createdAt);
        return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
      }).length;

      const thisMonthRevenue = allInvoices
        .filter((inv: ServiceInvoice) => {
          const invoiceDate = new Date(inv.createdAt);
          return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum: number, inv: ServiceInvoice) => sum + inv.paidAmount, 0);

      const updatedStats: DashboardStats = {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        totalRevenue,
        pendingPayments,
        thisMonthRevenue,
        thisMonthInvoices
      };

      setStats(updatedStats);
      setRecentInvoices(recent);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome to Anjaneya Borewells Service Management
          </p>
        </div>

      </div>

      {/* Stats Grid */}
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
                  <dd className="text-lg font-medium text-gray-900">{stats.totalInvoices}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalRevenue)}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.pendingPayments)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.thisMonthInvoices} invoices</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Invoices</h3>
            <Link
              to="/invoices"
              className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All
            </Link>
          </div>
          
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
              <div className="mt-6">
                <Link
                  to="/invoices"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Invoice
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <li key={invoice.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {invoice.customer.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {invoice.serviceDetails.location}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {formatDate(invoice.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.pendingAmount > 0 ? `${formatCurrency(invoice.pendingAmount)} pending` : 'Paid'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Link
                          to={`/invoices`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/customers"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <UsersIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Manage Customers
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add, edit, and view customer information
                </p>
              </div>
            </Link>

            <Link
              to="/projects/new"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <PlusIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  New Project
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create a new borewell project
                </p>
              </div>
            </Link>

            <Link
              to="/payments"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                  <CreditCardIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Payments
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Track payments and manage finances
                </p>
              </div>
            </Link>

                         <Link
               to="/slab-rates"
               className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
             >
               <div>
                 <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                   <CalculatorIcon className="h-6 w-6" />
                 </span>
               </div>
               <div className="mt-8">
                 <h3 className="text-lg font-medium">
                   <span className="absolute inset-0" aria-hidden="true" />
                   Slab Rates
                 </h3>
                 <p className="mt-2 text-sm text-gray-500">
                   Manage drilling rates and calculate costs
                 </p>
               </div>
             </Link>

             <Link
               to="/reports"
               className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
             >
               <div>
                 <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                   <DocumentTextIcon className="h-6 w-6" />
                 </span>
               </div>
               <div className="mt-8">
                 <h3 className="text-lg font-medium">
                   <span className="absolute inset-0" aria-hidden="true" />
                   Reports
                 </h3>
                 <p className="mt-2 text-sm text-gray-500">
                   Generate and view service reports
                 </p>
               </div>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

