import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import notificationService from '../../services/notificationService';
import { useTeam } from '../../context/TeamContext';

const NotificationBell = () => {
  const { currentTeam } = useTeam();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const knownNotificationIds = useRef(new Set());
  const sseRef = useRef(null);

  useEffect(() => {
    if (currentTeam) {
      fetchNotifications();
      startNotificationStream();
      return () => {
        if (sseRef.current) {
          sseRef.current.close();
          sseRef.current = null;
        }
      };
    }
  }, [currentTeam]);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
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
      oscillator.onended = () => {
        context.close();
      };
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!currentTeam) return;

    try {
      setLoading(true);
      const response = await notificationService.getNotifications(currentTeam._id, {
        limit: 20
      });

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
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const streamUrl = `${apiBase}/teams/${currentTeam._id}/notifications/stream`;

    if (sseRef.current) {
      sseRef.current.close();
    }

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
      setTimeout(() => {
        if (currentTeam) startNotificationStream();
      }, 5000);
    });
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  if (!currentTeam) return null;

  return (
    <div className="relative">
      <button
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
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onClose={() => setShowDropdown(false)}
          />
        </>
      )}
    </div>
  );
};

export default NotificationBell;
