import React, { useState, useRef } from 'react';
import type { CustomerDetails, BorewellDetails, InvoiceItem, InvoiceData, SlabRate, SlabRateProfile } from '../types';
import { TELESCOPIC_RATES } from '../types';
import { useInvoices } from '../context/InvoiceContext';
import InvoicePreview from './InvoicePreview';
import { generateAndShareImage } from '../utils/pdfGenerator';
import { Plus, Trash2, Save, Share2, FileImage, X, ArrowLeft } from 'lucide-react';
import { calculateDrillingCost } from '../utils/calculator';

const CreateInvoice: React.FC<{ onBack: () => void, initialData?: InvoiceData }> = ({ onBack, initialData }) => {
    const { saveInvoice } = useInvoices();
    const previewRef = useRef<HTMLDivElement>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Form State
    const [customer, setCustomer] = useState<CustomerDetails>(initialData?.customer || {
        name: '',
        phone: '',
        address: '',
        date: new Date().toISOString().split('T')[0],
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    });

    const [borewell, setBorewell] = useState<BorewellDetails>({
        depth: 0,
        casingDepth7: 0,
        casingRate7: 400,
        casingDepth10: 0,
        casingRate10: 700,
        transportCharges: 0,
        bata: 2000,
        oldBoreDepth: 0,
        flushingRate: 0,
        extraTime: initialData?.borewell?.extraTime || 0,
        discountAmount: initialData?.borewell?.discountAmount || 0,
        ...(initialData?.borewell || {}) // Merge existing data
    });

    // Handle migration from old 'casingDepth' if editing old invoice
    // @ts-ignore
    if (initialData?.borewell?.casingDepth && !borewell.casingDepth7) {
        // logic to migrate if needed, but the spread above might miss it if keys differ. 
        // Actually, let's just use the state directly. simpler.
    }

    // Ensure numeric values
    const safeCasing7 = Number(borewell.casingDepth7) || 0;
    const safeRate7 = Number(borewell.casingRate7) || 0;
    const safeCasing10 = Number(borewell.casingDepth10) || 0;
    const safeRate10 = Number(borewell.casingRate10) || 0;

    // Ensure numeric values for calculations in case of bad data
    const safeBata = Number(borewell.bata) || 0;
    const safeExtraTime = Number(borewell.extraTime) || 0;
    const safeTransport = Number(borewell.transportCharges) || 0;
    const safeDiscount = Number(borewell.discountAmount) || 0;

    const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || []);
    const [newItem, setNewItem] = useState({ description: '', quantity: 1, rate: 0 });
    const [docType, setDocType] = useState<'Invoice' | 'Quotation'>(initialData?.type || 'Invoice'); // Default to Invoice
    const [boreType, setBoreType] = useState<'New Bore' | 'Repair Bore'>(initialData?.boreType || 'New Bore');
    const [savedItems, setSavedItems] = useState<{ description: string, rate: number }[]>([]);

    // Slab Rates State
    const [slabRates, setSlabRates] = useState<SlabRate[]>([]);
    const [savedProfiles, setSavedProfiles] = useState<SlabRateProfile[]>([]);
    const [showRateModal, setShowRateModal] = useState(false);
    const [selectedProfileName, setSelectedProfileName] = useState<string>('');

    React.useEffect(() => {
        const stored = localStorage.getItem('invoice_saved_items');
        if (stored) {
            setSavedItems(JSON.parse(stored));
        }

        // Load Slab Rates
        const storedRates = localStorage.getItem('invoice_slab_rates');
        if (storedRates) {
            setSlabRates(JSON.parse(storedRates));
        } else {
            setSlabRates(TELESCOPIC_RATES);
        }

        // Load Slab Profiles
        const storedProfiles = localStorage.getItem('invoice_slab_profiles');
        if (storedProfiles) {
            setSavedProfiles(JSON.parse(storedProfiles));
        }
    }, []);

    const handleSaveProfile = () => {
        const name = prompt("Enter a name for this Rate Profile:", selectedProfileName || "New Profile");
        if (!name) return;

        const newProfile: SlabRateProfile = { name, rates: [...slabRates] };

        // Check if profile exists
        const existingIndex = savedProfiles.findIndex(p => p.name === name);
        let updatedProfiles;

        if (existingIndex >= 0) {
            if (!confirm(`Profile "${name}" already exists. Overwrite?`)) return;
            updatedProfiles = [...savedProfiles];
            updatedProfiles[existingIndex] = newProfile;
        } else {
            updatedProfiles = [...savedProfiles, newProfile];
        }

        setSavedProfiles(updatedProfiles);
        setSelectedProfileName(name);
        localStorage.setItem('invoice_slab_profiles', JSON.stringify(updatedProfiles));
        alert(`Profile "${name}" saved!`);
    };

    const handleLoadProfile = (name: string) => {
        const profile = savedProfiles.find(p => p.name === name);
        if (profile) {
            setSlabRates(profile.rates);
            setSelectedProfileName(profile.name);
        }
    };

    const handleDeleteProfile = () => {
        if (!selectedProfileName) return;
        if (!confirm(`Delete profile "${selectedProfileName}"?`)) return;

        const updatedProfiles = savedProfiles.filter(p => p.name !== selectedProfileName);
        setSavedProfiles(updatedProfiles);
        setSelectedProfileName('');
        localStorage.setItem('invoice_slab_profiles', JSON.stringify(updatedProfiles));
    };

    const handleAddItem = () => {
        if (!newItem.description) return;

        // Save to local storage if unique
        const isDuplicate = savedItems.some(i => i.description.toLowerCase() === newItem.description.toLowerCase());
        if (!isDuplicate) {
            const newSaved = [...savedItems, { description: newItem.description, rate: newItem.rate }];
            setSavedItems(newSaved);
            localStorage.setItem('invoice_saved_items', JSON.stringify(newSaved));
        }

        setItems([...items, { ...newItem, id: Date.now().toString(), amount: newItem.quantity * newItem.rate }]);
        setNewItem({ description: '', quantity: 1, rate: 0 });
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    // Live Calculation for "Total" display
    const { totalCost: drillingCost } = calculateDrillingCost(borewell.depth, borewell.oldBoreDepth, borewell.flushingRate, slabRates);
    const casing7Cost = safeCasing7 * safeRate7;
    const casing10Cost = safeCasing10 * safeRate10;
    const itemsTotal = items.reduce((sum, i) => sum + i.amount, 0);
    const grandTotal = drillingCost + casing7Cost + casing10Cost + safeTransport + safeBata + safeExtraTime + itemsTotal - safeDiscount;

    const handleSave = () => {
        const invoice: InvoiceData = {
            id: initialData?.id || Date.now().toString(),
            customer,
            borewell,
            items,
            totalAmount: grandTotal,
            createdAt: initialData?.createdAt || Date.now(),
            type: docType,
            boreType,
        };
        saveInvoice(invoice);
        alert(`${docType} Saved!`);
    };

    const invoiceData: InvoiceData = {
        id: 'preview',
        customer,
        borewell,
        items,
        totalAmount: grandTotal,
        createdAt: Date.now(),
        type: docType,
        boreType,
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">{initialData ? 'Edit Invoice' : 'New Invoice'}</h1>
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-6">

                {/* Customer Section */}
                <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="font-semibold text-lg text-primary">Customer Details</h2>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => {
                                    setDocType('Invoice');
                                    if (customer.invoiceNumber.startsWith('QTN-')) {
                                        setCustomer({ ...customer, invoiceNumber: customer.invoiceNumber.replace('QTN-', 'INV-') });
                                    }
                                }}
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${docType === 'Invoice' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                            >
                                Invoice
                            </button>
                            <button
                                onClick={() => {
                                    setDocType('Quotation');
                                    if (customer.invoiceNumber.startsWith('INV-')) {
                                        setCustomer({ ...customer, invoiceNumber: customer.invoiceNumber.replace('INV-', 'QTN-') });
                                    }
                                }}
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${docType === 'Quotation' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                            >
                                Quotation
                            </button>
                        </div>
                    </div>
                    {/* Bore Type Toggle */}
                    <div className="flex justify-end pt-2">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setBoreType('New Bore')}
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${boreType === 'New Bore' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                            >
                                New Bore
                            </button>
                            <button
                                onClick={() => setBoreType('Repair Bore')}
                                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${boreType === 'Repair Bore' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                            >
                                Repair Bore
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text" placeholder="Customer Name" className="w-full p-2 border rounded-lg"
                            value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })}
                            onFocus={(e) => e.target.select()}
                        />
                        <input
                            type="tel" placeholder="Phone Number" className="w-full p-2 border rounded-lg"
                            value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                            onFocus={(e) => e.target.select()}
                        />
                        <input
                            type="date" className="w-full p-2 border rounded-lg"
                            value={customer.date} onChange={e => setCustomer({ ...customer, date: e.target.value })}
                            onFocus={(e) => e.target.select()}
                        />
                        <input
                            type="text" placeholder={`${docType} Number`} className="w-full p-2 border rounded-lg"
                            value={customer.invoiceNumber} onChange={e => setCustomer({ ...customer, invoiceNumber: e.target.value })}
                            onFocus={(e) => e.target.select()}
                        />
                        <textarea
                            placeholder="Address" className="w-full p-2 border rounded-lg md:col-span-2" rows={2}
                            value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                </section>

                {/* Borewell Details */}
                <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="font-semibold text-lg text-primary">Drilling Details</h2>
                        <button
                            onClick={() => setShowRateModal(true)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-medium transition-colors"
                        >
                            Manage Rates
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500">Total Depth (ft)</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.depth || ''} onChange={e => setBorewell({ ...borewell, depth: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="text-xs text-gray-500 font-bold text-green-600">Drilling Cost: ₹{drillingCost.toLocaleString()}</label>
                        </div>

                        {/* REPAIR BORE FIELDS */}
                        {boreType === 'Repair Bore' && (
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold text-orange-600">Old Bore Depth (ft)</label>
                                    <input
                                        type="number" className="w-full p-2 border-2 border-orange-100 rounded-lg bg-orange-50 focus:border-orange-300"
                                        value={borewell.oldBoreDepth || ''} onChange={e => setBorewell({ ...borewell, oldBoreDepth: Number(e.target.value) })}
                                        onFocus={(e) => e.target.select()}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold text-orange-600">Flushing Rate / ft</label>
                                    <input
                                        type="number" className="w-full p-2 border-2 border-orange-100 rounded-lg bg-orange-50 focus:border-orange-300"
                                        value={borewell.flushingRate || ''} onChange={e => setBorewell({ ...borewell, flushingRate: Number(e.target.value) })}
                                        onFocus={(e) => e.target.select()}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-xs text-gray-500">7" Casing Depth (ft)</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.casingDepth7 || ''} onChange={e => setBorewell({ ...borewell, casingDepth7: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">7" Rate</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.casingRate7 || ''} onChange={e => setBorewell({ ...borewell, casingRate7: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">10" Casing Depth (ft)</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.casingDepth10 || ''} onChange={e => setBorewell({ ...borewell, casingDepth10: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">10" Rate</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.casingRate10 || ''} onChange={e => setBorewell({ ...borewell, casingRate10: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                    </div>
                </section>

                {/* Other Charges */}
                <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <h2 className="font-semibold text-lg text-primary border-b pb-2">Other Charges</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-gray-500">Bata</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.bata || ''} onChange={e => setBorewell({ ...borewell, bata: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Transport</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.transportCharges || ''} onChange={e => setBorewell({ ...borewell, transportCharges: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Extra Time</label>
                            <input
                                type="number" className="w-full p-2 border rounded-lg"
                                value={borewell.extraTime || ''} onChange={e => setBorewell({ ...borewell, extraTime: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 text-red-600 font-semibold">Discount</label>
                            <input
                                type="number" className="w-full p-2 border-2 border-red-50 rounded-lg text-red-600 focus:border-red-300"
                                value={borewell.discountAmount || ''} onChange={e => setBorewell({ ...borewell, discountAmount: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                    </div>
                </section>

                {/* Extra Items */}
                <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                    <h2 className="font-semibold text-lg text-primary border-b pb-2">Extra Items (Cap, Motor, etc.)</h2>

                    {/* Responsive Input Group */}
                    <div className="flex flex-col md:flex-row gap-2 mb-2">
                        <input
                            type="text" placeholder="Item Name" className="w-full md:flex-1 p-2 border rounded-lg"
                            value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            onFocus={(e) => e.target.select()}
                        />
                        <div className="flex gap-2">
                            <input
                                type="number" placeholder="Qty" className="w-16 md:w-20 p-2 border rounded-lg shrink-0"
                                value={newItem.quantity || ''} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                            <input
                                type="number" placeholder="Rate" className="flex-1 min-w-0 md:w-32 p-2 border rounded-lg"
                                value={newItem.rate || ''} onChange={e => setNewItem({ ...newItem, rate: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                            <button onClick={handleAddItem} className="bg-secondary text-white p-2 rounded-lg w-12 shrink-0 flex justify-center items-center"><Plus /></button>
                        </div>
                    </div>

                    {/* Quick Add Saved Items */}
                    {savedItems.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Recent Items (Click to fill):</p>
                            <div className="flex flex-wrap gap-2">
                                {savedItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setNewItem({ ...newItem, description: item.description, rate: item.rate })}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full border border-gray-200 transition-colors"
                                    >
                                        {item.description} (₹{item.rate})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span className="text-sm">{item.description} ({item.quantity} x {item.rate})</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold">₹{item.amount}</span>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Total Footer */}
                <section className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center sticky bottom-0 border-t-2 border-primary">
                    <div>
                        <p className="text-sm text-gray-500">Estimated Total</p>
                        <p className="text-2xl font-bold text-gray-800">₹{grandTotal.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="bg-gray-200 p-3 rounded-full hover:bg-gray-300"><Save className="text-gray-700" /></button>
                        <button onClick={() => setShowPreview(true)} className="bg-primary text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-sky-700">
                            Preview & Share
                        </button>
                    </div>
                </section>

            </div >

            {/* Preview Modal */}
            {
                showPreview && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col pt-10 overflow-y-auto">
                        <div className="flex justify-end p-4 gap-4 px-4 sticky top-0">
                            <button onClick={() => setShowPreview(false)} className="bg-white p-2 rounded-full"><X /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 md:px-0">
                            <InvoicePreview ref={previewRef} data={invoiceData} />
                        </div>

                        <div className="bg-white p-4 flex justify-around items-center sticky bottom-0 pb-8 rounded-t-xl">
                            <button
                                onClick={() => generateAndShareImage('invoice-preview', `${docType}-${customer.name}.png`)}
                                className="flex flex-col items-center gap-1 text-green-600"
                            >
                                <div className="bg-green-100 p-3 rounded-full"><FileImage /></div>
                                <span className="text-xs font-semibold">Share Image</span>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Manage Rates Modal */}
            {showRateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-gray-800">Manage Drilling Rates</h3>
                            <button onClick={() => setShowRateModal(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} /></button>
                        </div>

                        {/* Profile Manager Bar */}
                        <div className="px-4 pt-4 flex gap-2 items-center">
                            <select
                                className="border rounded p-2 text-xs flex-1"
                                value={selectedProfileName}
                                onChange={(e) => handleLoadProfile(e.target.value)}
                            >
                                <option value="">-- Select Profile --</option>
                                {savedProfiles.map((p, i) => (
                                    <option key={i} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                            <button onClick={handleSaveProfile} className="bg-secondary text-white px-3 py-2 rounded text-xs whitespace-nowrap">Save Profile</button>
                            {selectedProfileName && (
                                <button onClick={handleDeleteProfile} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                            )}
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                            <div className="space-y-2">
                                <div className="grid grid-cols-4 gap-2 text-xs font-bold text-gray-500 uppercase">
                                    <div className="text-center">Min (ft)</div>
                                    <div className="text-center">Max (ft)</div>
                                    <div className="text-center">Rate (₹)</div>
                                    <div className="text-center">Action</div>
                                </div>
                                {slabRates.map((slab, index) => (
                                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                                        <input
                                            type="number" className="p-2 border rounded text-center text-sm"
                                            value={slab.minDepth || ''}
                                            onChange={(e) => {
                                                const newRates = [...slabRates];
                                                newRates[index].minDepth = Number(e.target.value);
                                                setSlabRates(newRates);
                                            }}
                                        />
                                        <input
                                            type="number" className="p-2 border rounded text-center text-sm"
                                            value={slab.maxDepth || ''}
                                            onChange={(e) => {
                                                const newRates = [...slabRates];
                                                newRates[index].maxDepth = Number(e.target.value);
                                                setSlabRates(newRates);
                                            }}
                                        />
                                        <input
                                            type="number" className="p-2 border rounded text-center text-sm"
                                            value={slab.rate || ''}
                                            onChange={(e) => {
                                                const newRates = [...slabRates];
                                                newRates[index].rate = Number(e.target.value);
                                                setSlabRates(newRates);
                                            }}
                                        />
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => {
                                                    const newRates = slabRates.filter((_, i) => i !== index);
                                                    setSlabRates(newRates);
                                                }}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setSlabRates([...slabRates, { minDepth: 0, maxDepth: 0, rate: 0 }])}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Add New Slab
                            </button>
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between">
                            <button
                                onClick={() => {
                                    if (confirm('Reset to default rates?')) setSlabRates(TELESCOPIC_RATES);
                                }}
                                className="text-xs text-red-500 hover:underline"
                            >
                                Reset to Default
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.setItem('invoice_slab_rates', JSON.stringify(slabRates));
                                    setShowRateModal(false);
                                }}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-sky-700"
                            >
                                Save Rates
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CreateInvoice;
