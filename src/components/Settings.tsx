import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  InformationCircleIcon, 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon, 
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CloudIcon,
  WrenchScrewdriverIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { serviceTypeService } from '../services/serviceTypeService';
import { invoiceNumberService } from '../services/invoiceNumberService';
import { googleDriveSync } from '../services/googleDriveSync';
import GoogleDriveSync from './GoogleDriveSync';

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
  googleDrive: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    enabled: boolean;
    autoSync: boolean;
    syncIntervalMinutes: number;
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
    },
    googleDrive: {
      clientId: '',
      clientSecret: '',
      redirectUri: 'http://localhost:3000/google-auth-callback',
      enabled: false,
      autoSync: false,
      syncIntervalMinutes: 5
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [newServiceType, setNewServiceType] = useState('');
  const [showAddServiceType, setShowAddServiceType] = useState(false);
  const [activeSection, setActiveSection] = useState('company');

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('anjaneya_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings,
          googleDrive: {
            ...prev.googleDrive,
            ...parsedSettings.googleDrive
          }
        }));
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
  const handleInputChange = (section: keyof SettingsData, field: string, value: string | boolean | number) => {
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
      setSettings(prev => ({
        ...prev,
        serviceTypes: serviceTypeService.getServiceTypeConfig()
      }));
      setNewServiceType('');
      setShowAddServiceType(false);
      toast.success('Service type added successfully!');
    } else {
      toast.error('Failed to add service type');
    }
  };

  // Remove service type
  const handleRemoveServiceType = (serviceType: string) => {
    const success = serviceTypeService.removeCustomServiceType(serviceType);
    if (success) {
      setSettings(prev => ({
        ...prev,
        serviceTypes: serviceTypeService.getServiceTypeConfig()
      }));
      toast.success('Service type removed successfully!');
    } else {
      toast.error('Failed to remove service type');
    }
  };

  // Test Google Drive configuration
  const testGoogleDriveConfig = () => {
    if (!settings.googleDrive.clientId || !settings.googleDrive.clientSecret) {
      toast.error('Please enter Google Drive Client ID and Client Secret');
      return;
    }
    
    // Update environment variables (for development)
    if (process.env.NODE_ENV === 'development') {
      process.env.REACT_APP_GOOGLE_CLIENT_ID = settings.googleDrive.clientId;
      process.env.REACT_APP_GOOGLE_CLIENT_SECRET = settings.googleDrive.clientSecret;
      process.env.REACT_APP_GOOGLE_REDIRECT_URI = settings.googleDrive.redirectUri;
    }
    
    toast.success('Google Drive configuration updated! Please restart the application for changes to take effect.');
  };

  const sections = [
    { id: 'company', name: 'Company Information', icon: BuildingOfficeIcon },
    { id: 'application', name: 'Application Settings', icon: Cog6ToothIcon },
    { id: 'serviceTypes', name: 'Service Types', icon: WrenchScrewdriverIcon },
    { id: 'invoiceNumbers', name: 'Invoice Numbers', icon: DocumentDuplicateIcon },
    { id: 'googleDrive', name: 'Google Drive Sync', icon: CloudIcon },
    { id: 'dataManagement', name: 'Data Management', icon: DocumentTextIcon }
  ];

  const renderCompanySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Company Information</h3>
        <p className="mt-1 text-sm text-gray-500">Configure your company details for invoices and quotations</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            value={settings.company.name}
            onChange={(e) => handleInputChange('company', 'name', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Number</label>
          <input
            type="text"
            value={settings.company.contact}
            onChange={(e) => handleInputChange('company', 'contact', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Company Address</label>
        <textarea
          value={settings.company.address}
          onChange={(e) => handleInputChange('company', 'address', e.target.value)}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderApplicationSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Application Settings</h3>
        <p className="mt-1 text-sm text-gray-500">Configure application preferences and behavior</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            value={settings.application.currency}
            onChange={(e) => handleInputChange('application', 'currency', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Format</label>
          <select
            value={settings.application.dateFormat}
            onChange={(e) => handleInputChange('application', 'dateFormat', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoSave"
          checked={settings.application.autoSave}
          onChange={(e) => handleInputChange('application', 'autoSave', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="autoSave" className="ml-2 block text-sm text-gray-700">
          Auto-save changes
        </label>
      </div>
    </div>
  );

  const renderServiceTypesSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Service Types</h3>
        <p className="mt-1 text-sm text-gray-500">Manage predefined and custom service types</p>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Predefined Service Types</h4>
        <div className="grid grid-cols-2 gap-2">
          {settings.serviceTypes.predefined.map((type, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">{type}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Custom Service Types</h4>
        <div className="space-y-2">
          {settings.serviceTypes.custom.map((type, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm text-gray-700">{type}</span>
              <button
                onClick={() => handleRemoveServiceType(type)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        
        {showAddServiceType ? (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newServiceType}
              onChange={(e) => setNewServiceType(e.target.value)}
              placeholder="Enter service type name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAddServiceType}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAddServiceType(false)}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddServiceType(true)}
            className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Custom Service Type
          </button>
        )}
      </div>
    </div>
  );

  const renderInvoiceNumbersSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Number Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">Configure invoice and quotation numbering</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Current Invoice Counter</label>
            <p className="text-sm text-gray-500">Next invoice number: {invoiceNumberService.generateInvoiceNumber()}</p>
          </div>
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
  );

  const renderGoogleDriveSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Google Drive Sync Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">Configure Google Drive API credentials for data backup</p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Setup Required:</p>
            <p>You need to set up Google Cloud Console credentials to use Google Drive sync. See the setup guide for detailed instructions.</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="googleDriveEnabled"
              checked={settings.googleDrive.enabled}
              onChange={(e) => handleInputChange('googleDrive', 'enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="googleDriveEnabled" className="ml-2 block text-sm text-gray-700">
              Enable Google Drive Sync
            </label>
          </div>
          
          {settings.googleDrive.enabled && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSyncEnabled"
                  checked={settings.googleDrive.autoSync}
                  onChange={(e) => {
                    handleInputChange('googleDrive', 'autoSync', e.target.checked);
                    googleDriveSync.updateAutoSyncSettings(e.target.checked, settings.googleDrive.syncIntervalMinutes);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSyncEnabled" className="ml-2 block text-sm text-gray-700">
                  Enable Automatic Sync
                </label>
              </div>
              
              {settings.googleDrive.autoSync && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sync Interval (minutes)</label>
                  <select
                    value={settings.googleDrive.syncIntervalMinutes}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value);
                      handleInputChange('googleDrive', 'syncIntervalMinutes', minutes);
                      googleDriveSync.updateAutoSyncSettings(settings.googleDrive.autoSync, minutes);
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 minute</option>
                    <option value={2}>2 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Data will be automatically synced to Google Drive every {settings.googleDrive.syncIntervalMinutes} minute(s)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Google Client ID</label>
          <input
            type="text"
            value={settings.googleDrive.clientId}
            onChange={(e) => handleInputChange('googleDrive', 'clientId', e.target.value)}
            placeholder="Enter your Google OAuth Client ID"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Google Client Secret</label>
          <input
            type="password"
            value={settings.googleDrive.clientSecret}
            onChange={(e) => handleInputChange('googleDrive', 'clientSecret', e.target.value)}
            placeholder="Enter your Google OAuth Client Secret"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Redirect URI</label>
          <input
            type="text"
            value={settings.googleDrive.redirectUri}
            onChange={(e) => handleInputChange('googleDrive', 'redirectUri', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={testGoogleDriveConfig}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Test Configuration
          </button>
        </div>
      </div>
      
      {settings.googleDrive.enabled && (
        <div className="mt-6">
          <GoogleDriveSync onSyncComplete={() => {
            console.log('Sync completed');
          }} />
        </div>
      )}
    </div>
  );

  const renderDataManagementSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Data Management</h3>
        <p className="mt-1 text-sm text-gray-500">Export, import, and manage your application data</p>
      </div>
      
      <div className="space-y-4">
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
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'company':
        return renderCompanySection();
      case 'application':
        return renderApplicationSection();
      case 'serviceTypes':
        return renderServiceTypesSection();
      case 'invoiceNumbers':
        return renderInvoiceNumbersSection();
      case 'googleDrive':
        return renderGoogleDriveSection();
      case 'dataManagement':
        return renderDataManagementSection();
      default:
        return renderCompanySection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-6">
            <Cog6ToothIcon className="h-8 w-8 text-gray-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="flex">
              {/* Sidebar Navigation */}
              <div className="w-64 bg-gray-50 border-r border-gray-200">
                <nav className="p-4 space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {section.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6">
                {renderActiveSection()}
                
                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Settings'}
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