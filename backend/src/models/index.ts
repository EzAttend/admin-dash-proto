// Identity models
export { User } from './user.model';
export type { IUser } from './user.model';
export { USER_ROLES } from './user.model';
export type { UserRole } from './user.model';

export { AuthAccount } from './auth-account.model';
export type { IAuthAccount } from './auth-account.model';

// Admin-owned models
export { Student } from './student.model';
export type { IStudent } from './student.model';
export { ENROLLMENT_STATUSES } from './student.model';
export type { EnrollmentStatus } from './student.model';
export { Teacher } from './teacher.model';
export type { ITeacher } from './teacher.model';
export { Class } from './class.model';
export type { IClass } from './class.model';
export { Subject } from './subject.model';
export type { ISubject } from './subject.model';
export { Room } from './room.model';
export type { IRoom, IGeofenceCoordinate } from './room.model';
export { Timetable } from './timetable.model';
export type { ITimetable } from './timetable.model';
export { DAYS_OF_WEEK } from './timetable.model';
export type { DayOfWeek } from './timetable.model';

// Read-only 
export { Session } from './session.model';
export type { ISession } from './session.model';

export { Attendance } from './attendance.model';
export type { IAttendance } from './attendance.model';
export { ATTENDANCE_STATUSES, VERIFICATION_METHODS } from './attendance.model';
export type { AttendanceStatus, VerificationMethod } from './attendance.model';

// Job orchestration
export { UploadJob } from './upload-job.model';
export type { IUploadJob } from './upload-job.model';
export { JOB_STATUSES, ENTITY_TYPES } from './upload-job.model';
export type { JobStatus, EntityType } from './upload-job.model';
