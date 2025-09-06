import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  DocumentArrowDownIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BeakerIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Customers', href: '/customers', icon: UsersIcon },
    { name: 'Invoices', href: '/invoices', icon: DocumentArrowDownIcon },
    { name: 'Reminders', href: '/reminders', icon: BellIcon },
    { name: 'Slab Rates', href: '/slab-rates', icon: CalculatorIcon },
    { name: 'Quotations', href: '/quotations', icon: ClipboardDocumentListIcon },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getIconColors = (itemName: string, isActiveState: boolean) => {
    const iconColors = {
      'Dashboard': {
        active: 'text-blue-600',
        inactive: 'text-blue-400',
        hover: 'group-hover:text-blue-500'
      },
      'Customers': {
        active: 'text-green-600',
        inactive: 'text-green-400',
        hover: 'group-hover:text-green-500'
      },
      'Invoices': {
        active: 'text-purple-600',
        inactive: 'text-purple-400',
        hover: 'group-hover:text-purple-500'
      },
      'Reminders': {
        active: 'text-red-600',
        inactive: 'text-red-400',
        hover: 'group-hover:text-red-500'
      },
      'Slab Rates': {
        active: 'text-orange-600',
        inactive: 'text-orange-400',
        hover: 'group-hover:text-orange-500'
      },
      'Quotations': {
        active: 'text-purple-600',
        inactive: 'text-purple-400',
        hover: 'group-hover:text-purple-500'
      },
      'Payments': {
        active: 'text-yellow-600',
        inactive: 'text-yellow-500',
        hover: 'group-hover:text-yellow-600'
      },
      'Reports': {
        active: 'text-indigo-600',
        inactive: 'text-indigo-400',
        hover: 'group-hover:text-indigo-500'
      },
      'Settings': {
        active: 'text-gray-600',
        inactive: 'text-gray-400',
        hover: 'group-hover:text-gray-500'
      }
    };

    const colors = iconColors[itemName as keyof typeof iconColors] || iconColors['Settings'];
    return isActiveState ? colors.active : `${colors.inactive} ${colors.hover}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BeakerIcon className="text-white h-5 w-5" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">Anjaneya Borewells</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-r-2 border-blue-500 shadow-sm'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 hover:shadow-sm'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 font-bold transition-colors duration-200 ${
                    getIconColors(item.name, isActive(item.href))
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white shadow-xl">
          <div className="flex h-16 items-center px-4">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BeakerIcon className="text-white h-6 w-6" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">Anjaneya Borewells</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-r-2 border-blue-500 shadow-sm'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 hover:shadow-sm'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 font-bold transition-colors duration-200 ${
                    getIconColors(item.name, isActive(item.href))
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <NotificationBell />
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4">
                <span className="text-sm text-gray-700">Welcome to Anjaneya Borewells</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

