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
    emptyRecycleBin: () => void;
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
    nextInvoiceNumber: number;
    setNextInvoiceNumber: (num: number) => void;
    generateNextInvoiceNumber: () => number;
}

interface AppSettings {
    logo: string | null;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [invoices, setInvoices] = useState<InvoiceData[]>([]);
    const [logo, setLogoState] = useState<string | null>(defaultLogo);
    const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(1);

    // Auth & Sync State
    const [user, setUser] = useState<User | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Initial Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('borewell_invoices');
        const savedSettings = localStorage.getItem('borewell_settings');
        const savedNextNum = localStorage.getItem('borewell_next_invoice_number');
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
        if (savedNextNum) {
            setNextInvoiceNumber(parseInt(savedNextNum, 10));
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
                    setInvoices(data.invoices);
                    localStorage.setItem('borewell_invoices', JSON.stringify(data.invoices));
                }

                // Sync Next Invoice Number
                if (data.nextInvoiceNumber) {
                    setNextInvoiceNumber(data.nextInvoiceNumber);
                    localStorage.setItem('borewell_next_invoice_number', data.nextInvoiceNumber.toString());
                }

                setLastSyncTime(new Date());
                setSyncStatus('success');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } else {
                // New user: seed cloud
                if (invoices.length > 0) {
                    setDoc(userDocRef, {
                        invoices: invoices,
                        nextInvoiceNumber: nextInvoiceNumber,
                        lastUpdated: new Date()
                    }, { merge: true });
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
    const syncToCloud = async (newInvoices: InvoiceData[], newNextNum?: number) => {
        if (!user) return;
        setSyncStatus('syncing');
        try {
            const payload: any = {
                invoices: newInvoices,
                lastUpdated: new Date()
            };
            if (newNextNum !== undefined) payload.nextInvoiceNumber = newNextNum;

            await setDoc(doc(db, 'users', user.uid), payload, { merge: true });

            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (e) {
            console.error("Save Error", e);
            setSyncStatus('error');
        }
    };

    // Actions
    // Helper: Generate next invoice number dynamically
    const generateNextInvoiceNumber = () => {
        const maxFromList = invoices.reduce((max, inv) => {
            const numPart = parseInt(inv.customer.invoiceNumber.replace(/\D/g, ''), 10);
            return !isNaN(numPart) && numPart > max ? numPart : max;
        }, 0);

        // Respect the manual setting if it's higher than the calculated next number
        return Math.max(maxFromList + 1, nextInvoiceNumber);
    };

    const updateNextInvoiceNumber = (num: number) => {
        setNextInvoiceNumber(num);
        localStorage.setItem('borewell_next_invoice_number', num.toString());
        // syncToCloud(invoices, num); // No need to sync counter to cloud anymore, we rely on list
    };

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
        // Synchronous validation using current state
        const isDuplicate = invoices.some(existing =>
            !existing.isDeleted && // Ignore deleted invoices
            existing.customer.invoiceNumber.toLowerCase() === invoice.customer.invoiceNumber.toLowerCase() &&
            existing.id !== invoice.id
        );

        if (isDuplicate) {
            // Smart Resolution: Suggest the next available number
            const nextSafeNum = generateNextInvoiceNumber();
            const newSafeId = `INV-${nextSafeNum}`;

            const useAutoIncrement = window.confirm(
                `Invoice Number "${invoice.customer.invoiceNumber}" already exists!\n\n` +
                `Click OK to auto-save as "${newSafeId}" instead.\n` +
                `Click Cancel for other options.`
            );

            if (useAutoIncrement) {
                // Apply the fix
                invoice = {
                    ...invoice,
                    customer: {
                        ...invoice.customer,
                        invoiceNumber: newSafeId
                    }
                };
            } else {
                // If they cancelled auto-fix, ask if they want to force the duplicate
                const forceDuplicate = window.confirm(
                    `Do you want to force save "${invoice.customer.invoiceNumber}" as a duplicate?\n\n` +
                    `Click OK to allow duplicate.\n` +
                    `Click Cancel to stop and edit manually.`
                );
                if (!forceDuplicate) return false;
            }
        }

        let success = true;
        setInvoices(prev => {


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

    const emptyRecycleBin = () => {
        setInvoices(prev => {
            const newInvoices = prev.filter(i => !i.isDeleted);
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
            emptyRecycleBin,
            exportBackup,
            importBackup,
            shareBackup,
            logo,
            setLogo,
            user,
            loginToGoogle,
            logout,
            syncStatus,
            lastSyncTime,
            nextInvoiceNumber,
            setNextInvoiceNumber: updateNextInvoiceNumber,
            generateNextInvoiceNumber
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
