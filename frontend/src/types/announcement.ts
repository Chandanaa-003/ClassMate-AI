export type AnnouncementPriority = 'Normal' | 'Important' | 'Urgent';

export interface Announcement {
  id: number;
  classroom_id: number;
  classroom_name?: string | null;
  subject_id?: number | null;
  subject_name?: string | null;
  lecturer_id: number;
  lecturer_name: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  created_at: string;
  updated_at: string;
  is_author: boolean;
}

export interface AnnouncementCreatePayload {
  title: string;
  content: string;
  subject_id?: number | null;
  priority: AnnouncementPriority;
}

export interface AnnouncementUpdatePayload {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
}

