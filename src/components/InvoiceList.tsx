import React, { useState } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import type { InvoiceData } from '../types';
import { FileText, Trash2, Upload, Download, Settings, X, Image, HardDrive, FileImage, Pencil, Smartphone, ArrowLeft, HelpCircle, Cloud, MessageCircle, RefreshCw, Check, AlertCircle } from 'lucide-react';
import InvoicePreview from './InvoicePreview';
import { generateAndShareImage, generateWhatsAppLink } from '../utils/pdfGenerator';
import UserGuide from './UserGuide';

const InvoiceList: React.FC<{ onEdit: (invoice: InvoiceData) => void, onCreate: () => void }> = ({ onEdit, onCreate }) => {
    const { invoices, deleteInvoice, restoreInvoice, permanentDeleteInvoice, emptyRecycleBin, exportBackup, importBackup, loginToGoogle, logout, logo, setLogo, user, syncStatus, nextInvoiceNumber, setNextInvoiceNumber } = useInvoices();
    const isGoogleLoggedIn = !!user;

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
    const previewRef = React.useRef<HTMLDivElement>(null);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [showUserGuide, setShowUserGuide] = useState(false);

    // View Mode: 'active' or 'deleted'
    const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        if (viewMode === 'active') {
            if (confirm(`Move ${selectedIds.size} invoices to Recycle Bin?`)) {
                selectedIds.forEach(id => deleteInvoice(id));
                setSelectedIds(new Set());
            }
        } else {
            // Permanent Delete
            const confirmText = prompt(`WARNING: This will PERMANENTLY DELETE ${selectedIds.size} invoices.\n\nType DELETE to confirm:`);
            if (confirmText === "DELETE") {
                selectedIds.forEach(id => permanentDeleteInvoice(id));
                setSelectedIds(new Set());
                alert("Invoices deleted forever.");
            }
        }
    };

    const handleBulkRestore = () => {
        if (confirm(`Restore ${selectedIds.size} invoices?`)) {
            selectedIds.forEach(id => restoreInvoice(id));
            setSelectedIds(new Set());
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        // 1. Filter by Deleted Status
        if (viewMode === 'active' && inv.isDeleted) return false;
        if (viewMode === 'deleted' && !inv.isDeleted) return false;

        // 2. Filter by Search
        return (
            inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customer.phone.includes(searchTerm) ||
            inv.customer.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.includes(searchTerm)
        );
    });

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            importBackup(e.target.files[0]);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
                alert("Logo updated!");
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 sticky top-0 bg-slate-50/90 backdrop-blur-sm z-20 py-2">
                <div className='flex items-center gap-3 text-left'>
                    {logo ? <img src={logo} className="w-14 h-14 rounded-2xl object-cover bg-white shadow-lg shadow-gray-200 ring-2 ring-white" /> : null}
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-[#009900] tracking-wider whitespace-nowrap drop-shadow-sm" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                            ANJANEYA BO<span className="text-red-600">R</span>EWELLS
                        </h1>
                        <p className="text-[10px] md:text-xs text-gray-500 font-bold mt-1 ml-1 tracking-wide uppercase">
                            {viewMode === 'deleted' ? '♻️ Recycle Bin' : 'ஆழமான நம்பிக்கை!'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400">
                    <FileText size={18} />
                </div>
                <input
                    type="text"
                    placeholder={viewMode === 'deleted' ? "Search deleted invoices..." : "Search by name, phone..."}
                    className="w-full p-4 pl-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 focus:shadow-md transition-all text-gray-700 font-medium placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    {viewMode === 'deleted' ? <Trash2 size={48} className="mb-2 opacity-50" /> : <FileText size={48} className="mb-2 opacity-50" />}
                    <p>{viewMode === 'deleted' ? 'Recycle Bin Empty' : 'No invoices found'}</p>
                    {viewMode === 'active' && <button onClick={onCreate} className="mt-4 text-primary font-semibold">Create New</button>}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInvoices.map(inv => (
                        <div
                            key={inv.id}
                            className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border relative overflow-hidden ${selectedIds.has(inv.id) ? 'ring-2 ring-primary border-primary bg-blue-50/30' : (viewMode === 'deleted' ? 'bg-red-50/50 border-red-100' : 'bg-white border-white hover:border-blue-50')}`}
                            onClick={() => {
                                if (selectedIds.size > 0) {
                                    toggleSelection(inv.id);
                                } else if (viewMode === 'active') {
                                    setPreviewInvoice(inv);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                toggleSelection(inv.id);
                            }}
                        >
                            {/* Selection Checkbox Overlay */}
                            {selectedIds.size > 0 && (
                                <div className="absolute top-4 right-4 z-10">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.has(inv.id) ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                                        {selectedIds.has(inv.id) && <Check size={14} className="text-white" />}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                        {inv.customer.name}
                                        {isGoogleLoggedIn && <Cloud size={14} className="text-green-500" />}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wide">#{inv.customer.invoiceNumber}</span>
                                        <span className="text-xs text-gray-400 font-medium">{inv.customer.date}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-1">{inv.customer.address || 'No address provided'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`block font-black text-xl ${viewMode === 'deleted' ? 'text-gray-400' : 'text-primary'}`}>₹{inv.totalAmount.toLocaleString()}</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase mb-2">{inv.type}</span>

                                    {/* Action Buttons: Right Side Column */}
                                    {selectedIds.size === 0 && (
                                        <div className="flex flex-col gap-2 w-full items-end">
                                            {viewMode === 'active' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-100"
                                                    >
                                                        <Pencil size={12} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm("Move to Recycle Bin?")) deleteInvoice(inv.id);
                                                        }}
                                                        className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5 border border-red-100"
                                                    >
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm("Restore this invoice?")) restoreInvoice(inv.id);
                                                        }}
                                                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 flex items-center gap-1.5 border border-green-100"
                                                    >
                                                        <Check size={12} /> Restore
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PROMOTED: Create Button (Only in Active Mode & No Selection) */}
            {viewMode === 'active' && selectedIds.size === 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md z-10 pointer-events-none px-4">
                    <button
                        onClick={onCreate}
                        className="absolute bottom-0 right-4 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-sky-700 pointer-events-auto"
                    >
                        +
                    </button>
                </div>
            )}

            {/* Sync / Settings Floating Button (Bottom Left) */}
            {isGoogleLoggedIn && selectedIds.size === 0 && (
                <button
                    onClick={() => setShowSettings(true)}
                    className="fixed bottom-6 left-4 z-10 flex items-center justify-center p-3 rounded-full bg-white shadow-lg border border-gray-100 transition-all hover:scale-105 active:scale-95"
                    title={`Sync Status: ${syncStatus} - Tap for Settings`}
                >
                    {syncStatus === 'syncing' && <RefreshCw size={20} className="text-blue-500 animate-spin" />}
                    {syncStatus === 'success' && <Check size={20} className="text-green-500" />}
                    {syncStatus === 'error' && <AlertCircle size={20} className="text-red-500" />}
                    {syncStatus === 'idle' && <Settings size={20} className="text-gray-400" />}
                </button>
            )}

            {/* BULK ACTION BAR */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-30 flex items-center justify-between border-t border-gray-100 animate-in slide-in-from-bottom-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedIds(new Set())} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
                        <span className="font-bold text-gray-800">{selectedIds.size} Selected</span>
                    </div>
                    <div className="flex gap-2">
                        {viewMode === 'deleted' ? (
                            <>
                                <button
                                    onClick={() => handleBulkRestore()}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-green-700"
                                >
                                    Restore All
                                </button>
                                <button
                                    onClick={() => handleBulkDelete()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-700"
                                >
                                    Delete Forever
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleBulkDelete()}
                                className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={18} /> Delete ({selectedIds.size})
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* RECYCLE BIN CONTROLS (Floating Bottom - Only when no selection) */}
            {viewMode === 'deleted' && selectedIds.size === 0 && (
                <div className="fixed bottom-6 w-full max-w-md px-4 z-20 flex gap-4 justify-center left-1/2 -translate-x-1/2">
                    <button
                        onClick={() => setViewMode('active')}
                        className="flex-1 bg-white text-gray-700 py-3 rounded-xl shadow-lg font-bold border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <button
                        onClick={() => {
                            const confirmText = prompt("WARNING: This will permanently delete ALL invoices in the Recycle Bin.\n\nType DELETE to confirm:");
                            if (confirmText === "DELETE") {
                                emptyRecycleBin();
                                alert("Recycle Bin Emptied.");
                            } else if (confirmText !== null) {
                                alert("Deletion Cancelled: You must type DELETE exactly.");
                            }
                        }}
                        className="flex-1 bg-red-500 text-white py-3 rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 hover:bg-red-600"
                    >
                        <Trash2 size={18} /> Empty Bin
                    </button>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all animate-in fade-in" onClick={() => setShowSettings(false)}>
                    {!showInstallGuide && !showUserGuide ? (
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-sm p-6 shadow-2xl ring-1 ring-black/5 space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight">App Settings</h2>
                                <button onClick={() => setShowSettings(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {/* FIREBASE AUTH BUTTON */}
                                <button
                                    onClick={() => {
                                        if (isGoogleLoggedIn) {
                                            if (confirm("Sign out of sync?")) logout();
                                        } else {
                                            loginToGoogle();
                                        }
                                    }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border shadow-sm active:scale-95 ${isGoogleLoggedIn ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 hover:bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`p-2.5 rounded-full shadow-sm relative ${isGoogleLoggedIn ? 'bg-white' : 'bg-white'}`}>
                                        <HardDrive size={20} className={isGoogleLoggedIn ? 'text-green-600' : 'text-gray-500'} />
                                        {isGoogleLoggedIn && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-bold">{isGoogleLoggedIn ? 'Synced' : 'Connect'}</span>
                                        {isGoogleLoggedIn ? (
                                            <span className="text-[10px] text-green-600 font-bold mt-0.5">Logout</span>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 mt-0.5">Google Drive</span>
                                        )}
                                    </div>
                                </button>

                                {/* HELP GUIDE BUTTON */}
                                <button onClick={() => setShowUserGuide(true)} className="flex flex-col items-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all text-indigo-600 border border-indigo-100 shadow-sm active:scale-95">
                                    <div className="bg-white p-2.5 rounded-full shadow-sm">
                                        <HelpCircle size={20} />
                                    </div>
                                    <span className="text-xs font-bold">Help Guide</span>
                                </button>

                                <button onClick={() => setShowInstallGuide(true)} className="flex flex-col items-center gap-2 p-3 bg-teal-50 hover:bg-teal-100 rounded-2xl transition-all text-teal-600 border border-teal-100 shadow-sm active:scale-95">
                                    <div className="bg-white p-2.5 rounded-full shadow-sm">
                                        <Smartphone size={20} />
                                    </div>
                                    <span className="text-xs font-bold">Install App</span>
                                </button>

                                <button onClick={() => logoInputRef.current?.click()} className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all text-blue-600 border border-blue-100 shadow-sm active:scale-95">
                                    <div className="bg-white p-2.5 rounded-full shadow-sm">
                                        <Image size={20} />
                                    </div>
                                    <span className="text-xs font-bold">Logo</span>
                                </button>
                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />

                                <button onClick={exportBackup} className="flex flex-col items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-all text-purple-600 border border-purple-100 shadow-sm active:scale-95">
                                    <div className="bg-white p-2.5 rounded-full shadow-sm">
                                        <Download size={20} />
                                    </div>
                                    <span className="text-xs font-bold">Backup</span>
                                </button>

                                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-3 bg-amber-50 hover:bg-amber-100 rounded-2xl transition-all text-amber-600 border border-amber-100 shadow-sm active:scale-95">
                                    <div className="bg-white p-2.5 rounded-full shadow-sm">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-xs font-bold">Restore</span>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />

                                {/* CONFIG: Next Invoice Number */}
                                <div className="col-span-2 md:col-span-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 flex items-center justify-between shadow-inner">
                                    <div className="flex flex-col pl-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Next Invoice #</span>
                                        <span className="text-[10px] text-gray-400 font-medium">Auto-increments</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white p-1 pr-2 rounded-xl shadow-sm border border-gray-100">
                                        <span className="font-mono text-gray-400 text-xs pl-2">INV-</span>
                                        <input
                                            type="number"
                                            className="w-16 p-1 text-sm font-bold text-gray-700 bg-transparent focus:outline-none text-right"
                                            value={nextInvoiceNumber}
                                            onChange={(e) => setNextInvoiceNumber(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* RECYCLE BIN BUTTON */}
                                <button
                                    onClick={() => { setViewMode('deleted'); setShowSettings(false); }}
                                    className="col-span-2 md:col-span-3 flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-2xl transition-all text-red-600 border border-red-100 shadow-sm active:scale-95"
                                >
                                    <Trash2 size={18} />
                                    <span className="text-xs font-bold">Recycle Bin</span>
                                </button>

                            </div>

                            <div className="text-center pt-2">
                                <p className="text-[10px] text-gray-400 font-medium">Version 1.0.4 • Anjaneya Borewells</p>
                            </div>
                        </div>
                    ) : showUserGuide ? (
                        <UserGuide onClose={() => setShowUserGuide(false)} />
                    ) : (
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b pb-4">
                                <h2 className="text-lg font-bold text-gray-800">Install App</h2>
                                <button onClick={() => setShowInstallGuide(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                                    <ArrowLeft size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <div className="space-y-4 text-sm text-gray-600">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">📱 For Android (Chrome)</h3>
                                    <ol className="list-decimal ml-4 space-y-2 text-xs font-medium">
                                        <li>Tap the <strong>three dots (⋮)</strong> in the top right.</li>
                                        <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.</li>
                                        <li>Confirm by tapping <strong>Add/Install</strong>.</li>
                                    </ol>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">🍎 For iOS (Safari)</h3>
                                    <ol className="list-decimal ml-4 space-y-2 text-xs font-medium">
                                        <li>Tap the <strong>Share</strong> button (box with arrow) at the bottom.</li>
                                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                                        <li>Tap <strong>Add</strong> in the top right corner.</li>
                                    </ol>
                                </div>
                            </div>
                            <div className="text-center pt-2">
                                <p className="text-[10px] text-blue-600 bg-blue-50 p-3 rounded-xl font-bold border border-blue-100">Note: This makes the app work offline!</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Preview / Share Modal */}
            {previewInvoice && (
                <div className="fixed inset-0 bg-black/90 z-50 flex flex-col pt-4 overflow-y-auto animate-in slide-in-from-bottom-10 duration-200 backdrop-blur-sm">
                    <div className="flex justify-end p-4 gap-4 px-4 sticky top-0 z-10 pointer-events-none">
                        <button
                            onClick={() => setPreviewInvoice(null)}
                            className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition-all pointer-events-auto shadow-lg"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 md:px-0 pb-32">
                        <div className="scale-95 origin-top transition-transform">
                            <InvoicePreview ref={previewRef} data={previewInvoice} />
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl p-5 flex justify-around items-center rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] gap-6 z-20 pb-8 border-t border-white/50">
                        <button
                            onClick={() => {
                                const link = generateWhatsAppLink(previewInvoice);
                                window.open(link, '_blank');
                            }}
                            className="flex-1 flex flex-col items-center gap-2 text-green-700 bg-green-50/50 p-3 rounded-2xl active:scale-95 transition-all hover:bg-green-100"
                        >
                            <div className="bg-white p-3 rounded-full shadow-sm text-green-600 border border-green-100"><MessageCircle size={24} /></div>
                            <span className="text-[10px] font-bold uppercase tracking-wide">WhatsApp</span>
                        </button>

                        <button
                            onClick={() => generateAndShareImage('invoice-preview', `${previewInvoice.type}-${previewInvoice.customer.name}.png`)}
                            className="flex-1 flex flex-col items-center gap-2 text-blue-700 bg-blue-50/50 p-3 rounded-2xl active:scale-95 transition-all hover:bg-blue-100"
                        >
                            <div className="bg-white p-3 rounded-full shadow-sm text-blue-600 border border-blue-100"><FileImage size={24} /></div>
                            <span className="text-[10px] font-bold uppercase tracking-wide">Share Image</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
