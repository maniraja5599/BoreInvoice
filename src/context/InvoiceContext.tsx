import React, { createContext, useContext, useState, useEffect } from 'react';
import type { InvoiceData } from '../types';

// Types for Google API
declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

interface InvoiceContextType {
    invoices: InvoiceData[];
    saveInvoice: (invoice: InvoiceData) => void;
    deleteInvoice: (id: string) => void;
    importBackup: (file: File) => Promise<void>;
    exportBackup: () => void;
    shareBackup: () => Promise<void>;
    logo: string | null;
    setLogo: (logo: string | null) => void;

    // Google Drive Features
    isGoogleLoggedIn: boolean;
    loginToGoogle: () => void;
    googleUser: any;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    lastSyncTime: Date | null;
}

interface AppSettings {
    logo: string | null;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import defaultLogo from '../assets/logo.jpg';

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [invoices, setInvoices] = useState<InvoiceData[]>([]);
    const [logo, setLogoState] = useState<string | null>(defaultLogo);

    // Google Drive State
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);
    const [googleUser] = useState<any>(null); // Kept for interface compatibility
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('borewell_invoices');
        const savedSettings = localStorage.getItem('borewell_settings');
        if (saved) {
            try {
                setInvoices(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load invoices", e);
            }
        }
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.logo) setLogoState(parsed.logo);
            } catch (e) { console.error("Failed settings", e); }
        }

        // Load Google Scripts Dynamically
        if (CLIENT_ID) {
            const script1 = document.createElement('script');
            script1.src = 'https://accounts.google.com/gsi/client';
            script1.async = true;
            script1.defer = true;
            document.body.appendChild(script1);

            const script2 = document.createElement('script');
            script2.src = 'https://apis.google.com/js/api.js';
            script2.async = true;
            script2.defer = true;
            script2.onload = () => {
                window.gapi.load('client', async () => {
                    await window.gapi.client.init({
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                    });
                });
            };
            document.body.appendChild(script2);

            script1.onload = () => {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse: any) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            setIsGoogleLoggedIn(true);
                            setAccessToken(tokenResponse.access_token);
                        }
                    },
                });
                setTokenClient(client);
            }
        }
    }, []);

    const findOrCreateSyncFile = async (token: string, data: any): Promise<string | null> => {
        let fileId = localStorage.getItem('borewell_sync_file_id');
        const fileName = 'borewell_invoices_sync.json';

        try {
            if (!fileId) {
                // Search for file
                const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&fields=files(id)`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const searchResult = await searchResponse.json();
                if (searchResult.files && searchResult.files.length > 0) {
                    fileId = searchResult.files[0].id;
                    localStorage.setItem('borewell_sync_file_id', fileId!);
                }
            }

            if (!fileId) {
                // Create new file
                const metadata = {
                    name: fileName,
                    mimeType: 'application/json',
                    parents: ['root']
                };
                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' }));
                form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

                const createResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token },
                    body: form
                });
                const createResult = await createResponse.json();
                if (createResult.id) {
                    fileId = createResult.id;
                    localStorage.setItem('borewell_sync_file_id', fileId!);
                    return fileId;
                }
            } else {
                // Update existing file
                const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!updateResponse.ok) {
                    localStorage.removeItem('borewell_sync_file_id');
                    throw new Error('Failed to update file - might be deleted');
                }
                return fileId;
            }
        } catch (e) {
            console.error("Sync File Error", e);
            return null;
        }
        return null;
    };

    const performSync = async () => {
        if (!isGoogleLoggedIn || !accessToken || invoices.length === 0) return;

        setSyncStatus('syncing');
        try {
            await findOrCreateSyncFile(accessToken, invoices);
            setSyncStatus('success');
            setLastSyncTime(new Date());
            setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setSyncStatus('error');
        }
    };

    // Auto-sync effect
    useEffect(() => {
        if (isGoogleLoggedIn && accessToken) {
            const timeoutId = setTimeout(() => {
                performSync();
            }, 5000);
            return () => clearTimeout(timeoutId);
        }
    }, [invoices, isGoogleLoggedIn, accessToken]);

    // ... (previous code)

    const syncFromCloud = async (token: string) => {
        setSyncStatus('syncing');
        try {
            const fileName = 'borewell_invoices_sync.json';
            const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&fields=files(id)`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const searchResult = await searchResponse.json();

            if (searchResult.files && searchResult.files.length > 0) {
                const fileId = searchResult.files[0].id;
                localStorage.setItem('borewell_sync_file_id', fileId);

                // Download Content
                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (fileResponse.ok) {
                    const data = await fileResponse.json();
                    if (Array.isArray(data)) {
                        // MERGE STRATEGY: Combine arrays and remove duplicates by ID
                        setInvoices(prev => {
                            const combined = [...data, ...prev];
                            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                            localStorage.setItem('borewell_invoices', JSON.stringify(unique));
                            return unique;
                        });
                        setLastSyncTime(new Date());
                        setSyncStatus('success');
                        setTimeout(() => setSyncStatus('idle'), 3000);
                        return;
                    }
                }
            }
            setSyncStatus('success'); // No file found is also a "success" (just nothing to sync)
            setTimeout(() => setSyncStatus('idle'), 3000);

        } catch (e) {
            console.error("Download Error", e);
            setSyncStatus('error');
        }
    };

    // Combined Login Handler
    const loginToGoogle = () => {
        if (!CLIENT_ID || CLIENT_ID.includes('YOUR_CLIENT_ID_HERE')) {
            alert("Configuration Required:\n1. Create a Project in Google Cloud Console\n2. Create an OAuth Client ID\n3. Paste the ID into your .env file as VITE_GOOGLE_CLIENT_ID");
            return;
        }
        if (!tokenClient) {
            alert("Google service not ready yet. Please wait a moment.");
            return;
        }

        tokenClient.callback = (resp: any) => {
            if (resp.error) {
                console.error(resp);
                return;
            }
            const token = resp.access_token;
            // Calculate Expiry (default 3599 seconds)
            const expiresIn = resp.expires_in || 3599;
            const expiryTime = new Date().getTime() + (expiresIn * 1000);

            setAccessToken(token);
            setIsGoogleLoggedIn(true);

            // Persist Session
            localStorage.setItem('google_access_token', token);
            localStorage.setItem('google_token_expiry', expiryTime.toString());

            // Trigger Pull First!
            syncFromCloud(token);
        };

        tokenClient.requestAccessToken({ prompt: 'consent' });
    };

    const setLogo = (newLogo: string | null) => {
        setLogoState(newLogo);
        const settings: AppSettings = { logo: newLogo };
        localStorage.setItem('borewell_settings', JSON.stringify(settings));
    };

    const saveInvoice = (invoice: InvoiceData) => {
        setInvoices(prev => {
            const existing = prev.findIndex(i => i.id === invoice.id);
            let newInvoices;
            if (existing >= 0) {
                newInvoices = [...prev];
                newInvoices[existing] = invoice;
            } else {
                newInvoices = [invoice, ...prev];
            }
            localStorage.setItem('borewell_invoices', JSON.stringify(newInvoices));
            return newInvoices;
        });
    };

    const deleteInvoice = (id: string) => {
        setInvoices(prev => {
            const newInvoices = prev.filter(i => i.id !== id);
            localStorage.setItem('borewell_invoices', JSON.stringify(newInvoices));
            return newInvoices;
        });
    }

    const exportBackup = () => {
        const dataStr = JSON.stringify(invoices);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `borewell_backup_${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const shareBackup = async () => {
        try {
            const dataStr = JSON.stringify(invoices, null, 2);
            const fileName = `borewell_backup_${new Date().toISOString().split('T')[0]}.json`;
            const file = new File([dataStr], fileName, { type: 'application/json' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Borewell Backup',
                    text: 'Backup of Invoice Data',
                });
            } else {
                exportBackup();
            }
        } catch (error) {
            console.error('Error sharing backup:', error);
            exportBackup();
        }
    };

    const importBackup = async (file: File) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                setInvoices(data);
                localStorage.setItem('borewell_invoices', JSON.stringify(data));
                alert('Backup imported successfully!');
            } else {
                alert('Invalid backup file');
            }
        } catch (e) {
            alert('Failed to read backup file');
            console.error(e);
        }
    };

    return (
        <InvoiceContext.Provider value={{
            invoices,
            saveInvoice,
            deleteInvoice,
            exportBackup,
            importBackup,
            shareBackup,
            logo,
            setLogo,
            isGoogleLoggedIn,
            loginToGoogle,
            googleUser,
            syncStatus,
            lastSyncTime
        }}>
            {children}
        </InvoiceContext.Provider>
    );
};

export const useInvoices = () => {
    const context = useContext(InvoiceContext);
    if (!context) throw new Error('useInvoices must be used within InvoiceProvider');
    return context;
};
