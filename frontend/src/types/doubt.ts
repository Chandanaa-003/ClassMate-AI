export interface Answer {
  id: number;
  doubt_id: number;
  content: string;
  is_anonymous: boolean;
  author_name: string;
  author_role: string | null;
  is_author: boolean;
  is_accepted: boolean;
  vote_count: number;
  has_voted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Doubt {
  id: number;
  subject_id: number;
  title: string;
  description: string;
  is_anonymous: boolean;
  status: 'open' | 'resolved' | string;
  author_name: string;
  author_role: string | null;
  is_author: boolean;
  can_moderate: boolean;
  answer_count: number;
  created_at: string;
  updated_at: string;
  answers?: Answer[];
}

export interface CreateDoubtPayload {
  title: string;
  description: string;
  is_anonymous: boolean;
}

export interface CreateAnswerPayload {
  content: string;
  is_anonymous: boolean;
}

export interface VoteResponse {
  answer_id: number;
  vote_count: number;
  has_voted: boolean;
  message: string;
}

