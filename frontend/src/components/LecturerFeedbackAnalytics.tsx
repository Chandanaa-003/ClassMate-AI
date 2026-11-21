import React, { useEffect, useState } from 'react';
import { getSubjectAnalytics, getClassroomAnalytics } from '../services/feedback';
import {
  SubjectAnalyticsResponse,
  ClassroomAnalyticsResponse,
  AnonymizedFeedbackItem,
} from '../types/feedback';
import {
  Star,
  Users,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ThumbsUp,
  Lightbulb,
  MessageSquare,
  Clock,
  Layers,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface LecturerFeedbackAnalyticsProps {
  token: string;
  subjectId?: number;
  classroomId?: number;
  title?: string;
  onSelectSubject?: (subjectId: number) => void;
}

export const LecturerFeedbackAnalytics: React.FC<LecturerFeedbackAnalyticsProps> = ({
  token,
  subjectId,
  classroomId,
  title,
  onSelectSubject,
}) => {
  const [period, setPeriod] = useState<string>('all');
  const [subjectData, setSubjectData] = useState<SubjectAnalyticsResponse | null>(null);
  const [classroomData, setClassroomData] = useState<ClassroomAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isClassroomMode = !!classroomId && !subjectId;

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      if (subjectId) {
        const data = await getSubjectAnalytics(token, subjectId, period);
        setSubjectData(data);
      } else if (classroomId) {
        const data = await getClassroomAnalytics(token, classroomId, period);
        setClassroomData(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load feedback analytics.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [subjectId, classroomId, period, token]);

  const activeData = subjectId ? subjectData : classroomData;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>{isClassroomMode ? 'Classroom-Wide Analytics' : 'Subject Analytics'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {title || (activeData ? (isClassroomMode ? (activeData as ClassroomAnalyticsResponse).classroom_name : (activeData as SubjectAnalyticsResponse).subject_name) : 'Student Feedback Analytics')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated insights and real-time student evaluation metrics.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl self-start md:self-center">
          {[
            { id: 'all', label: 'All Periods' },
            { id: 'general', label: 'General' },
            { id: 'midterm', label: 'Midterm' },
            { id: 'end-term', label: 'End-term' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                period === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-3 text-xs font-medium">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-slate-200/80 space-y-3">
          <RotateCcw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-semibold text-slate-600">Calculating feedback analytics...</p>
        </div>
      ) : !activeData || activeData.total_submissions === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Feedback Submitted Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Students have not submitted feedback for the selected evaluation period ({period}).
            Remind students in class to submit their ratings — all student submissions are completely anonymous.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Small Sample Size Warning Banner */}
          {!activeData.has_sufficient_data && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start space-x-3 text-amber-900 animate-fade-in shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <strong className="font-bold">Preliminary Sample Size Notice ({activeData.total_submissions} {activeData.total_submissions === 1 ? 'submission' : 'submissions'})</strong>
                <p className="text-amber-800 leading-relaxed">
                  Fewer than 3 students have submitted feedback for this timeframe. Aggregate averages and distributions are displayed as preliminary indicators; gathering additional feedback will provide higher statistical confidence.
                </p>
              </div>
            </div>
          )}

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Responses</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                {activeData.total_submissions}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Verified student submissions
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Overall</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 flex items-baseline space-x-1.5">
                <span>{activeData.average_overall.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
              </div>
              {renderStars(activeData.average_overall)}
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Teaching Clarity</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 flex items-baseline space-x-1.5">
                <span>{activeData.average_clarity.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Clarity of explanations</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Lecture Pace</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 flex items-baseline space-x-1.5">
                <span>{activeData.average_pace.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Speed & lecture flow</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Understanding</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 flex items-baseline space-x-1.5">
                <span>{activeData.average_understanding.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Concept grasp & depth</span>
            </div>
          </div>

          {/* Rating Distribution & Key Themes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution Bar Chart */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Rating Distribution</h3>
                  <p className="text-xs text-slate-500">Spread of overall ratings from 1 to 5 stars</p>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>

              <div className="space-y-3 pt-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = activeData.rating_distribution[star] || 0;
                  const percent =
                    activeData.total_submissions > 0
                      ? Math.round((count / activeData.total_submissions) * 100)
                      : 0;

                  return (
                    <div key={star} className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1 w-16 text-slate-700 font-semibold">
                        <span>{star}</span>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </div>

                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="w-20 text-right text-slate-500 font-mono text-[11px]">
                        <span className="font-bold text-slate-800">{count}</span> ({percent}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Qualitative Feedback Themes */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Feedback Themes & Insights</h3>
                <p className="text-xs text-slate-500">Common patterns extracted from student feedback</p>
              </div>

              <div className="space-y-4">
                {/* Positive themes */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Top Strengths ({activeData.positive_themes.length})</span>
                  </div>
                  {activeData.positive_themes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeData.positive_themes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific positive themes identified yet.</p>
                  )}
                </div>

                {/* Improvement themes */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4" />
                    <span>Actionable Improvements ({activeData.improvement_themes.length})</span>
                  </div>
                  {activeData.improvement_themes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeData.improvement_themes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-medium"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No improvement themes identified yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Classroom Subject Breakdown (If Classroom Mode) */}
          {isClassroomMode && (activeData as ClassroomAnalyticsResponse).subject_breakdown?.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Subject Comparison Breakdown</h3>
                  <p className="text-xs text-slate-500">Performance and ratings across classroom subjects</p>
                </div>
                <Layers className="w-5 h-5 text-slate-400" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Submissions</th>
                      <th className="py-3 px-4">Overall</th>
                      <th className="py-3 px-4">Clarity</th>
                      <th className="py-3 px-4">Pace</th>
                      <th className="py-3 px-4">Understanding</th>
                      {onSelectSubject && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeData as ClassroomAnalyticsResponse).subject_breakdown.map((s) => (
                      <tr key={s.subject_id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {s.subject_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {s.total_submissions}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">
                            {s.total_submissions > 0 ? s.average_overall.toFixed(1) : '-'}
                          </span>
                          {s.total_submissions > 0 && <span className="text-slate-400"> / 5.0</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {s.total_submissions > 0 ? s.average_clarity.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {s.total_submissions > 0 ? s.average_pace.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {s.total_submissions > 0 ? s.average_understanding.toFixed(1) : '-'}
                        </td>
                        {onSelectSubject && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onSelectSubject(s.subject_id)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition cursor-pointer"
                            >
                              View
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Anonymized Student Comments */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Recent Anonymized Comments</h3>
                <p className="text-xs text-slate-500">
                  Constructive feedback shared by students (identities completely removed)
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Anonymity Preserved
              </span>
            </div>

            {activeData.recent_feedback.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No text feedback submitted yet for this period.</p>
            ) : (
              <div className="space-y-4">
                {activeData.recent_feedback.map((item: AnonymizedFeedbackItem) => (
                  <div
                    key={item.id}
                    className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 space-y-3 transition hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold">
                          Anonymous Student
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          Period: {item.feedback_period}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center space-x-1 font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{item.overall_rating} / 5</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-1">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Clarity</span>
                        <span className="font-bold text-slate-800">{item.teaching_clarity_rating} / 5</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Pace</span>
                        <span className="font-bold text-slate-800">{item.lecture_pace_rating} / 5</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Understanding</span>
                        <span className="font-bold text-slate-800">{item.concept_understanding_rating} / 5</span>
                      </div>
                    </div>

                    {item.positive_feedback && (
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs">
                        <div className="font-bold text-emerald-800 flex items-center space-x-1 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>What worked well:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.positive_feedback}
                        </p>
                      </div>
                    )}

                    {item.improvement_suggestions && (
                      <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-xs">
                        <div className="font-bold text-amber-800 flex items-center space-x-1 mb-1">
                          <Lightbulb className="w-3 h-3 text-amber-600" />
                          <span>Suggested improvements:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.improvement_suggestions}
                        </p>
                      </div>
                    )}

                    {item.additional_comments && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs">
                        <span className="font-bold text-slate-600 block mb-1">Additional notes:</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.additional_comments}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

