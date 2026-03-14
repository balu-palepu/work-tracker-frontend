import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import notificationService from '../../services/notificationService';
import { useTeam } from '../../context/TeamContext';

// placement: 'below' (default, absolute dropdown below) | 'right' (inline dropdown above, inside sidebar)
const NotificationBell = ({ placement = 'below', sidebarExpanded = false }) => {
  const { currentTeam } = useTeam();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);
  const knownNotificationIds = useRef(new Set());
  const sseRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (currentTeam) {
      fetchNotifications();
      startNotificationStream();
      return () => {
        if (sseRef.current) {
          sseRef.current.close();
          sseRef.current = null;
        }
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };
    }
  }, [currentTeam]);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
      oscillator.stop(context.currentTime + 0.3);
      oscillator.onended = () => context.close();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!currentTeam) return;
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(currentTeam._id, { limit: 20 });
      if (response.success) {
        const incoming = response.data || [];
        knownNotificationIds.current = new Set(incoming.map((n) => n._id));
        setNotifications(incoming);
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!currentTeam) return;
    try {
      await notificationService.markAsRead(currentTeam._id, notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentTeam) return;
    try {
      await notificationService.markAllAsRead(currentTeam._id);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!currentTeam) return;
    try {
      await notificationService.deleteNotification(currentTeam._id, notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const startNotificationStream = () => {
    if (!currentTeam) return;
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const streamUrl = `${apiBase}/teams/${currentTeam._id}/notifications/stream`;
    const eventSource = new EventSource(streamUrl);
    sseRef.current = eventSource;

    eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        if (!notification || knownNotificationIds.current.has(notification._id)) return;
        knownNotificationIds.current.add(notification._id);
        setNotifications((prev) => [notification, ...prev].slice(0, 20));
        if (notification.isRead === false || notification.isRead === undefined) {
          setUnreadCount((prev) => prev + 1);
        }
        playNotificationSound();
      } catch (error) {
        console.error('Error handling notification event:', error);
      }
    });

    eventSource.addEventListener('error', () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (currentTeam) startNotificationStream();
      }, 30000);
    });
  };

  const closeDropdown = () => setShowDropdown(false);
  const toggleDropdown = () => setShowDropdown((v) => !v);

  if (!currentTeam) return null;

  // Sidebar mode: dropdown opens upward, absolutely positioned inside the sidebar
  if (placement === 'right') {
    return (
      <div className="relative">
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-[99998]" onClick={closeDropdown} />
            <div
              className="absolute bottom-full left-0 mb-2 z-[99999] rounded-xl shadow-2xl border border-gray-200 bg-white overflow-hidden flex flex-col"
              style={{ width: '380px', maxHeight: '525px' }}
            >
              <div className="flex-1 overflow-y-auto min-h-0">
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDelete={handleDelete}
                  onClose={closeDropdown}
                  className="flex flex-col"
                />
              </div>
            </div>
          </>
        )}
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
            showDropdown
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          } ${!sidebarExpanded ? 'justify-center' : ''}`}
          aria-label="Notifications"
        >
          <div className="relative flex-shrink-0">
            <Bell
              className={`w-5 h-5 ${
                showDropdown ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {sidebarExpanded && (
            <>
              <span
                className={`text-sm font-medium truncate flex-1 text-left ${
                  showDropdown ? 'text-white' : 'text-gray-700'
                }`}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className={`min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full flex items-center justify-center ${
                    showDropdown ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    );
  }

  // Default: inline dropdown below the bell icon
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={closeDropdown} />
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onClose={closeDropdown}
          />
        </>
      )}
    </div>
  );
};

export default NotificationBell;
