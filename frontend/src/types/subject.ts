export interface Subject {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  classroom_id: number;
  classroom_name: string;
  created_by_id: number;
  creator_name: string;
  created_at: string;
  updated_at: string;
  is_lecturer: boolean;
}

export interface CreateSubjectPayload {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  description?: string;
}

