import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FunnelIcon,
  CurrencyRupeeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { reminderService, enhancedCustomerService } from '../services/borewellService';
import { Reminder, Customer } from '../types';
import toast from 'react-hot-toast';

const ReminderManagement: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue' | 'today'>('all');
  const [filterType, setFilterType] = useState<'all' | 'PAYMENT' | 'FOLLOW_UP' | 'MAINTENANCE' | 'GENERAL'>('all');

  const [formData, setFormData] = useState({
    customerId: '',
    reminderDate: '',
    note: '',
    type: 'GENERAL' as 'PAYMENT' | 'FOLLOW_UP' | 'MAINTENANCE' | 'GENERAL',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reminders, searchTerm, filterStatus, filterType]);

  const loadData = () => {
    try {
      const allReminders = reminderService.getAll();
      const allCustomers = enhancedCustomerService.getAll();
      setReminders(allReminders);
      setCustomers(allCustomers);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = reminders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(reminder =>
        reminder.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filterStatus) {
        case 'active':
          filtered = filtered.filter(r => !r.isCompleted);
          break;
        case 'completed':
          filtered = filtered.filter(r => r.isCompleted);
          break;
        case 'overdue':
          filtered = filtered.filter(r => {
            const reminderDate = new Date(r.reminderDate);
            reminderDate.setHours(0, 0, 0, 0);
            return reminderDate.getTime() < today.getTime() && !r.isCompleted;
          });
          break;
        case 'today':
          filtered = filtered.filter(r => {
            const reminderDate = new Date(r.reminderDate);
            reminderDate.setHours(0, 0, 0, 0);
            return reminderDate.getTime() === today.getTime() && !r.isCompleted;
          });
          break;
      }
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    setFilteredReminders(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.reminderDate || !formData.note.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const customer = customers.find(c => c.id === formData.customerId);
      if (!customer) {
        toast.error('Customer not found');
        return;
      }

      const reminderData = {
        customerId: formData.customerId,
        customerName: customer.name,
        reminderDate: new Date(formData.reminderDate),
        note: formData.note,
        type: formData.type,
        priority: formData.priority,
        isCompleted: false
      };

      if (editingReminder) {
        const updated = reminderService.update(editingReminder.id, reminderData);
        if (updated) {
          setReminders(reminders.map(r => r.id === editingReminder.id ? updated : r));
          toast.success('Reminder updated successfully');
        }
      } else {
        const newReminder = reminderService.create(reminderData);
        setReminders([newReminder, ...reminders]);
        toast.success('Reminder created successfully');
      }

      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      customerId: reminder.customerId,
      reminderDate: new Date(reminder.reminderDate).toISOString().split('T')[0],
      note: reminder.note,
      type: reminder.type,
      priority: reminder.priority
    });
    setShowModal(true);
  };

  const handleMarkCompleted = (id: string) => {
    try {
      const updated = reminderService.markCompleted(id);
      if (updated) {
        setReminders(reminders.map(r => r.id === id ? updated : r));
        toast.success('Reminder marked as completed');
      }
    } catch (error) {
      toast.error('Failed to mark reminder as completed');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        const success = reminderService.delete(id);
        if (success) {
          setReminders(reminders.filter(r => r.id !== id));
          toast.success('Reminder deleted successfully');
        }
      } catch (error) {
        toast.error('Failed to delete reminder');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReminder(null);
    setFormData({
      customerId: '',
      reminderDate: '',
      note: '',
      type: 'GENERAL',
      priority: 'MEDIUM'
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReminderStatus = (reminder: Reminder) => {
    if (reminder.isCompleted) return 'completed';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDate = new Date(reminder.reminderDate);
    reminderDate.setHours(0, 0, 0, 0);
    
    if (reminderDate.getTime() < today.getTime()) return 'overdue';
    if (reminderDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'today': return 'bg-orange-100 text-orange-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return <CurrencyRupeeIcon className="h-5 w-5" />;
      case 'FOLLOW_UP': return <UserIcon className="h-5 w-5" />;
      case 'MAINTENANCE': return <Cog6ToothIcon className="h-5 w-5" />;
      default: return <BellIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminder Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Set and manage reminders for customer follow-ups, payments, and maintenance
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Reminder
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="PAYMENT">Payment</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          {/* Stats */}
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Total: {filteredReminders.length} reminders
            </div>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <BellIcon className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No reminders found matching your search.' : 'Get started by adding a new reminder.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Reminder
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredReminders.map((reminder) => {
              const status = getReminderStatus(reminder);
              return (
                <li key={reminder.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getPriorityColor(reminder.priority)}`}>
                        {getTypeIcon(reminder.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{reminder.customerName}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status === 'today' ? 'Due Today' : status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{reminder.note}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDate(reminder.reminderDate)}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatTime(reminder.reminderDate)}
                          </div>
                          <div>Type: {reminder.type}</div>
                          {reminder.isCompleted && reminder.completedAt && (
                            <div>Completed: {formatDate(reminder.completedAt)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!reminder.isCompleted && (
                        <button
                          onClick={() => handleMarkCompleted(reminder.id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Mark as completed"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(reminder)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit reminder"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete reminder"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                            Customer *
                          </label>
                          <select
                            id="customerId"
                            required
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a customer</option>
                            {customers.map(customer => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name} - {customer.phoneNumber}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="reminderDate" className="block text-sm font-medium text-gray-700">
                            Reminder Date *
                          </label>
                          <input
                            type="date"
                            id="reminderDate"
                            required
                            value={formData.reminderDate}
                            onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Type *
                          </label>
                          <select
                            id="type"
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="PAYMENT">Payment</option>
                            <option value="FOLLOW_UP">Follow Up</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="GENERAL">General</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priority *
                          </label>
                          <select
                            id="priority"
                            required
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                            Note *
                          </label>
                          <textarea
                            id="note"
                            required
                            rows={3}
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter reminder details..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingReminder ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderManagement;
