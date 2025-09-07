import toast from 'react-hot-toast';

export interface SyncData {
  invoices: any[];
  quotations: any[];
  customers: any[];
  slabRateConfig: any;
  slabNames: any;
  customSlabs: any;
  settings: any;
  serviceTypes: any[];
  invoiceNumbers: any;
  lastSync: string;
}

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

class GoogleDriveSyncService {
  private accessToken: string | null = null;
  private folderId: string | null = null;
  private readonly FOLDER_NAME = 'Anjaneya Borewells Data';
  private readonly BACKUP_FILE_NAME = 'borewell_data_backup.json';
  private syncInterval: NodeJS.Timeout | null = null;
  private isAutoSyncEnabled: boolean = false;
  private syncIntervalMinutes: number = 5; // Default 5 minutes
  private getClientId(): string {
    // Try to get from settings first, then fallback to environment variable
    const settings = localStorage.getItem('anjaneya_settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.googleDrive?.clientId) {
          return parsedSettings.googleDrive.clientId;
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
    return process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  }

  private getRedirectUri(): string {
    // Try to get from settings first, then fallback to environment variable
    const settings = localStorage.getItem('anjaneya_settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.googleDrive?.redirectUri) {
          return parsedSettings.googleDrive.redirectUri;
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
    return process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-auth-callback';
  }

  constructor() {
    this.loadSavedTokens();
    this.loadAutoSyncSettings();
    this.startAutoSync();
  }

  private loadSavedTokens() {
    const savedTokens = localStorage.getItem('google_drive_tokens');
    if (savedTokens) {
      const tokens = JSON.parse(savedTokens);
      this.accessToken = tokens.access_token;
    }
  }

  private loadAutoSyncSettings() {
    const settings = localStorage.getItem('anjaneya_settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        this.isAutoSyncEnabled = parsedSettings.googleDrive?.autoSync === true;
        this.syncIntervalMinutes = parsedSettings.googleDrive?.syncIntervalMinutes || 5;
      } catch (error) {
        console.error('Error loading auto sync settings:', error);
      }
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      // Check if we already have valid tokens
      if (this.accessToken) {
        return true;
      }

      // Generate auth URL
      const clientId = this.getClientId();
      const redirectUri = this.getRedirectUri();
      
      if (!clientId) {
        toast.error('Google Drive Client ID not configured. Please set it up in Settings.');
        return false;
      }
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file');
      authUrl.searchParams.set('access_type', 'offline');

      // Open auth URL in new window
      const authWindow = window.open(authUrl.toString(), 'google-auth', 'width=500,height=600');
      
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            resolve(false);
          }
        }, 1000);

        // Listen for auth completion
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_CODE') {
            clearInterval(checkClosed);
            authWindow?.close();
            window.removeEventListener('message', handleMessage);
            
            try {
              const tokens = await this.exchangeCodeForTokens(event.data.code);
              this.accessToken = tokens.access_token;
              localStorage.setItem('google_drive_tokens', JSON.stringify(tokens));
              resolve(true);
            } catch (error) {
              console.error('Token exchange failed:', error);
              resolve(false);
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed);
            authWindow?.close();
            window.removeEventListener('message', handleMessage);
            console.error('OAuth error:', event.data.error);
            resolve(false);
          }
        };

        window.addEventListener('message', handleMessage);
      });
    } catch (error) {
      console.error('Authentication failed:', error);
      toast.error('Google Drive authentication failed');
      return false;
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<any> {
    const clientId = this.getClientId();
    const redirectUri = this.getRedirectUri();
    
    // Get client secret from settings
    const settings = localStorage.getItem('anjaneya_settings');
    let clientSecret = '';
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        clientSecret = parsedSettings.googleDrive?.clientSecret || '';
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
    
    if (!clientSecret) {
      throw new Error('Google Drive Client Secret not configured');
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', response.status, errorText);
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async createFolder(): Promise<string | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      // Check if folder already exists
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.files && listData.files.length > 0) {
          this.folderId = listData.files[0].id;
          return this.folderId;
        }
      }

      // Create new folder
      const folderMetadata = {
        name: this.FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderMetadata),
      });

      if (createResponse.ok) {
        const folderData = await createResponse.json();
        this.folderId = folderData.id;
        return this.folderId;
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create Google Drive folder');
      return null;
    }
  }

  async collectAllData(): Promise<SyncData> {
    const data: SyncData = {
      invoices: JSON.parse(localStorage.getItem('anjaneya_invoices') || '[]'),
      quotations: JSON.parse(localStorage.getItem('anjaneya_quotations') || '[]'),
      customers: JSON.parse(localStorage.getItem('anjaneya_customers') || '[]'),
      slabRateConfig: JSON.parse(localStorage.getItem('anjaneya_slab_rate_config') || '{}'),
      slabNames: JSON.parse(localStorage.getItem('anjaneya_slab_names') || '{}'),
      customSlabs: JSON.parse(localStorage.getItem('anjaneya_custom_slabs') || '{}'),
      settings: JSON.parse(localStorage.getItem('anjaneya_settings') || '{}'),
      serviceTypes: JSON.parse(localStorage.getItem('anjaneya_service_types') || '[]'),
      invoiceNumbers: JSON.parse(localStorage.getItem('anjaneya_invoice_numbers') || '{}'),
      lastSync: new Date().toISOString()
    };

    return data;
  }

  async uploadBackup(data: SyncData): Promise<boolean> {
    try {
      if (!this.accessToken || !this.folderId) {
        throw new Error('Not authenticated or folder not created');
      }

      const fileContent = JSON.stringify(data, null, 2);
      const fileName = `${this.BACKUP_FILE_NAME}_${new Date().toISOString().split('T')[0]}.json`;

      // Check if file already exists
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and parents in '${this.folderId}' and trashed=false&fields=files(id,name)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      let fileId = null;
      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.files && listData.files.length > 0) {
          fileId = listData.files[0].id;
        }
      }

      const formData = new FormData();
      const fileMetadata = {
        name: fileName,
        parents: [this.folderId]
      };
      
      formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      formData.append('file', new Blob([fileContent], { type: 'application/json' }));

      if (fileId) {
        // Update existing file
        const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: formData,
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update file');
        }
      } else {
        // Create new file
        const createResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: formData,
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create file');
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to upload backup:', error);
      toast.error('Failed to upload backup to Google Drive');
      return false;
    }
  }

  async downloadBackup(): Promise<SyncData | null> {
    try {
      if (!this.accessToken || !this.folderId) {
        throw new Error('Not authenticated or folder not created');
      }

      // Get the most recent backup file
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=parents in '${this.folderId}' and name contains '${this.BACKUP_FILE_NAME}' and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!listResponse.ok) {
        throw new Error('Failed to list files');
      }

      const listData = await listResponse.json();
      if (!listData.files || listData.files.length === 0) {
        toast.error('No backup files found in Google Drive');
        return null;
      }

      const latestFile = listData.files[0];
      const downloadResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${latestFile.id}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!downloadResponse.ok) {
        throw new Error('Failed to download file');
      }

      const fileContent = await downloadResponse.text();
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Failed to download backup:', error);
      toast.error('Failed to download backup from Google Drive');
      return null;
    }
  }

  async restoreData(data: SyncData): Promise<boolean> {
    try {
      // Restore all data to localStorage
      localStorage.setItem('anjaneya_invoices', JSON.stringify(data.invoices || []));
      localStorage.setItem('anjaneya_quotations', JSON.stringify(data.quotations || []));
      localStorage.setItem('anjaneya_customers', JSON.stringify(data.customers || []));
      localStorage.setItem('anjaneya_slab_rate_config', JSON.stringify(data.slabRateConfig || {}));
      localStorage.setItem('anjaneya_slab_names', JSON.stringify(data.slabNames || {}));
      localStorage.setItem('anjaneya_custom_slabs', JSON.stringify(data.customSlabs || {}));
      localStorage.setItem('anjaneya_settings', JSON.stringify(data.settings || {}));
      localStorage.setItem('anjaneya_service_types', JSON.stringify(data.serviceTypes || []));
      localStorage.setItem('anjaneya_invoice_numbers', JSON.stringify(data.invoiceNumbers || {}));

      return true;
    } catch (error) {
      console.error('Failed to restore data:', error);
      toast.error('Failed to restore data from backup');
      return false;
    }
  }

  async syncToGoogleDrive(): Promise<boolean> {
    try {
      toast.loading('Syncing to Google Drive...', { id: 'sync' });

      // Authenticate
      const authenticated = await this.authenticate();
      if (!authenticated) {
        toast.error('Authentication failed', { id: 'sync' });
        return false;
      }

      // Create folder
      const folderId = await this.createFolder();
      if (!folderId) {
        toast.error('Failed to create folder', { id: 'sync' });
        return false;
      }

      // Collect data
      const data = await this.collectAllData();

      // Upload backup
      const uploaded = await this.uploadBackup(data);
      if (!uploaded) {
        toast.error('Failed to upload backup', { id: 'sync' });
        return false;
      }

      this.saveLastSyncTime(); // Save the sync time
      toast.success('Data synced to Google Drive successfully!', { id: 'sync' });
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync to Google Drive failed', { id: 'sync' });
      return false;
    }
  }

  async syncFromGoogleDrive(): Promise<boolean> {
    try {
      toast.loading('Syncing from Google Drive...', { id: 'sync' });

      // Authenticate
      const authenticated = await this.authenticate();
      if (!authenticated) {
        toast.error('Authentication failed', { id: 'sync' });
        return false;
      }

      // Create folder
      const folderId = await this.createFolder();
      if (!folderId) {
        toast.error('Failed to create folder', { id: 'sync' });
        return false;
      }

      // Download backup
      const data = await this.downloadBackup();
      if (!data) {
        toast.error('Failed to download backup', { id: 'sync' });
        return false;
      }

      // Restore data
      const restored = await this.restoreData(data);
      if (!restored) {
        toast.error('Failed to restore data', { id: 'sync' });
        return false;
      }

      this.saveLastSyncTime(); // Save the sync time
      toast.success('Data synced from Google Drive successfully!', { id: 'sync' });
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync from Google Drive failed', { id: 'sync' });
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.accessToken != null;
  }

  isGoogleDriveEnabled(): boolean {
    const settings = localStorage.getItem('anjaneya_settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        return parsedSettings.googleDrive?.enabled === true;
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
    return false;
  }

  private startAutoSync() {
    this.stopAutoSync(); // Clear any existing interval
    
    if (this.isAutoSyncEnabled && this.accessToken) {
      const intervalMs = this.syncIntervalMinutes * 60 * 1000; // Convert minutes to milliseconds
      
      this.syncInterval = setInterval(async () => {
        try {
          console.log('Auto-syncing to Google Drive...');
          await this.syncToGoogleDrive();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }, intervalMs);
      
      console.log(`Auto-sync started: every ${this.syncIntervalMinutes} minutes`);
    }
  }

  private stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  public updateAutoSyncSettings(enabled: boolean, intervalMinutes: number = 5) {
    this.isAutoSyncEnabled = enabled;
    this.syncIntervalMinutes = intervalMinutes;
    
    // Save to settings
    const settings = localStorage.getItem('anjaneya_settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        parsedSettings.googleDrive = {
          ...parsedSettings.googleDrive,
          autoSync: enabled,
          syncIntervalMinutes: intervalMinutes
        };
        localStorage.setItem('anjaneya_settings', JSON.stringify(parsedSettings));
      } catch (error) {
        console.error('Error saving auto sync settings:', error);
      }
    }
    
    // Restart auto-sync with new settings
    this.startAutoSync();
  }

  public getAutoSyncStatus() {
    return {
      enabled: this.isAutoSyncEnabled,
      intervalMinutes: this.syncIntervalMinutes,
      isRunning: this.syncInterval !== null
    };
  }

  public getLastSyncTime(): string | null {
    const settings = localStorage.getItem('anjaneya_settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        return parsedSettings.googleDrive?.lastSyncTime || null;
      } catch (error) {
        console.error('Error getting last sync time:', error);
      }
    }
    return null;
  }

  private saveLastSyncTime() {
    const settings = localStorage.getItem('anjaneya_settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        parsedSettings.googleDrive = {
          ...parsedSettings.googleDrive,
          lastSyncTime: new Date().toISOString()
        };
        localStorage.setItem('anjaneya_settings', JSON.stringify(parsedSettings));
      } catch (error) {
        console.error('Error saving last sync time:', error);
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      this.stopAutoSync(); // Stop auto-sync when signing out
      
      if (this.accessToken) {
        // Revoke the token
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: this.accessToken,
          }),
        });
      }
      localStorage.removeItem('google_drive_tokens');
      this.accessToken = null;
      this.folderId = null;
      toast.success('Signed out from Google Drive');
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out');
    }
  }
}

export const googleDriveSync = new GoogleDriveSyncService();
