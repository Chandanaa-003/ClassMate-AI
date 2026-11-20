import React, { useEffect, useState } from 'react';
import {
  acceptAnswer,
  createAnswer,
  deleteDoubt,
  getDoubtDetail,
  voteAnswer,
} from '../services/doubt';
import { Answer, Doubt } from '../types/doubt';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  ThumbsUp,
  Trash2,
  User,
  Check,
  AlertCircle,
  Send,
  Sparkles,
} from 'lucide-react';

interface DoubtThreadProps {
  token: string;
  doubtId: number;
  onBack: () => void;
  onDoubtDeleted?: () => void;
}

export const DoubtThread: React.FC<DoubtThreadProps> = ({
  token,
  doubtId,
  onBack,
  onDoubtDeleted,
}) => {
  const [doubt, setDoubt] = useState<Doubt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Answer Form state
  const [answerContent, setAnswerContent] = useState('');
  const [answerAnonymous, setAnswerAnonymous] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  // Voting & Acceptance states
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDoubt = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDoubtDetail(token, doubtId);
      setDoubt(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load question thread.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubt();
  }, [doubtId, token]);

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnswerError(null);

    if (!answerContent.trim() || answerContent.trim().length < 2) {
      setAnswerError('Please write an answer before submitting.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const newAnswer = await createAnswer(token, doubtId, {
        content: answerContent.trim(),
        is_anonymous: answerAnonymous,
      });
      setDoubt((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          answers: [...(prev.answers || []), newAnswer],
          answer_count: prev.answer_count + 1,
        };
      });
      setAnswerContent('');
      setAnswerAnonymous(false);
      setActionMessage('Your answer was posted successfully!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAnswerError(err.message);
      } else {
        setAnswerError('Failed to post answer.');
      }
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleVote = async (answerId: number) => {
    try {
      const res = await voteAnswer(token, answerId);
      setDoubt((prev) => {
        if (!prev || !prev.answers) return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) =>
            a.id === answerId ? { ...a, vote_count: res.vote_count, has_voted: true } : a
          ),
        };
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleAccept = async (answerId: number) => {
    try {
      const updated = await acceptAnswer(token, answerId);
      setDoubt((prev) => {
        if (!prev || !prev.answers) return prev;
        return {
          ...prev,
          status: updated.is_accepted ? 'resolved' : 'open',
          answers: prev.answers.map((a) =>
            a.id === answerId ? updated : { ...a, is_accepted: false }
          ),
        };
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!doubt) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this question? All answers will be removed.`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoubt(token, doubt.id);
      if (onDoubtDeleted) {
        onDoubtDeleted();
      } else {
        onBack();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs font-medium text-slate-500">Loading discussion thread...</p>
      </div>
    );
  }

  if (error || !doubt) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Question Not Found</h3>
        <p className="text-xs text-rose-600">{error || 'Unable to access discussion thread.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          &larr; Back to Questions
        </button>
      </div>
    );
  }

  const isResolved = doubt.status === 'resolved';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-amber-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Questions</span>
        </button>

        {(doubt.is_author || doubt.can_moderate) && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer"
            title="Delete this doubt"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Question</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {isResolved ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resolved</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Open for Discussion</span>
              </span>
            )}

            {doubt.is_anonymous ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span>{doubt.author_name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>{doubt.author_name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Asked on {new Date(doubt.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {doubt.title}
        </h1>

        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pt-1">
          {doubt.description}
        </div>
      </div>

      {/* Answers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>
              {doubt.answers?.length || 0} {doubt.answers?.length === 1 ? 'Answer' : 'Answers'}
            </span>
          </h2>
        </div>

        {doubt.answers?.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-2">
            <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No Answers Yet</h3>
            <p className="text-xs text-slate-400">
              Be the first classmate or lecturer to answer this question below!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {doubt.answers?.map((ans: Answer) => (
              <div
                key={ans.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition ${
                  ans.is_accepted
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10 bg-emerald-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center space-x-2">
                    {ans.is_anonymous ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ans.author_name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{ans.author_name}</span>
                      </span>
                    )}

                    {ans.is_accepted && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                        <span>Accepted Solution</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(ans.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {ans.content}
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVote(ans.id)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border font-semibold transition cursor-pointer ${
                      ans.has_voted
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${ans.has_voted ? 'fill-white' : ''}`} />
                    <span>{ans.vote_count} Upvotes</span>
                  </button>

                  {/* Accept as Solution button (author only) */}
                  {doubt.is_author && (
                    <button
                      onClick={() => handleAccept(ans.id)}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        ans.is_accepted
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'text-emerald-700 hover:bg-emerald-50 border-emerald-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{ans.is_accepted ? 'Accepted' : 'Accept as Solution'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Answer Submission Form */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Your Answer</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Help your classmates understand this concept. Anyone in the classroom can answer.
          </p>

          {answerError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{answerError}</span>
            </div>
          )}

          <form onSubmit={handlePostAnswer} className="space-y-4">
            <textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="Write your explanation or step-by-step solution here..."
              rows={4}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
              required
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={answerAnonymous}
                  onChange={(e) => setAnswerAnonymous(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Post this answer anonymously
                </span>
              </label>

              <button
                type="submit"
                disabled={submittingAnswer}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {submittingAnswer ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

