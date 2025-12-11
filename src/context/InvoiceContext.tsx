import React, { createContext, useContext, useState, useEffect } from 'react';
import type { InvoiceData } from '../types';
import defaultLogo from '../assets/logo.jpg';

// Firebase Imports
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface InvoiceContextType {
    invoices: InvoiceData[];
    saveInvoice: (invoice: InvoiceData) => boolean;
    deleteInvoice: (id: string) => void;
    restoreInvoice: (id: string) => void;
    permanentDeleteInvoice: (id: string) => void;
    importBackup: (file: File) => Promise<void>;
    exportBackup: () => void;
    shareBackup: () => Promise<void>;
    logo: string | null;
    setLogo: (logo: string | null) => void;

    // Firebase Features
    user: User | null;
    loginToGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    lastSyncTime: Date | null;
}

interface AppSettings {
    logo: string | null;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [invoices, setInvoices] = useState<InvoiceData[]>([]);
    const [logo, setLogoState] = useState<string | null>(defaultLogo);

    // Auth & Sync State
    const [user, setUser] = useState<User | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Initial Load from LocalStorage
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
    }, []);

    // 1. Auth Listener (Persistent Login)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // 2. Real-time Sync Listener (Firestore)
    useEffect(() => {
        if (!user) return;

        setSyncStatus('syncing');
        const userDocRef = doc(db, 'users', user.uid);

        // Listen to cloud changes
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.invoices && Array.isArray(data.invoices)) {
                    // Update Local State with Cloud Data
                    // Note: This is a simple "Cloud Wins" strategy. 
                    // For a basic sync, this ensures all devices see the same data.
                    setInvoices(data.invoices);
                    // Also update localStorage to keep it fresh for offline start
                    localStorage.setItem('borewell_invoices', JSON.stringify(data.invoices));

                    setLastSyncTime(new Date());
                    setSyncStatus('success');
                    setTimeout(() => setSyncStatus('idle'), 2000);
                }
            } else {
                // New user (or first time using Firebase)
                // If we have local data, upload it to seed the cloud
                if (invoices.length > 0) {
                    setDoc(userDocRef, { invoices: invoices, lastUpdated: new Date() }, { merge: true });
                }
                setSyncStatus('idle');
            }
        }, (error) => {
            console.error("Sync Error:", error);
            setSyncStatus('error');
        });

        return () => unsubscribe();
    }, [user]);

    // Helper: Push to Cloud
    const syncToCloud = async (newInvoices: InvoiceData[]) => {
        if (!user) return;
        setSyncStatus('syncing');
        try {
            await setDoc(doc(db, 'users', user.uid), {
                invoices: newInvoices,
                lastUpdated: new Date()
            }, { merge: true });

            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (e) {
            console.error("Save Error", e);
            setSyncStatus('error');
        }
    };

    // Actions
    const loginToGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e) {
            console.error("Login Failed", e);
            alert("Login Failed: " + (e as any).message);
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const setLogo = (newLogo: string | null) => {
        setLogoState(newLogo);
        const settings: AppSettings = { logo: newLogo };
        localStorage.setItem('borewell_settings', JSON.stringify(settings));
    };

    const saveInvoice = (invoice: InvoiceData) => {
        let success = true;
        setInvoices(prev => {
            // Check for duplicate invoice Number
            const isDuplicate = prev.some(existing =>
                existing.customer.invoiceNumber.toLowerCase() === invoice.customer.invoiceNumber.toLowerCase() &&
                existing.id !== invoice.id
            );

            if (isDuplicate) {
                alert(`Invoice Number "${invoice.customer.invoiceNumber}" already exists!`);
                success = false;
                return prev;
            }

            const existingIndex = prev.findIndex(i => i.id === invoice.id);
            let newInvoices;
            if (existingIndex >= 0) {
                newInvoices = [...prev];
                newInvoices[existingIndex] = invoice;
            } else {
                newInvoices = [invoice, ...prev];
            }

            // 1. Save Local
            localStorage.setItem('borewell_invoices', JSON.stringify(newInvoices));
            // 2. Sync Cloud
            syncToCloud(newInvoices);

            return newInvoices;
        });
        return success;
    };

    const deleteInvoice = (id: string) => {
        setInvoices(prev => {
            const newInvoices = prev.map(inv =>
                inv.id === id ? { ...inv, isDeleted: true } : inv
            );
            localStorage.setItem('borewell_invoices', JSON.stringify(newInvoices));
            syncToCloud(newInvoices);
            return newInvoices;
        });
    }

    const restoreInvoice = (id: string) => {
        setInvoices(prev => {
            const newInvoices = prev.map(inv =>
                inv.id === id ? { ...inv, isDeleted: false } : inv
            );
            localStorage.setItem('borewell_invoices', JSON.stringify(newInvoices));
            syncToCloud(newInvoices);
            return newInvoices;
        });
    };

    const permanentDeleteInvoice = (id: string) => {
        setInvoices(prev => {
            const newInvoices = prev.filter(i => i.id !== id);
            localStorage.setItem('borewell_invoices', JSON.stringify(newInvoices));
            syncToCloud(newInvoices);
            return newInvoices;
        });
    };

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
                syncToCloud(data); // Sync imported data to cloud
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
            restoreInvoice,
            permanentDeleteInvoice,
            exportBackup,
            importBackup,
            shareBackup,
            logo,
            setLogo,
            user,
            loginToGoogle,
            logout,
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
