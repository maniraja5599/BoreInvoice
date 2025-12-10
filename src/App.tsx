import { useState } from 'react';
import { InvoiceProvider } from './context/InvoiceContext';
import CreateInvoice from './components/CreateInvoice';
import InvoiceList from './components/InvoiceList';
import type { InvoiceData } from './types';

function App() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | undefined>(undefined);

  const handleCreate = () => {
    setEditingInvoice(undefined);
    setView('create');
  };

  const handleEdit = (invoice: InvoiceData) => {
    setEditingInvoice(invoice);
    setView('create');
  };

  const handleBack = () => {
    setView('list');
  };

  return (
    <InvoiceProvider>
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative">
        {view === 'list' && <InvoiceList onEdit={handleEdit} onCreate={handleCreate} />}
        {view === 'create' && <CreateInvoice onBack={handleBack} initialData={editingInvoice} />}
      </div>
    </InvoiceProvider>
  );
}

export default App;
