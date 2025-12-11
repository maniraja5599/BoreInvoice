import React from 'react';
import { X, Cloud, Trash2, Save, Smartphone, Search, Edit } from 'lucide-react';

interface UserGuideProps {
    onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">User Guide 📖</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto space-y-8 text-gray-700">

                    {/* Section 1: Creating & Saving */}
                    <section>
                        <h3 className="font-bold text-lg text-primary flex items-center gap-2 mb-3">
                            <Save size={20} /> Creating Invoices
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                            <li>Tap the big <strong>+ Button</strong> to create a new Invoice or Quotation.</li>
                            <li><strong>Rates are Automatic</strong>: Just enter the Total Depth, and the Casing/Drilling charges are calculated automatically based on saved rates.</li>
                            <li><strong>Duplicate Check</strong>: The app checks for duplicate 'Invoice Numbers' automatically. If you try to save a number that exists, it will warn you! 🛡️</li>
                        </ul>
                    </section>

                    {/* Section 2: Cloud Sync */}
                    <section>
                        <h3 className="font-bold text-lg text-green-600 flex items-center gap-2 mb-3">
                            <Cloud size={20} /> Cloud Sync (Firebase)
                        </h3>
                        <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-sm">
                            <p className="mb-2"><strong>Why connect?</strong> so your data is backed up and available on all your devices (Phone, Laptop, Tablet).</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Tap the <strong>Drive Icon</strong> in Settings to Login.</li>
                                <li>Once connected, any change you make is saved within seconds.</li>
                                <li>If you are offline, it saves locally and syncs when you reconnect! 📶</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3: Managing Data */}
                    <section>
                        <h3 className="font-bold text-lg text-red-500 flex items-center gap-2 mb-3">
                            <Trash2 size={20} /> Safety & Recycle Bin
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                            <li><strong>Deleting</strong>: Tapping trash asks for confirmation first. "Are you sure?" 🤔</li>
                            <li><strong>Recycle Bin</strong>: Deleted files aren't gone! They go to <strong>Settings {'>'} Recycle Bin</strong>.</li>
                            <li><strong>Restore</strong>: Made a mistake? Go to Recycle Bin and tap "Restore" to bring it back.</li>
                            <li><strong>Delete Forever</strong>: To clear space, you can permanently delete items in the Recycle Bin.</li>
                        </ul>
                    </section>

                    {/* Section 4: Tips */}
                    <section>
                        <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2 mb-3">
                            <Smartphone size={20} /> Pro Tips
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-3 items-start">
                                <Search className="text-gray-400 shrink-0 mt-1" size={16} />
                                <p><strong>Search:</strong> Use the search bar for Name, Phone Number, or Invoice #.</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <Edit className="text-gray-400 shrink-0 mt-1" size={16} />
                                <p><strong>Edit:</strong> Tap the Pencil icon to update an invoice. Changes sync everywhere.</p>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">Borewell Invoice Generator v1.3.0</p>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
