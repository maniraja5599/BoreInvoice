import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, InformationCircleIcon, PlusIcon, TrashIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { serviceTypeService } from '../services/serviceTypeService';
import { invoiceNumberService } from '../services/invoiceNumberService';

interface SettingsData {
  company: {
    name: string;
    contact: string;
    address: string;
  };
  application: {
    currency: string;
    dateFormat: string;
    autoSave: boolean;
  };
  serviceTypes: {
    predefined: string[];
    custom: string[];
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    company: {
      name: 'Anjaneya Borewells',
      contact: '+91 98765 43210',
      address: '123 Main Street, City, State - PIN'
    },
    application: {
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      autoSave: true
    },
    serviceTypes: {
      predefined: ['Bore Drilling', 'Repair', 'Flushing', 'Earth Purpose'],
      custom: []
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [newServiceType, setNewServiceType] = useState('');
  const [showAddServiceType, setShowAddServiceType] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('anjaneya_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    
    // Load service types
    const serviceTypeConfig = serviceTypeService.getServiceTypeConfig();
    setSettings(prev => ({
      ...prev,
      serviceTypes: serviceTypeConfig
    }));
  }, []);

  // Handle input changes
  const handleInputChange = (section: keyof SettingsData, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Save settings to localStorage
  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('anjaneya_settings', JSON.stringify(settings));
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new service type
  const handleAddServiceType = () => {
    if (!newServiceType.trim()) {
      toast.error('Please enter a service type name');
      return;
    }
    
    const success = serviceTypeService.addCustomServiceType(newServiceType);
    if (success) {
      // Update local state
      const updatedConfig = serviceTypeService.getServiceTypeConfig();
      setSettings(prev => ({
        ...prev,
        serviceTypes: updatedConfig
      }));
      
      setNewServiceType('');
      setShowAddServiceType(false);
      toast.success(`Service type "${newServiceType.trim()}" added successfully`);
    } else {
      toast.error('Service type already exists');
    }
  };

  // Remove custom service type
  const handleRemoveServiceType = (serviceType: string) => {
    const success = serviceTypeService.removeCustomServiceType(serviceType);
    if (success) {
      // Update local state
      const updatedConfig = serviceTypeService.getServiceTypeConfig();
      setSettings(prev => ({
        ...prev,
        serviceTypes: updatedConfig
      }));
      toast.success(`Service type "${serviceType}" removed successfully`);
    } else {
      toast.error('Failed to remove service type');
    }
  };

  // Reset to defaults
  const handleReset = () => {
    const defaultSettings: SettingsData = {
      company: {
        name: 'Anjaneya Borewells',
        contact: '+91 98765 43210',
        address: '123 Main Street, City, State - PIN'
      },
      application: {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        autoSave: true
      },
      serviceTypes: {
        predefined: ['Bore Drilling', 'Repair', 'Flushing', 'Earth Purpose'],
        custom: []
      }
    };
    setSettings(defaultSettings);
    
    // Reset service types
    serviceTypeService.resetToDefaults();
    
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage application settings and preferences
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* Company Information */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Company Information
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={settings.company.name}
                    onChange={(e) => handleInputChange('company', 'name', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="tel"
                    value={settings.company.contact}
                    onChange={(e) => handleInputChange('company', 'contact', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    value={settings.company.address}
                    onChange={(e) => handleInputChange('company', 'address', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Application Settings
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Currency</label>
                    <p className="text-sm text-gray-500">Default currency for all transactions</p>
                  </div>
                  <select 
                    value={settings.application.currency}
                    onChange={(e) => handleInputChange('application', 'currency', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date Format</label>
                    <p className="text-sm text-gray-500">How dates are displayed in the application</p>
                  </div>
                  <select 
                    value={settings.application.dateFormat}
                    onChange={(e) => handleInputChange('application', 'dateFormat', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto-save</label>
                    <p className="text-sm text-gray-500">Automatically save form data</p>
                  </div>
                  <button 
                    onClick={() => handleInputChange('application', 'autoSave', !settings.application.autoSave)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.application.autoSave ? 'bg-blue-600' : 'bg-gray-200'
                    }`} 
                    role="switch" 
                    aria-checked={settings.application.autoSave}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.application.autoSave ? 'translate-x-5' : 'translate-x-0'
                    }`}></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Service Type Management */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Service Type Management
              </h3>
              <div className="mt-4 space-y-4">
                {/* Predefined Service Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Predefined Service Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {settings.serviceTypes.predefined.map((type, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-700">{type}</span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">System</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Service Types */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Custom Service Types</label>
                    <button
                      onClick={() => setShowAddServiceType(true)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Service Type
                    </button>
                  </div>
                  
                  {settings.serviceTypes.custom.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {settings.serviceTypes.custom.map((type, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                          <span className="text-sm text-gray-700">{type}</span>
                          <button
                            onClick={() => handleRemoveServiceType(type)}
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                            title="Remove service type"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No custom service types added yet</p>
                  )}
                </div>

                {/* Add Service Type Form */}
                {showAddServiceType && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Add New Service Type</h4>
                      <button
                        onClick={() => {
                          setShowAddServiceType(false);
                          setNewServiceType('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newServiceType}
                        onChange={(e) => setNewServiceType(e.target.value)}
                        placeholder="Enter service type name"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddServiceType();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleAddServiceType}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddServiceType(false);
                          setNewServiceType('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Number Management */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Invoice Number Management
              </h3>
              <div className="mt-4 space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Current Invoice Format</h4>
                  <p className="text-sm text-blue-700">
                    Format: <span className="font-mono bg-blue-100 px-2 py-1 rounded">YYMM-XXX</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Example: <span className="font-mono">2501-001</span> (January 2025, Invoice #1)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Current Month</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {invoiceNumberService.getCurrentMonthCount()}
                    </p>
                    <p className="text-xs text-gray-500">invoices generated this month</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Next Invoice Number</h4>
                    <p className="text-lg font-mono text-gray-900">
                      {invoiceNumberService.generateInvoiceNumber()}
                    </p>
                    <p className="text-xs text-gray-500">preview of next number</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Invoice Counts</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {invoiceNumberService.getAllMonthCounts().length > 0 ? (
                      <div className="space-y-1">
                        {invoiceNumberService.getAllMonthCounts().map((month) => (
                          <div key={month.month} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                            <span className="text-gray-700">{month.display}</span>
                            <span className="font-medium text-gray-900">{month.count} invoices</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No invoices generated yet</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const nextNumber = invoiceNumberService.generateInvoiceNumber();
                      toast.success(`Next invoice number: ${nextNumber}`);
                    }}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Preview Next Number
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset all invoice counters? This action cannot be undone.')) {
                        invoiceNumberService.resetCounters();
                        toast.success('Invoice counters reset successfully');
                      }
                    }}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reset Counters
                  </button>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Data Management</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Export Data</label>
                    <p className="text-sm text-gray-500">Download all data as CSV file</p>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Export
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Clear All Data</label>
                    <p className="text-sm text-gray-500">Permanently delete all data (cannot be undone)</p>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    Clear Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

