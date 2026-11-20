export type LectureApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Lecture {
  id: number;
  title: string;
  description: string | null;
  subject_id: number;
  duration: number | null;
  approval_status: LectureApprovalStatus;
  rejection_reason: string | null;
  uploader_name: string;
  uploader_role: string;
  is_uploader: boolean;
  can_review: boolean;
  can_delete: boolean;
  audio_url: string;
  created_at: string;
  updated_at: string;
}

export interface LectureReviewPayload {
  status: 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
}

export interface LectureDeleteResponse {
  message: string;
  id: number;
}

