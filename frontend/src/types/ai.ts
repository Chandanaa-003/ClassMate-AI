export type ProcessingStatus = 'NOT_STARTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id?: number | null;
  lecture_id: number;
  transcript_text: string | null;
  language: string | null;
  status: ProcessingStatus;
  error_message: string | null;
  segments: TranscriptSegment[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SmartNoteSections {
  overview?: string;
  important_concepts?: string[];
  topic_explanations?: Array<{ topic: string; explanation: string } | string>;
  key_definitions?: Array<{ term: string; definition: string } | string>;
  important_points?: string[];
  examples_mentioned?: string[];
  important_keywords?: string[];
  quick_revision_summary?: string;
  possible_exam_questions?: string[];
}

export interface SmartNote {
  id?: number | null;
  lecture_id: number;
  overview: string | null;
  content_markdown: string | null;
  sections: SmartNoteSections | null;
  status: ProcessingStatus;
  error_message: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChatSourceItem {
  lecture_id: number;
  lecture_title: string;
  timestamp: string;
  start: number;
  snippet: string;
}

export interface ChatMessage {
  id?: number;
  conversation_id?: number;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  sources?: ChatSourceItem[] | null;
  created_at?: string;
}

export interface ChatResponse {
  conversation_id: number;
  message_id: number;
  answer: string;
  sources: ChatSourceItem[];
  is_grounded: boolean;
  created_at?: string;
}

export interface Conversation {
  id: number;
  subject_id?: number | null;
  lecture_id?: number | null;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}


