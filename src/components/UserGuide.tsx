import React from 'react';
import { X, Cloud, Trash2, Save, Smartphone, Search, Edit } from 'lucide-react';

interface UserGuideProps {
    onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                        User Guide 📖
                    </h2>
                    <button onClick={onClose} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8 text-gray-700">

                    {/* Section 1: Creating & Saving */}
                    <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2 mb-3">
                            <div className="bg-blue-50 p-2 rounded-lg"><Save size={18} /></div> Creating Invoices
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 marker:text-blue-300">
                            <li>Tap the big <strong>+ Button</strong> to create a new Invoice or Quotation.</li>
                            <li><strong>Rates are Automatic</strong>: Just enter the Total Depth, and the Casing/Drilling charges are calculated automatically based on saved rates.</li>
                            <li><strong>Duplicate Check</strong>: The app checks for duplicate 'Invoice Numbers' automatically. If you try to save a number that exists, it will warn you! 🛡️</li>
                        </ul>
                    </section>

                    {/* Section 2: Cloud Sync */}
                    <section className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                        <h3 className="font-bold text-lg text-green-700 flex items-center gap-2 mb-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm"><Cloud size={18} /></div> Cloud Sync (Firebase)
                        </h3>
                        <div className="text-sm text-green-800">
                            <p className="mb-2 font-medium">Why connect? So your data is backed up and available on all your devices.</p>
                            <ul className="list-disc pl-5 space-y-1 marker:text-green-500">
                                <li>Tap the <strong>Drive Icon</strong> in Settings to Login.</li>
                                <li>Once connected, any change you make is saved within seconds.</li>
                                <li>If you are offline, it saves locally and syncs when you reconnect! 📶</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Managing Data */}
                    <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <h3 className="font-bold text-lg text-red-500 flex items-center gap-2 mb-3">
                            <div className="bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></div> Safety & Recycle Bin
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 marker:text-red-300">
                            <li><strong>Deleting</strong>: Tapping trash asks for confirmation first. "Are you sure?" 🤔</li>
                            <li><strong>Recycle Bin</strong>: Deleted files aren't gone! They go to <strong>Settings {'>'} Recycle Bin</strong>.</li>
                            <li><strong>Restore</strong>: Made a mistake? Go to Recycle Bin and tap "Restore" to bring it back.</li>
                            <li><strong>Delete Forever</strong>: To clear space, you can permanently delete items in the Recycle Bin.</li>
                        </ul>
                    </section>

                    {/* Section 4: Tips */}
                    <section className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                        <h3 className="font-bold text-lg text-indigo-600 flex items-center gap-2 mb-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm"><Smartphone size={18} /></div> Pro Tips
                        </h3>
                        <div className="space-y-3 text-sm text-indigo-900">
                            <div className="flex gap-3 items-start">
                                <Search className="text-indigo-400 shrink-0 mt-1" size={16} />
                                <p><strong>Search:</strong> Use the search bar for Name, Phone Number, or Invoice #.</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Edit className="text-indigo-400 shrink-0 mt-1" size={16} />
                                <p><strong>Edit:</strong> Tap the Pencil icon to update an invoice. Changes sync everywhere.</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/80 text-center backdrop-blur-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Borewell Invoice Generator v1.3.0</p>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
