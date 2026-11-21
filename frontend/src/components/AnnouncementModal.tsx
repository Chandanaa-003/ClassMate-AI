import React, { useEffect, useState } from 'react';
import { createAnnouncement, updateAnnouncement } from '../services/announcement';
import { Announcement, AnnouncementPriority } from '../types/announcement';
import { Subject } from '../types/subject';
import { X, Megaphone, AlertTriangle, Send } from 'lucide-react';

interface AnnouncementModalProps {
  token: string;
  classroomId: number;
  subjectId?: number;
  subjects?: Subject[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (announcement: Announcement) => void;
  initialData?: Announcement | null;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  token,
  classroomId,
  subjectId,
  subjects = [],
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('Normal');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(subjectId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setPriority(initialData.priority);
      setSelectedSubjectId(initialData.subject_id ?? undefined);
    } else {
      setTitle('');
      setContent('');
      setPriority('Normal');
      setSelectedSubjectId(subjectId);
    }
    setError(null);
  }, [initialData, subjectId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both an announcement title and content.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        const updated = await updateAnnouncement(token, initialData.id, {
          title: title.trim(),
          content: content.trim(),
          priority,
        });
        onSuccess(updated);
      } else {
        const created = await createAnnouncement(token, classroomId, {
          title: title.trim(),
          content: content.trim(),
          priority,
          subject_id: selectedSubjectId ?? null,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to publish announcement.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fade-in space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Edit Announcement' : 'Publish Announcement'}
              </h3>
              <p className="text-xs text-slate-500">
                Broadcast updates and critical notices to classroom members
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

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Midterm Exam Schedule & Topics"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
              >
                <option value="Normal">Normal (Standard)</option>
                <option value="Important">Important (Highlighted)</option>
                <option value="Urgent">Urgent (Action Required)</option>
              </select>
            </div>

            {subjects.length > 0 && !isEditing && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Scope (Optional)
                </label>
                <select
                  value={selectedSubjectId || ''}
                  onChange={(e) =>
                    setSelectedSubjectId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                >
                  <option value="">Classroom Wide (All Subjects)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Content *
            </label>
            <textarea
              required
              rows={5}
              maxLength={10000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide detailed information, dates, instructions, or reading materials..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-y"
            />
            <span className="text-[11px] text-slate-400 float-right mt-1">
              {content.length} / 10000
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publishing...' : isEditing ? 'Update Announcement' : 'Publish Announcement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
