export interface Classroom {
  id: number;
  name: string;
  description: string | null;
  join_code: string;
  lecturer_id: number;
  lecturer_name: string;
  lecturer_email: string;
  member_count: number;
  created_at: string;
  updated_at: string;
  is_lecturer: boolean;
}

export interface ClassroomMember {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  joined_at: string;
}

export interface ClassroomDetail extends Classroom {
  members: ClassroomMember[];
}

export interface CreateClassroomPayload {
  name: string;
  description?: string;
}

export interface JoinClassroomPayload {
  join_code: string;
}

