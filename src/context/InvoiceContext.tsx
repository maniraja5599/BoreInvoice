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
                            // If this was triggered by a login request, we can auto-upload if users expect "Sync" behavior.
                            // But better to separate or have a specific handler.
                            // However, the `handleLoginAndUpload` below overrides this callback dynamically.
                        }
                    },
                });
                setTokenClient(client);
            }
        }
    }, []);


    const uploadToDriveInternal = async (token: string) => {
        const dataStr = JSON.stringify(invoices, null, 2);
        const fileName = `borewell_backup_${new Date().toISOString().split('T')[0]}.json`;
        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: ['root']
        };

        const fileContent = new Blob([dataStr], { type: 'application/json' });

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' }));
        form.append('file', fileContent);

        try {
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
                body: form
            });
            const result = await response.json();
            if (response.ok) {
                alert("Backup uploaded to Google Drive successfully! File ID: " + result.id);
            } else {
                console.error("Upload error", result);
                alert("Upload failed: " + (result.error?.message || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Network error during upload");
        }
    }

    // Combined Login & Upload Handler
    const loginToGoogle = () => {
        if (!CLIENT_ID) {
            alert("Please add VITE_GOOGLE_CLIENT_ID to .env file");
            return;
        }

        // If already logged in and we have a token, just upload
        if (isGoogleLoggedIn && accessToken) {
            uploadToDriveInternal(accessToken);
            return;
        }

        if (!tokenClient) {
            alert("Google service not ready yet. Please wait a moment.");
            return;
        }

        // Override callback to handle upload immediately after login
        tokenClient.callback = (resp: any) => {
            if (resp.error) {
                console.error(resp);
                return;
            }
            setAccessToken(resp.access_token);
            setIsGoogleLoggedIn(true);
            uploadToDriveInternal(resp.access_token);
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
        <InvoiceContext.Provider value={{ invoices, saveInvoice, deleteInvoice, exportBackup, importBackup, shareBackup, logo, setLogo, isGoogleLoggedIn, loginToGoogle, googleUser }}>
            {children}
        </InvoiceContext.Provider>
    );
};

export const useInvoices = () => {
    const context = useContext(InvoiceContext);
    if (!context) throw new Error('useInvoices must be used within InvoiceProvider');
    return context;
};
