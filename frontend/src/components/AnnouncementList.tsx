import React, { useEffect, useState } from 'react';
import {
  deleteAnnouncement,
  getClassroomAnnouncements,
} from '../services/announcement';
import { Announcement, AnnouncementPriority } from '../types/announcement';
import { Subject } from '../types/subject';
import { AnnouncementModal } from './AnnouncementModal';
import {
  Megaphone,
  AlertTriangle,
  Sparkles,
  Calendar,
  User,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface AnnouncementListProps {
  token: string;
  classroomId: number;
  subjectId?: number;
  isLecturer: boolean;
  subjects?: Subject[];
}

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  token,
  classroomId,
  subjectId,
  isLecturer,
  subjects = [],
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClassroomAnnouncements(token, classroomId, subjectId);
      setAnnouncements(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load announcements.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [classroomId, subjectId, token]);

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this announcement?');
    if (!confirmDelete) return;

    try {
      await deleteAnnouncement(token, id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to delete announcement.');
      }
    }
  };

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (saved: Announcement) => {
    if (editingAnnouncement) {
      setAnnouncements((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
    } else {
      setAnnouncements((prev) => [saved, ...prev]);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (priorityFilter === 'all') return true;
    return a.priority.toLowerCase() === priorityFilter.toLowerCase();
  });

  const renderPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Urgent Notice</span>
          </span>
        );
      case 'Important':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Important</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-semibold">
            <span>Normal</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Megaphone className="w-4 h-4" />
            <span>Classroom Board</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            Announcements & Bulletins
          </h3>
          <p className="text-xs text-slate-500">
            Official announcements, assignment reminders, and schedule updates
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-center">
          {/* Filter tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'urgent', 'important', 'normal'].map((tab) => (
              <button
                key={tab}
                onClick={() => setPriorityFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                  priorityFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {isLecturer && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Announcement</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-slate-200/80 space-y-3">
          <RotateCcw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-semibold">Loading announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
            <Megaphone className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No Announcements Yet</h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {isLecturer
              ? 'Keep your students informed about exams, lab schedules, and syllabus updates by posting your first announcement.'
              : 'There are no active announcements for this section right now. Check back later!'}
          </p>
          {isLecturer && (
            <button
              onClick={handleOpenCreate}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post First Announcement</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-3xl p-6 sm:p-7 border shadow-xs transition hover:shadow-md ${
                ann.priority === 'Urgent'
                  ? 'border-rose-200 ring-1 ring-rose-100'
                  : ann.priority === 'Important'
                  ? 'border-amber-200 ring-1 ring-amber-100'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderPriorityBadge(ann.priority)}
                    {ann.subject_name ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-[10px] font-semibold">
                        <BookOpen className="w-3 h-3 text-violet-500" />
                        <span>Subject: {ann.subject_name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold">
                        <span>Classroom Wide</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {ann.title}
                  </h3>
                </div>

                {isLecturer && ann.is_author && (
                  <div className="flex items-center space-x-1 self-start">
                    <button
                      onClick={() => handleOpenEdit(ann)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                      title="Edit announcement"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Posted by <strong className="text-slate-700 font-medium">{ann.lecturer_name}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(ann.created_at).toLocaleString()}</span>
                  {ann.updated_at !== ann.created_at && (
                    <span className="text-[10px] text-slate-400 italic">(edited)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <AnnouncementModal
          token={token}
          classroomId={classroomId}
          subjectId={subjectId}
          subjects={subjects}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          initialData={editingAnnouncement}
        />
      )}
    </div>
  );
};

