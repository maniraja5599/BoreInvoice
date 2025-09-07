import React, { useState, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { googleDriveSync } from '../services/googleDriveSync';

interface GoogleDriveSyncProps {
  onSyncComplete?: () => void;
}

const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ onSyncComplete }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [autoSyncStatus, setAutoSyncStatus] = useState<any>(null);

  useEffect(() => {
    checkAuthStatus();
    loadLastSyncInfo();
    loadAutoSyncStatus();
    
    // Update auto-sync status every 5 seconds
    const interval = setInterval(loadAutoSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const isGoogleDriveEnabled = googleDriveSync.isGoogleDriveEnabled();

  const checkAuthStatus = () => {
    setIsAuthenticated(googleDriveSync.isAuthenticated());
  };

  const loadLastSyncInfo = () => {
    const lastSyncData = googleDriveSync.getLastSyncTime();
    if (lastSyncData) {
      setLastSync(lastSyncData);
    }
  };

  const loadAutoSyncStatus = () => {
    const status = googleDriveSync.getAutoSyncStatus();
    setAutoSyncStatus(status);
  };

  const handleSyncToDrive = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');
    
    try {
      const success = await googleDriveSync.syncToGoogleDrive();
      if (success) {
        setSyncStatus('success');
        setLastSync(new Date().toISOString());
        localStorage.setItem('last_google_drive_sync', new Date().toISOString());
        checkAuthStatus();
        onSyncComplete?.();
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync to drive failed:', error);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFromDrive = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');
    
    try {
      const success = await googleDriveSync.syncFromGoogleDrive();
      if (success) {
        setSyncStatus('success');
        setLastSync(new Date().toISOString());
        localStorage.setItem('last_google_drive_sync', new Date().toISOString());
        checkAuthStatus();
        onSyncComplete?.();
        // Reload the page to reflect restored data
        window.location.reload();
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync from drive failed:', error);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await googleDriveSync.signOut();
    setIsAuthenticated(false);
    setLastSync(null);
    localStorage.removeItem('last_google_drive_sync');
  };

  const formatLastSync = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Sync completed successfully';
      case 'error':
        return 'Sync failed';
      default:
        return 'Ready to sync';
    }
  };

  if (!isGoogleDriveEnabled) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CloudArrowUpIcon className="h-6 w-6 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Google Drive Sync</h3>
        </div>
        <div className="text-center py-8">
          <CloudArrowUpIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Google Drive sync is not enabled</p>
          <p className="text-sm text-gray-400">Please enable Google Drive sync in the configuration above to use this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CloudArrowUpIcon className="h-6 w-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Google Drive Sync</h3>
        </div>
        <div className="flex items-center">
          {getStatusIcon()}
          <span className="ml-2 text-sm text-gray-600">{getStatusText()}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Sync your data to Google Drive for backup and access across devices.
        </p>
        {lastSync && (
          <p className="text-xs text-gray-500">
            Last sync: {formatLastSync(lastSync)}
          </p>
        )}
        {autoSyncStatus && autoSyncStatus.enabled && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-xs text-green-700">
                Auto-sync enabled: Every {autoSyncStatus.intervalMinutes} minute(s)
                {autoSyncStatus.isRunning && ' • Running'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSyncToDrive}
          disabled={isLoading}
          className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
          {isLoading ? 'Syncing...' : 'Sync to Drive'}
        </button>

        <button
          onClick={handleSyncFromDrive}
          disabled={isLoading}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CloudArrowDownIcon className="h-4 w-4 mr-2" />
          {isLoading ? 'Syncing...' : 'Sync from Drive'}
        </button>

        {isAuthenticated && (
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign Out
          </button>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">What gets synced:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>All invoices and quotations</li>
              <li>Customer data</li>
              <li>Slab rate configurations</li>
              <li>Service types and settings</li>
              <li>Application preferences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveSync;
