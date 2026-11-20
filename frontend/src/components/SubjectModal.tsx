import React, { useEffect, useState } from 'react';
import { createSubject, updateSubject } from '../services/subject';
import { Subject } from '../types/subject';
import { X, BookOpen, AlertCircle } from 'lucide-react';

interface SubjectModalProps {
  token: string;
  classroomId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subject: Subject) => void;
  mode: 'create' | 'edit';
  initialData?: Subject | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  token,
  classroomId,
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name);
      setCode(initialData.code || '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setCode('');
      setDescription('');
    }
    setError(null);
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide a subject name (at least 2 characters).');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const created = await createSubject(token, classroomId, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        });
        onSuccess(created);
      } else if (initialData) {
        const updated = await updateSubject(token, initialData.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        });
        onSuccess(updated);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save subject. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {mode === 'create' ? 'Add New Subject' : 'Edit Subject'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'create' ? 'Create a topic area for your study materials' : 'Update subject metadata'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linear Algebra & Vector Calculus"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Subject Code (Optional)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MATH201"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of the subject scope and topics..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-violet-600/20 transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{mode === 'create' ? 'Create Subject' : 'Save Changes'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

