import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, clearNotification, clearAll, setIsBellOpen } = useNotifications();
  const navigate = useNavigate();

  const handleToggle = () => {
    const nextIsOpen = !isOpen; // Calculate next state first
    setIsBellOpen(nextIsOpen);  // Tell the context if we are opening or closing

    setIsOpen(nextIsOpen);      // Update the local state to show/hide dropdown

    if (nextIsOpen) { // If we just OPENED it
      // Mark all notifications as read
      notifications.forEach(notif => {
        if (!notif.isRead) markAsRead(notif.id);
      });
    }
  };

  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative text-gray-400 hover:text-gray-700 dark:hover:text-white">
        <Bell size={24} />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 text-black">
          <div className="p-4 flex justify-between items-center border-b">
            <h4 className="font-bold">Notifications</h4>
            <button onClick={clearAll} className="text-sm text-blue-500 hover:underline">
              Clear All
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500">No new notifications.</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className="w-full text-left p-4 border-b hover:bg-gray-50 flex"
                  onClick={() => {
                    if (notif.link) {
                      navigate(notif.link);
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex-grow">
                    <p className="text-sm">{notif.message}</p>
                    <span className="text-xs text-gray-400">
                      {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate()) : 'Just now'} ago
                    </span>
                  </div>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notif.id);
                  }} className="text-gray-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;