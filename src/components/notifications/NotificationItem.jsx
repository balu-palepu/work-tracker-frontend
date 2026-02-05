import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  X,
  AlertCircle,
  UserPlus,
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
      case 'task_updated':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'task_comment':
      case 'mention':
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'sprint_started':
      case 'sprint_completed':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case 'project_added':
        return <Calendar className="h-5 w-5 text-indigo-600" />;
      case 'bandwidth_approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'bandwidth_rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'team_invite':
        return <UserPlus className="h-5 w-5 text-blue-600" />;
      case 'role_changed':
        return <Users className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }

    // Navigate to the related resource if actionUrl exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium text-gray-900 ${
                !notification.isRead ? 'font-semibold' : ''
              }`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {notification.message}
              </p>
            </div>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
              title="Delete notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>

            {notification.actor && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-600">
                  {notification.actor.name}
                </span>
              </>
            )}

            {!notification.isRead && (
              <>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  New
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
