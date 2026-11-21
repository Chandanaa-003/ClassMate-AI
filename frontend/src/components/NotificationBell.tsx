import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../services/notification';
import { Notification } from '../types/notification';
import {
  Bell,
  CheckCircle2,
  Megaphone,
  Headphones,
  Sparkles,
  HelpCircle,
  Star,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';

interface NotificationBellProps {
  token: string;
  onOpenFullCenter: () => void;
  onNavigateNotification?: (notif: Notification) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  token,
  onOpenFullCenter,
  onNavigateNotification,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isPollingRef = useRef(false);

  const fetchUnread = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const count = await getUnreadCount(token);
      setUnreadCount(count);
    } catch {
      // Graceful error handling for offline or network blips
    } finally {
      isPollingRef.current = false;
    }
  }, [token]);

  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(token, undefined, 6, 0);
      setRecentNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  // Poll unread count every 20 seconds while user is logged in
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(() => {
      fetchUnread();
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchDropdownData();
    }
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await markAsRead(token, notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setRecentNotifications((items) =>
          items.map((it) => (it.id === notif.id ? { ...it, is_read: true } : it))
        );
      } catch {
        // Continue navigation even if marking read fails
      }
    }
    setIsOpen(false);
    if (onNavigateNotification) {
      onNavigateNotification(notif);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead(token);
      setUnreadCount(0);
      setRecentNotifications((items) => items.map((it) => ({ ...it, is_read: true })));
    } catch {
      // Handled gracefully
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-indigo-600" />;
      case 'lecture_approved':
      case 'lecture_uploaded':
        return <Headphones className="w-4 h-4 text-blue-600" />;
      case 'smart_notes_ready':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'doubt_answered':
      case 'doubt_created':
        return <HelpCircle className="w-4 h-4 text-amber-500" />;
      case 'answer_accepted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'feedback_submitted':
        return <Star className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Quick Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400">You're all caught up!</p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start space-x-3 hover:bg-slate-50 cursor-pointer transition ${
                    !notif.is_read ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-xs flex-shrink-0 mt-0.5">
                    {renderIcon(notif.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                      {notif.classroom_name && (
                        <span className="truncate max-w-[120px] font-medium text-slate-500">
                          {notif.classroom_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFullCenter();
              }}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              <span>Open Notification Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

