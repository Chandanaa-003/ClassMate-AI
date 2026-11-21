export type NotificationType =
  | 'announcement'
  | 'lecture_approved'
  | 'lecture_uploaded'
  | 'smart_notes_ready'
  | 'doubt_answered'
  | 'answer_accepted'
  | 'feedback_submitted'
  | 'doubt_created'
  | 'classroom_update'
  | string;

export interface Notification {
  id: number;
  recipient_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  classroom_id?: number | null;
  classroom_name?: string | null;
  subject_id?: number | null;
  subject_name?: string | null;
  resource_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
  limit: number;
  skip: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  unread_count: number;
}

