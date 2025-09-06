import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  XMarkIcon, 
  BellIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { notificationService, reminderService } from '../services/borewellService';
import { Notification, Reminder } from '../types';
import toast from 'react-hot-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  checkReminders: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

interface ReminderPopupProps {
  reminders: Reminder[];
  onClose: () => void;
  onMarkCompleted: (id: string) => void;
}

const ReminderPopup: React.FC<ReminderPopupProps> = ({ reminders, onClose, onMarkCompleted }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return <div className="text-red-500">💰</div>;
      case 'FOLLOW_UP':
        return <div className="text-blue-500">👥</div>;
      case 'MAINTENANCE':
        return <div className="text-yellow-500">🔧</div>;
      default:
        return <div className="text-gray-500">🔔</div>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <BellIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  🔔 Reminder Alert
                </h3>
                <div className="mt-4 space-y-4">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getReminderTypeIcon(reminder.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {reminder.customerName}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityBadge(reminder.priority)}`}>
                              {reminder.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{reminder.note}</p>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {formatDate(reminder.reminderDate)}
                            </div>
                            <div>Type: {reminder.type}</div>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => onMarkCompleted(reminder.id)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                            >
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Mark Done
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Check for reminders on app load and periodically
  useEffect(() => {
    checkReminders();
    loadNotifications();

    // Check every 5 minutes
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getAll();
    setNotifications(allNotifications);
  };

  const checkReminders = () => {
    const now = new Date();
    
    // Only check if it's been more than 1 hour since last check or it's the first check
    if (lastCheck && (now.getTime() - lastCheck.getTime()) < 60 * 60 * 1000) {
      return;
    }

    const todaysReminders = reminderService.getTodaysReminders();
    const overdueReminders = reminderService.getOverdueReminders();
    const allActiveReminders = [...todaysReminders, ...overdueReminders];

    if (allActiveReminders.length > 0) {
      setActiveReminders(allActiveReminders);
      setShowReminderPopup(true);

      // Create notifications for these reminders
      allActiveReminders.forEach(reminder => {
        const isOverdue = overdueReminders.includes(reminder);
        const daysPast = isOverdue ? 
          Math.floor((now.getTime() - new Date(reminder.reminderDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

        notificationService.create({
          type: isOverdue ? 'warning' : 'reminder',
          title: isOverdue ? `Overdue Reminder (${daysPast} days)` : 'Reminder Due Today',
          message: `${reminder.note} - Customer: ${reminder.customerName}`,
          read: false,
          reminderId: reminder.id,
          customerId: reminder.customerId,
          actionRequired: true
        });
      });

      loadNotifications();
    }

    setLastCheck(now);
  };

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    notificationService.delete(id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleMarkReminderCompleted = (reminderId: string) => {
    try {
      reminderService.markCompleted(reminderId);
      setActiveReminders(activeReminders.filter(r => r.id !== reminderId));
      
      // If no more active reminders, close popup
      if (activeReminders.length === 1) {
        setShowReminderPopup(false);
      }
      
      toast.success('Reminder marked as completed');
    } catch (error) {
      toast.error('Failed to mark reminder as completed');
    }
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkReminders
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Reminder Popup */}
      {showReminderPopup && activeReminders.length > 0 && (
        <ReminderPopup
          reminders={activeReminders}
          onClose={() => setShowReminderPopup(false)}
          onMarkCompleted={handleMarkReminderCompleted}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
