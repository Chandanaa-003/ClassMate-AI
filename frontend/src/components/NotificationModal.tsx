import React, { useEffect, useState } from 'react';
import {
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '../services/notification';
import { Notification } from '../types/notification';
import {
  X,
  Bell,
  CheckCircle2,
  Trash2,
  Megaphone,
  Headphones,
  Sparkles,
  HelpCircle,
  Star,
  CheckCheck,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

interface NotificationModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateNotification?: (notif: Notification) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  token,
  isOpen,
  onClose,
  onNavigateNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const isReadFilter = filter === 'unread' ? false : undefined;
      const data = await getNotifications(token, isReadFilter, 100, 0);
      setNotifications(data.items);
      setTotal(data.total);
      setUnreadCount(data.unread_count);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Failed to load notifications.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, filter, token]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead(token, id);
      setNotifications((items) =>
        items.map((it) => (it.id === id ? { ...it, is_read: true } : it))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (filter === 'unread') {
        setNotifications((items) => items.filter((it) => it.id !== id));
      }
    } catch {
      // Handled gracefully
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(token);
      setUnreadCount(0);
      if (filter === 'unread') {
        setNotifications([]);
      } else {
        setNotifications((items) => items.map((it) => ({ ...it, is_read: true })));
      }
    } catch {
      // Handled gracefully
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(token, id);
      setNotifications((items) => items.filter((it) => it.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      // Handled gracefully
    }
  };

  const handleItemNavigate = (notif: Notification) => {
    if (!notif.is_read) {
      handleMarkRead(notif.id);
    }
    onClose();
    if (onNavigateNotification) {
      onNavigateNotification(notif);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-indigo-600" />;
      case 'lecture_approved':
      case 'lecture_uploaded':
        return <Headphones className="w-5 h-5 text-blue-600" />;
      case 'smart_notes_ready':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'doubt_answered':
      case 'doubt_created':
        return <HelpCircle className="w-5 h-5 text-amber-500" />;
      case 'answer_accepted':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'feedback_submitted':
        return <Star className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatTypeLabel = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'Announcement';
      case 'lecture_approved':
        return 'Lecture Approved';
      case 'lecture_uploaded':
        return 'Lecture Uploaded';
      case 'smart_notes_ready':
        return 'Smart Notes Ready';
      case 'doubt_answered':
        return 'Doubt Answered';
      case 'answer_accepted':
        return 'Answer Accepted';
      case 'feedback_submitted':
        return 'Student Feedback';
      case 'doubt_created':
        return 'New Doubt';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-800">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Course announcements, discussion replies, and lecture updates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Bulk Actions */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Notifications ({total})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            {actionError}
          </div>
        )}

        {/* Notification Feed List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RotateCcw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'Great job! You have cleared all your unread alerts.'
                  : 'Announcements, lecture approvals, and doubt updates will show up here.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition flex items-start space-x-4 ${
                  notif.is_read
                    ? 'bg-white border-slate-200/80 hover:border-slate-300'
                    : 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                }`}
              >
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex-shrink-0 mt-0.5">
                  {renderIcon(notif.notification_type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {formatTypeLabel(notif.notification_type)}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                    {notif.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {notif.message}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
                      {notif.classroom_name && (
                        <span>Classroom: <strong className="text-slate-600 font-medium">{notif.classroom_name}</strong></span>
                      )}
                      {notif.subject_name && (
                        <span>Subject: <strong className="text-slate-600 font-medium">{notif.subject_name}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {(notif.classroom_id || notif.subject_id || notif.resource_id) && (
                        <button
                          onClick={() => handleItemNavigate(notif)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Mark read"
                        >
                          Mark read
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{total} total alerts recorded</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
