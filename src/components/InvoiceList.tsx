import React, { useState } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import type { InvoiceData } from '../types';
import { FileText, Trash2, Upload, Download, Settings, X, Image, HardDrive, FileImage, Pencil, Smartphone, ArrowLeft, HelpCircle, Cloud, MessageCircle } from 'lucide-react';
import InvoicePreview from './InvoicePreview';
import { generateAndShareImage, generateWhatsAppLink } from '../utils/pdfGenerator';
import UserGuide from './UserGuide';

const InvoiceList: React.FC<{ onEdit: (invoice: InvoiceData) => void, onCreate: () => void }> = ({ onEdit, onCreate }) => {
    const { invoices, deleteInvoice, restoreInvoice, permanentDeleteInvoice, exportBackup, importBackup, loginToGoogle, logout, logo, setLogo, user, syncStatus, nextInvoiceNumber, setNextInvoiceNumber } = useInvoices();
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
            <div className="flex justify-between items-start mb-6">
                <div className='flex items-center gap-3 text-left'>
                    {logo ? <img src={logo} className="w-14 h-14 rounded-xl object-contain bg-white shadow-md shadow-gray-200" /> : null}
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-[#009900] tracking-wider whitespace-nowrap" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                            ANJANEYA BO<span className="text-red-600">R</span>EWELLS
                        </h1>
                        <p className="text-[10px] md:text-xs text-gray-600 font-bold mt-0.5 ml-1">
                            {viewMode === 'deleted' ? '♻️ Recycle Bin' : 'ஆழமான நம்பிக்கை!..'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* View Mode Toggle (Only visible if in Recycle Bin) */}
                    {viewMode === 'deleted' && (
                        <button onClick={() => setViewMode('active')} className="p-2 bg-white rounded-full shadow text-primary font-bold text-xs px-3 self-center">
                            Back
                        </button>
                    )}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 bg-white rounded-full shadow text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <Settings size={24} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder={viewMode === 'deleted' ? "Search deleted invoices..." : "Search by name, phone, or invoice #..."}
                    className="w-full p-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
                <div className="space-y-3">
                    {filteredInvoices.map(inv => (
                        <div key={inv.id} className={`p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer transition-colors ${viewMode === 'deleted' ? 'bg-red-50 border border-red-100' : 'bg-white hover:bg-gray-50'}`} onClick={() => viewMode === 'active' && setPreviewInvoice(inv)}>
                            <div>
                                <h3 className="font-bold text-gray-800">{inv.customer.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    {inv.customer.date} • #{inv.customer.invoiceNumber}
                                    {isGoogleLoggedIn && <Cloud size={12} className="text-green-500 ml-1" />}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold mr-2 ${viewMode === 'deleted' ? 'text-gray-400' : 'text-primary'}`}>₹{inv.totalAmount.toLocaleString()}</span>

                                {viewMode === 'active' ? (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("Move to Recycle Bin?")) deleteInvoice(inv.id);
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("Restore this invoice?")) restoreInvoice(inv.id);
                                            }}
                                            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("PERMANENTLY DELETE? This cannot be undone.")) permanentDeleteInvoice(inv.id);
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                                        >
                                            <X size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PROMOTED: Create Button (Only in Active Mode) */}
            {viewMode === 'active' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md z-10 pointer-events-none px-4">
                    <button
                        onClick={onCreate}
                        className="absolute bottom-0 right-4 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-sky-700 pointer-events-auto"
                    >
                        +
                    </button>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                    {!showInstallGuide && !showUserGuide ? (
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b pb-4">
                                <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                                <button onClick={() => setShowSettings(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* FIREBASE AUTH BUTTON */}
                                <button
                                    onClick={() => {
                                        if (isGoogleLoggedIn) {
                                            if (confirm("Sign out of sync?")) logout();
                                        } else {
                                            loginToGoogle();
                                        }
                                    }}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors border ${isGoogleLoggedIn ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-100'}`}
                                >
                                    <div className="bg-white p-2 rounded-full shadow-sm relative">
                                        <HardDrive size={24} className={isGoogleLoggedIn ? 'text-green-600' : 'text-orange-500'} />
                                        {isGoogleLoggedIn && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-semibold">{isGoogleLoggedIn ? 'Synced' : 'Connect'}</span>
                                        {isGoogleLoggedIn ? (
                                            <span className="text-[10px] text-green-600 font-bold mt-1">
                                                {syncStatus === 'syncing' ? 'Syncing...' : 'Tap to Logout'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-orange-500 mt-1">Tap to Login</span>
                                        )}
                                    </div>
                                </button>

                                {/* HELP GUIDE BUTTON */}
                                <button onClick={() => setShowUserGuide(true)} className="flex flex-col items-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-indigo-600 border border-indigo-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <HelpCircle size={24} />
                                    </div>
                                    <span className="text-xs font-semibold">Help Guide</span>
                                </button>

                                <button onClick={() => setShowInstallGuide(true)} className="flex flex-col items-center gap-2 p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors text-teal-600 border border-teal-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Smartphone size={24} />
                                    </div>
                                    <span className="text-xs font-semibold">Install App</span>
                                </button>

                                <button onClick={() => logoInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-primary border border-blue-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Image size={24} />
                                    </div>
                                    <span className="text-xs font-semibold">Logo</span>
                                </button>
                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />

                                <button onClick={exportBackup} className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-purple-600 border border-purple-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Download size={24} />
                                    </div>
                                    <span className="text-xs font-semibold">Backup</span>
                                </button>

                                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-green-600 border border-green-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Upload size={24} />
                                    </div>
                                    <span className="text-xs font-semibold">Restore</span>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />

                                {/* CONFIG: Next Invoice Number */}
                                <div className="col-span-2 md:col-span-3 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Next Invoice #</span>
                                        <span className="text-xs text-gray-400">Auto-increments</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-gray-500">INV-</span>
                                        <input
                                            type="number"
                                            className="w-20 p-1 border rounded text-center font-bold text-gray-700"
                                            value={nextInvoiceNumber}
                                            onChange={(e) => setNextInvoiceNumber(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* RECYCLE BIN BUTTON */}
                                <button
                                    onClick={() => { setViewMode('deleted'); setShowSettings(false); }}
                                    className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-red-600 border border-red-100"
                                >
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Trash2 size={24} />
                                    </div>
                                    <span className="text-xs font-semibold">Recycle Bin</span>
                                </button>

                            </div>

                            <div className="text-center pt-2">
                                <p className="text-[10px] text-gray-400">Version 1.0.3 • Anjaneya Borewells</p>
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
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">📱 For Android (Chrome)</h3>
                                    <ol className="list-decimal ml-4 space-y-1 text-xs">
                                        <li>Tap the <strong>three dots (⋮)</strong> in the top right.</li>
                                        <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.</li>
                                        <li>Confirm by tapping <strong>Add/Install</strong>.</li>
                                    </ol>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">🍎 For iOS (Safari)</h3>
                                    <ol className="list-decimal ml-4 space-y-1 text-xs">
                                        <li>Tap the <strong>Share</strong> button (box with arrow) at the bottom.</li>
                                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                                        <li>Tap <strong>Add</strong> in the top right corner.</li>
                                    </ol>
                                </div>
                            </div>
                            <div className="text-center pt-2">
                                <p className="text-[10px] text-primary bg-blue-50 p-2 rounded">Note: This makes the app work offline and look like a native app!</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Preview / Share Modal */}
            {previewInvoice && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col pt-10 overflow-y-auto">
                    <div className="flex justify-end p-4 gap-4 px-4 sticky top-0">
                        <button onClick={() => setPreviewInvoice(null)} className="bg-white p-2 rounded-full"><X /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 md:px-0">
                        <InvoicePreview ref={previewRef} data={previewInvoice} />
                    </div>

                    <div className="bg-white p-4 flex justify-around items-center sticky bottom-0 pb-8 rounded-t-xl gap-4">
                        <button
                            onClick={() => {
                                const link = generateWhatsAppLink(previewInvoice);
                                window.open(link, '_blank');
                            }}
                            className="flex flex-col items-center gap-1 text-green-600"
                        >
                            <div className="bg-green-50 p-3 rounded-full border border-green-200"><MessageCircle size={24} /></div>
                            <span className="text-[10px] font-semibold">WhatsApp Text</span>
                        </button>

                        <button
                            onClick={() => generateAndShareImage('invoice-preview', `${previewInvoice.type}-${previewInvoice.customer.name}.png`)}
                            className="flex flex-col items-center gap-1 text-blue-600"
                        >
                            <div className="bg-blue-50 p-3 rounded-full border border-blue-200"><FileImage size={24} /></div>
                            <span className="text-[10px] font-semibold">Share Image</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
