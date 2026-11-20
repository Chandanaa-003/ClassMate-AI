import React, { useState } from 'react';
import { createDoubt } from '../services/doubt';
import { Doubt } from '../types/doubt';
import { X, HelpCircle, ShieldCheck, AlertCircle } from 'lucide-react';

interface AskDoubtModalProps {
  token: string;
  subjectId: number;
  isOpen: boolean;
  onClose: () => void;
  onDoubtCreated: (doubt: Doubt) => void;
}

export const AskDoubtModal: React.FC<AskDoubtModalProps> = ({
  token,
  subjectId,
  isOpen,
  onClose,
  onDoubtCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true); // Default true per requirements
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 3) {
      setError('Please provide a title (at least 3 characters).');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError('Please describe your doubt in more detail (at least 5 characters).');
      return;
    }

    setLoading(true);
    try {
      const created = await createDoubt(token, subjectId, {
        title: title.trim(),
        description: description.trim(),
        is_anonymous: isAnonymous,
      });
      setTitle('');
      setDescription('');
      setIsAnonymous(true);
      onDoubtCreated(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to post question. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Ask a Doubt</h3>
              <p className="text-xs text-slate-500">Post a question to your classmates and lecturers</p>
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
              Question Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How does backpropagation handle vanishing gradients?"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what concept you find difficult, what you've tried so far, or what specific part is confusing..."
              rows={4}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition resize-none"
              required
            />
          </div>

          {/* Anonymous Option Enabled by Default */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start space-x-3">
            <input
              type="checkbox"
              id="is_anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="is_anonymous" className="text-xs text-slate-700 cursor-pointer select-none">
              <span className="font-bold flex items-center space-x-1.5 text-slate-800">
                <span>Post anonymously</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Recommended
                </span>
              </span>
              <span className="block text-slate-500 mt-0.5">
                Your name, email, and ID will be completely hidden from students and instructors.
              </span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
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
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-amber-600/20 transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAnonymous ? 'Post Anonymously' : 'Post Question'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

