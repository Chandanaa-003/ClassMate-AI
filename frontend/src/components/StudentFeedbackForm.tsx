import React, { useEffect, useState } from 'react';
import { getMyFeedback, submitFeedback, updateFeedback } from '../services/feedback';
import { FeedbackResponse } from '../types/feedback';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Sparkles,
  Send,
  RotateCcw,
} from 'lucide-react';

interface StudentFeedbackFormProps {
  token: string;
  subjectId: number;
  subjectName: string;
}

export const StudentFeedbackForm: React.FC<StudentFeedbackFormProps> = ({
  token,
  subjectId,
  subjectName,
}) => {
  const [period, setPeriod] = useState<string>('general');
  const [existingFeedback, setExistingFeedback] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form ratings (1 to 5)
  const [overallRating, setOverallRating] = useState<number>(5);
  const [clarityRating, setClarityRating] = useState<number>(5);
  const [paceRating, setPaceRating] = useState<number>(5);
  const [understandingRating, setUnderstandingRating] = useState<number>(5);

  // Form comments
  const [positiveText, setPositiveText] = useState('');
  const [improvementText, setImprovementText] = useState('');
  const [additionalText, setAdditionalText] = useState('');

  const fetchExisting = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyFeedback(token, subjectId, period);
      setExistingFeedback(data);
      if (data) {
        setOverallRating(data.overall_rating);
        setClarityRating(data.teaching_clarity_rating);
        setPaceRating(data.lecture_pace_rating);
        setUnderstandingRating(data.concept_understanding_rating);
        setPositiveText(data.positive_feedback || '');
        setImprovementText(data.improvement_suggestions || '');
        setAdditionalText(data.additional_comments || '');
        setIsEditing(false);
      } else {
        // Reset form for fresh submission
        setOverallRating(5);
        setClarityRating(5);
        setPaceRating(5);
        setUnderstandingRating(5);
        setPositiveText('');
        setImprovementText('');
        setAdditionalText('');
        setIsEditing(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to check existing feedback.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExisting();
  }, [subjectId, period, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (existingFeedback && isEditing) {
        // Update existing feedback
        const updated = await updateFeedback(token, existingFeedback.id, {
          overall_rating: overallRating,
          teaching_clarity_rating: clarityRating,
          lecture_pace_rating: paceRating,
          concept_understanding_rating: understandingRating,
          positive_feedback: positiveText.trim() || undefined,
          improvement_suggestions: improvementText.trim() || undefined,
          additional_comments: additionalText.trim() || undefined,
        });
        setExistingFeedback(updated);
        setIsEditing(false);
        setSuccessMsg('Your feedback has been successfully updated!');
      } else {
        // Create new feedback
        const created = await submitFeedback(token, subjectId, {
          overall_rating: overallRating,
          teaching_clarity_rating: clarityRating,
          lecture_pace_rating: paceRating,
          concept_understanding_rating: understandingRating,
          positive_feedback: positiveText.trim() || undefined,
          improvement_suggestions: improvementText.trim() || undefined,
          additional_comments: additionalText.trim() || undefined,
          feedback_period: period,
        });
        setExistingFeedback(created);
        setIsEditing(false);
        setSuccessMsg('Thank you! Your anonymous feedback has been recorded.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit feedback.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = (
    label: string,
    description: string,
    value: number,
    onChange: (val: number) => void,
    readOnly: boolean = false
  ) => {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800">{label}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <div className="flex items-center space-x-1.5 self-start sm:self-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                disabled={readOnly}
                onClick={() => !readOnly && onChange(star)}
                className={`p-1 rounded-lg transition ${
                  readOnly ? 'cursor-default' : 'hover:scale-110 cursor-pointer focus:outline-none'
                }`}
                title={`${star} Star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= value
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-xs font-bold text-slate-700 w-8 text-right">
              {value} / 5
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Privacy Guarantee Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-950/10">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Strictly Anonymous Student Evaluation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Anonymous Feedback for {subjectName}
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Your identity, student ID, and personal information are <strong>never</strong> shared
              with lecturers or other students. Lecturers only see aggregated statistics, rating
              distributions, and constructive anonymized excerpts.
            </p>
          </div>
        </div>
      </div>

      {/* Period Selection Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 px-3 uppercase tracking-wider">
          Feedback Period:
        </span>
        {(['general', 'midterm', 'end-term'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
              period === p
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {p === 'general' ? 'Regular / General' : p === 'midterm' ? 'Midterm' : 'End of Term'}
          </button>
        ))}
      </div>

      {/* Success & Error Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-3 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200/80">
          <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-xs font-medium">Checking existing feedback for this period...</p>
        </div>
      ) : existingFeedback && !isEditing ? (
        /* Submitted View (Read-Only with Edit Button) */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Submitted & Recorded</span>
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  Period: {existingFeedback.feedback_period}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-2">
                Your Submitted Anonymous Feedback
              </h3>
              <p className="text-xs text-slate-500">
                Submitted on {new Date(existingFeedback.created_at).toLocaleDateString()}
                {existingFeedback.updated_at !== existingFeedback.created_at && ' (Edited)'}
              </p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit My Feedback</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStarSelector(
              'Overall Satisfaction',
              'Your overall rating for this subject',
              existingFeedback.overall_rating,
              () => {},
              true
            )}
            {renderStarSelector(
              'Teaching Clarity',
              'How clearly the lecturer explains concepts',
              existingFeedback.teaching_clarity_rating,
              () => {},
              true
            )}
            {renderStarSelector(
              'Lecture Pace',
              'Suitability of the teaching and delivery speed',
              existingFeedback.lecture_pace_rating,
              () => {},
              true
            )}
            {renderStarSelector(
              'Concept Understanding',
              'Depth of conceptual mastery and clarity',
              existingFeedback.concept_understanding_rating,
              () => {},
              true
            )}
          </div>

          <div className="space-y-4 pt-2">
            {existingFeedback.positive_feedback && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  What you liked most
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {existingFeedback.positive_feedback}
                </p>
              </div>
            )}

            {existingFeedback.improvement_suggestions && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Suggested Improvements
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {existingFeedback.improvement_suggestions}
                </p>
              </div>
            )}

            {existingFeedback.additional_comments && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Additional Suggestions
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {existingFeedback.additional_comments}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Edit or Submit Form */
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {existingFeedback ? 'Update Your Feedback' : 'Submit New Feedback'}
              </h3>
              <p className="text-xs text-slate-500">
                Rate each category from 1 (Lowest) to 5 (Highest) and provide constructive thoughts.
              </p>
            </div>
            {existingFeedback && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Cancel Editing
              </button>
            )}
          </div>

          {/* 4 Core Rating Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStarSelector(
              'Overall Rating *',
              'Your overall rating for this subject',
              overallRating,
              setOverallRating
            )}
            {renderStarSelector(
              'Teaching Clarity *',
              'How clearly the lecturer explains concepts',
              clarityRating,
              setClarityRating
            )}
            {renderStarSelector(
              'Lecture Pace *',
              'Speed and pacing of the lectures',
              paceRating,
              setPaceRating
            )}
            {renderStarSelector(
              'Concept Understanding *',
              'How well concepts and problem solving are grasped',
              understandingRating,
              setUnderstandingRating
            )}
          </div>

          {/* Qualitative Feedback Text Areas */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                What did you like about the teaching? (Optional)
              </label>
              <textarea
                value={positiveText}
                onChange={(e) => setPositiveText(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="E.g., Great real-world examples, very encouraging during discussions, clear code walkthroughs..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-y"
              />
              <span className="text-[11px] text-slate-400 float-right">
                {positiveText.length} / 2000
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                What should be improved? (Optional)
              </label>
              <textarea
                value={improvementText}
                onChange={(e) => setImprovementText(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="E.g., Pacing during algorithmic proofs was a bit fast, more live coding examples would help..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-y"
              />
              <span className="text-[11px] text-slate-400 float-right">
                {improvementText.length} / 2000
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Additional Comments or Suggestions (Optional)
              </label>
              <textarea
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="Any other helpful notes for the lecturer..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-y"
              />
              <span className="text-[11px] text-slate-400 float-right">
                {additionalText.length} / 2000
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Identity strictly protected & anonymized</span>
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : existingFeedback ? 'Save Changes' : 'Submit Feedback'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

