import React, { useState } from 'react';
import { joinClassroom } from '../services/classroom';
import { Classroom } from '../types/classroom';
import { X, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface JoinClassroomModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onClassroomJoined: (classroom: Classroom) => void;
}

export const JoinClassroomModal: React.FC<JoinClassroomModalProps> = ({
  token,
  isOpen,
  onClose,
  onClassroomJoined,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a classroom join code.');
      return;
    }

    setLoading(true);
    try {
      const joined = await joinClassroom(token, { join_code: cleanCode });
      setJoinCode('');
      onClassroomJoined(joined);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to join classroom. Please check your join code.');
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
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Join a Classroom</h3>
              <p className="text-xs text-slate-500">Enter the code provided by your course lecturer</p>
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
              Classroom Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. CM-7K9B"
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-base font-mono font-bold tracking-widest placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-center"
              required
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-400 flex items-center justify-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ask your professor or lecturer for their course code</span>
            </p>
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Join Classroom</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

