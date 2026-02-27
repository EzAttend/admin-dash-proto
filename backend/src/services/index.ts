export { createCrudService } from './crud.factory';
export type { CrudService } from './crud.factory';

export { classService } from './class.service';
export { subjectService } from './subject.service';
export { roomService } from './room.service';
export { studentService } from './student.service';
export { teacherService } from './teacher.service';
export { timetableService } from './timetable.service';
export { sessionService } from './session.service';
export { attendanceService } from './attendance.service';

export {
  createJob,
  markJobRunning,
  markJobCompleted,
  markJobFailed,
  updateJobProgress,
  getJobById,
  listJobs,
} from './job.service';
export type { CreateJobInput } from './job.service';
