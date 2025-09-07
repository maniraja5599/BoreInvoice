import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import InvoiceManagement from './components/InvoiceManagement';
import SlabRateConfiguration from './components/SlabRateConfiguration';
import PaymentManagement from './components/PaymentManagement';
import Reports from './components/Reports';
import Settings from './components/Settings';
import ReminderManagement from './components/ReminderManagement';
import QuotationManagement from './components/QuotationManagement';
import GoogleAuthCallback from './components/GoogleAuthCallback';
import NotificationProvider from './components/NotificationProvider';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <NotificationProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<CustomerManagement />} />
              <Route path="/invoices" element={<InvoiceManagement />} />
              <Route path="/reminders" element={<ReminderManagement />} />
              <Route path="/slab-rates" element={<SlabRateConfiguration />} />
              <Route path="/quotations" element={<QuotationManagement />} />
              <Route path="/payments" element={<PaymentManagement />} />
              <Route path="/google-auth-callback" element={<GoogleAuthCallback />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </NotificationProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
