export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string; code: string }>;
}

export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEntity extends BaseEntity {
  class_name: string;
  batch: string;
}

export interface SubjectEntity extends BaseEntity {
  subject_code: string;
  subject_name: string;
}

export interface RoomEntity extends BaseEntity {
  room_number: string;
  building_name: string;
  floor_number: number;
  geofence_coordinates: Array<{ lat: number; lng: number }>;
  base_altitude?: number;
}

export interface UserIdentity {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface StudentEntity extends BaseEntity {
  registration_number: string;
  userId: string | UserIdentity;
  class_id: string | { _id: string; class_name: string; batch: string };
  enrollment_status: 'Pending' | 'Enrolled' | 'Failed';
  face_vector: number[];
}

export interface TeacherEntity extends BaseEntity {
  teacher_id: string;
  userId: string | UserIdentity;
}

export interface TimetableEntity extends BaseEntity {
  class_id: string | { _id: string; class_name: string };
  teacher_id: string | { _id: string; userId: string | UserIdentity; teacher_id: string };
  subject_id: string | { _id: string; subject_code: string; subject_name: string };
  room_id: string | { _id: string; room_number: string; building_name: string };
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type EntityType = 'CLASS_IMPORT' | 'SUBJECT_IMPORT' | 'ROOM_IMPORT' | 'STUDENT_IMPORT' | 'TEACHER_IMPORT' | 'TIMETABLE_IMPORT';

export interface UploadJobEntity extends BaseEntity {
  entity_type: EntityType;
  status: JobStatus;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  failure_count: number;
  row_errors: Array<{
    row: number;
    column: string;
    code: string;
    message: string;
  }>;
  created_by: string;
  completed_at?: string;
}

export interface TeacherLocationData {
  lat: number;
  lng: number;
  altitude: number;
}

export interface SessionEntity extends BaseEntity {
  timetable_id: string | TimetableEntity;
  date: string;
  is_active: boolean;
  start_time_actual?: string;
  teacher_location_data?: TeacherLocationData;
  qr_code_secret?: string;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent';
export type VerificationMethod = 'Face' | 'QR_Fallback';

export interface AttendanceEntity extends BaseEntity {
  session_id: string | SessionEntity;
  student_id: string | StudentEntity;
  timestamp: string;
  status: AttendanceStatus;
  verification_method: VerificationMethod;
  confidence_score?: number;
  location_verified?: boolean;
}
