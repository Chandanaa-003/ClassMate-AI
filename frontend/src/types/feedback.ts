export type FeedbackPeriod = 'general' | 'midterm' | 'end-term';

export interface FeedbackCreatePayload {
  overall_rating: number;
  teaching_clarity_rating: number;
  lecture_pace_rating: number;
  concept_understanding_rating: number;
  positive_feedback?: string;
  improvement_suggestions?: string;
  additional_comments?: string;
  feedback_period?: string;
}

export interface FeedbackUpdatePayload {
  overall_rating?: number;
  teaching_clarity_rating?: number;
  lecture_pace_rating?: number;
  concept_understanding_rating?: number;
  positive_feedback?: string;
  improvement_suggestions?: string;
  additional_comments?: string;
}

export interface FeedbackResponse {
  id: number;
  subject_id: number;
  overall_rating: number;
  teaching_clarity_rating: number;
  lecture_pace_rating: number;
  concept_understanding_rating: number;
  positive_feedback?: string | null;
  improvement_suggestions?: string | null;
  additional_comments?: string | null;
  feedback_period: string;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnonymizedFeedbackItem {
  id: number;
  overall_rating: number;
  teaching_clarity_rating: number;
  lecture_pace_rating: number;
  concept_understanding_rating: number;
  positive_feedback?: string | null;
  improvement_suggestions?: string | null;
  additional_comments?: string | null;
  feedback_period: string;
  created_at: string;
}

export interface SubjectAnalyticsResponse {
  subject_id: number;
  subject_name: string;
  classroom_id: number;
  total_submissions: number;
  average_overall: number;
  average_clarity: number;
  average_pace: number;
  average_understanding: number;
  rating_distribution: Record<number, number>;
  positive_themes: string[];
  improvement_themes: string[];
  recent_feedback: AnonymizedFeedbackItem[];
  has_sufficient_data: boolean;
  period_filter?: string | null;
}

export interface SubjectAnalyticsBreakdown {
  subject_id: number;
  subject_name: string;
  total_submissions: number;
  average_overall: number;
  average_clarity: number;
  average_pace: number;
  average_understanding: number;
  has_sufficient_data: boolean;
}

export interface ClassroomAnalyticsResponse {
  classroom_id: number;
  classroom_name: string;
  total_submissions: number;
  average_overall: number;
  average_clarity: number;
  average_pace: number;
  average_understanding: number;
  rating_distribution: Record<number, number>;
  positive_themes: string[];
  improvement_themes: string[];
  subject_breakdown: SubjectAnalyticsBreakdown[];
  recent_feedback: AnonymizedFeedbackItem[];
  has_sufficient_data: boolean;
  period_filter?: string | null;
}
