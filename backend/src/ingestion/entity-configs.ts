import { z } from 'zod';
import mongoose from 'mongoose';
import { Student, Teacher, Timetable, User, AuthAccount, Class, Subject, Room } from '@/models';
import { ENROLLMENT_STATUSES } from '@/models/student.model';
import { DAYS_OF_WEEK } from '@/models/timetable.model';
import { validateRow } from '@/ingestion/validators/row-validator';
import { hashPassword } from '@/utils';
import type { EntityConfig, IngestionError } from '@/ingestion/types';

const TRANSACTION_CHUNK_SIZE = 500;

const classCsvHeaders = ['class_name', 'batch'] as const;

const classCsvSchema = z.object({
  class_name: z.string().trim().min(1, 'Class name is required'),
  batch: z.string().trim().min(1, 'Batch is required'),
});

type ClassCsvRow = z.infer<typeof classCsvSchema>;

export const classEntityConfig: EntityConfig<ClassCsvRow> = {
  expectedHeaders: classCsvHeaders,
  validateRow: (row, rowNumber) => validateRow(classCsvSchema, row, rowNumber),
  relations: {},
  uniqueFields: ['class_name'],
  preconditions: [],
  persist: async (docs) => {
    const errors: IngestionError[] = [];
    try {
      await Class.insertMany(
        docs.map((d) => ({ class_name: d.class_name, batch: d.batch })),
        { ordered: false },
      );
    } catch (err: unknown) {
      const mongoErr = err as { writeErrors?: Array<{ index: number; errmsg: string }> };
      if (mongoErr.writeErrors) {
        for (const we of mongoErr.writeErrors) {
          errors.push({ row: we.index + 1, column: '', code: 'INSERT_FAILED', message: we.errmsg });
        }
      } else {
        errors.push({ row: 0, column: '', code: 'INSERT_FAILED', message: (err as Error).message });
      }
    }
    return errors;
  },
};

const subjectCsvHeaders = ['subject_code', 'subject_name'] as const;

const subjectCsvSchema = z.object({
  subject_code: z.string().trim().min(1, 'Subject code is required'),
  subject_name: z.string().trim().min(1, 'Subject name is required'),
});

type SubjectCsvRow = z.infer<typeof subjectCsvSchema>;

export const subjectEntityConfig: EntityConfig<SubjectCsvRow> = {
  expectedHeaders: subjectCsvHeaders,
  validateRow: (row, rowNumber) => validateRow(subjectCsvSchema, row, rowNumber),
  relations: {},
  uniqueFields: ['subject_code'],
  preconditions: [],
  persist: async (docs) => {
    const errors: IngestionError[] = [];
    try {
      await Subject.insertMany(
        docs.map((d) => ({ subject_code: d.subject_code, subject_name: d.subject_name })),
        { ordered: false },
      );
    } catch (err: unknown) {
      const mongoErr = err as { writeErrors?: Array<{ index: number; errmsg: string }> };
      if (mongoErr.writeErrors) {
        for (const we of mongoErr.writeErrors) {
          errors.push({ row: we.index + 1, column: '', code: 'INSERT_FAILED', message: we.errmsg });
        }
      } else {
        errors.push({ row: 0, column: '', code: 'INSERT_FAILED', message: (err as Error).message });
      }
    }
    return errors;
  },
};

const roomCsvHeaders = [
  'room_number',
  'building_name',
  'floor_number',
] as const;

const roomCsvSchema = z.object({
  room_number: z.string().trim().min(1, 'Room number is required'),
  building_name: z.string().trim().min(1, 'Building name is required'),
  floor_number: z.string().trim().min(1, 'Floor number is required').refine(
    (val) => !isNaN(parseInt(val, 10)),
    { message: 'Floor number must be a valid integer' },
  ),
});

type RoomCsvRow = z.infer<typeof roomCsvSchema>;

export const roomEntityConfig: EntityConfig<RoomCsvRow> = {
  expectedHeaders: roomCsvHeaders,
  validateRow: (row, rowNumber) => validateRow(roomCsvSchema, row, rowNumber),
  relations: {},
  uniqueFields: ['room_number'],
  preconditions: [],
  persist: async (docs) => {
    const errors: IngestionError[] = [];
    try {
      await Room.insertMany(
        docs.map((d) => ({
          room_number: d.room_number,
          building_name: d.building_name,
          floor_number: Number(d.floor_number),
          geofence_coordinates: [],
        })),
        { ordered: false },
      );
    } catch (err: unknown) {
      const mongoErr = err as { writeErrors?: Array<{ index: number; errmsg: string }> };
      if (mongoErr.writeErrors) {
        for (const we of mongoErr.writeErrors) {
          errors.push({ row: we.index + 1, column: '', code: 'INSERT_FAILED', message: we.errmsg });
        }
      } else {
        errors.push({ row: 0, column: '', code: 'INSERT_FAILED', message: (err as Error).message });
      }
    }
    return errors;
  },
};

const studentCsvHeaders = [
  'registration_number',
  'name',
  'email',
  'password',
  'class_name',
  'enrollment_status',
] as const;

const studentCsvSchema = z.object({
  registration_number: z.string().trim().min(1, 'Registration number is required'),
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  class_name: z.string().trim().min(1, 'Class name is required'),
  enrollment_status: z.enum(ENROLLMENT_STATUSES),
});

type StudentCsvRow = z.infer<typeof studentCsvSchema>;

export const studentEntityConfig: EntityConfig<StudentCsvRow> = {
  expectedHeaders: studentCsvHeaders,

  validateRow: (row, rowNumber) =>
    validateRow(studentCsvSchema, row, rowNumber),

  relations: {
    class_name: {
      modelName: 'Class',
      lookupField: 'class_name',
    },
  },

  uniqueFields: ['registration_number', 'email'],

  uniqueFieldModels: { email: 'User' },

  preconditions: ['Class'],

  persist: async (docs) => {
    const errors: IngestionError[] = [];

    // Hash ALL passwords upfront in parallel (avoids sequential bcrypt inside transactions)
    const allHashes = await Promise.all(docs.map((d) => hashPassword(d.password)));

    for (let i = 0; i < docs.length; i += TRANSACTION_CHUNK_SIZE) {
      const chunk = docs.slice(i, i + TRANSACTION_CHUNK_SIZE);
      const chunkHashes = allHashes.slice(i, i + TRANSACTION_CHUNK_SIZE);
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const users = await User.insertMany(
            chunk.map((d) => ({
              name: d.name,
              email: d.email,
              role: 'student' as const,
            })),
            { session },
          );

          await AuthAccount.insertMany(
            users.map((u, idx) => ({
              userId: u._id,
              accountId: u._id,
              providerId: 'credential',
              password: chunkHashes[idx],
            })),
            { session },
          );

          await Student.insertMany(
            chunk.map((d, idx) => ({
              userId: users[idx]._id,
              registration_number: d.registration_number,
              class_id: d.class_name,
              enrollment_status: d.enrollment_status,
            })),
            { session },
          );
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        for (let j = 0; j < chunk.length; j++) {
          errors.push({
            row: i + j + 1,
            column: '',
            code: 'INSERT_FAILED',
            message: msg,
          });
        }
      } finally {
        await session.endSession();
      }
    }

    return errors;
  },
};

const teacherCsvHeaders = [
  'teacher_id',
  'name',
  'email',
  'password',
] as const;

const teacherCsvSchema = z.object({
  teacher_id: z.string().trim().min(1, 'Teacher ID is required'),
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type TeacherCsvRow = z.infer<typeof teacherCsvSchema>;

export const teacherEntityConfig: EntityConfig<TeacherCsvRow> = {
  expectedHeaders: teacherCsvHeaders,

  validateRow: (row, rowNumber) =>
    validateRow(teacherCsvSchema, row, rowNumber),

  relations: {},

  uniqueFields: ['teacher_id', 'email'],

  uniqueFieldModels: { email: 'User' },

  preconditions: [],

  persist: async (docs) => {
    const errors: IngestionError[] = [];

    // Hash ALL passwords upfront in parallel (avoids sequential bcrypt inside transactions)
    const allHashes = await Promise.all(docs.map((d) => hashPassword(d.password)));

    for (let i = 0; i < docs.length; i += TRANSACTION_CHUNK_SIZE) {
      const chunk = docs.slice(i, i + TRANSACTION_CHUNK_SIZE);
      const chunkHashes = allHashes.slice(i, i + TRANSACTION_CHUNK_SIZE);
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const users = await User.insertMany(
            chunk.map((d) => ({
              name: d.name,
              email: d.email,
              role: 'teacher' as const,
            })),
            { session },
          );

          await AuthAccount.insertMany(
            users.map((u, idx) => ({
              userId: u._id,
              accountId: u._id,
              providerId: 'credential',
              password: chunkHashes[idx],
            })),
            { session },
          );

          await Teacher.insertMany(
            chunk.map((d, idx) => ({
              userId: users[idx]._id,
              teacher_id: d.teacher_id,
            })),
            { session },
          );
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        for (let j = 0; j < chunk.length; j++) {
          errors.push({
            row: i + j + 1,
            column: '',
            code: 'INSERT_FAILED',
            message: msg,
          });
        }
      } finally {
        await session.endSession();
      }
    }

    return errors;
  },
};

const timetableCsvHeaders = [
  'class_name',
  'teacher_id',
  'subject_code',
  'room_number',
  'day_of_week',
  'start_time',
  'end_time',
] as const;

const timetableCsvSchema = z.object({
  class_name: z.string().trim().min(1, 'Class name is required'),
  teacher_id: z.string().trim().min(1, 'Teacher ID is required'),
  subject_code: z.string().trim().min(1, 'Subject code is required'),
  room_number: z.string().trim().min(1, 'Room number is required'),
  day_of_week: z.enum(DAYS_OF_WEEK),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm format'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm format'),
}).refine(
  (data) => data.start_time < data.end_time,
  { message: 'start_time must be before end_time', path: ['end_time'] },
);

type TimetableCsvRow = z.infer<typeof timetableCsvSchema>;

export const timetableEntityConfig: EntityConfig<TimetableCsvRow> = {
  expectedHeaders: timetableCsvHeaders,

  validateRow: (row, rowNumber) =>
    validateRow(timetableCsvSchema, row, rowNumber),

  relations: {
    class_name: {
      modelName: 'Class',
      lookupField: 'class_name',
    },
    teacher_id: {
      modelName: 'Teacher',
      lookupField: 'teacher_id',
    },
    subject_code: {
      modelName: 'Subject',
      lookupField: 'subject_code',
    },
    room_number: {
      modelName: 'Room',
      lookupField: 'room_number',
    },
  },

  uniqueFields: [],

  preconditions: ['Class', 'Teacher', 'Subject', 'Room'],

  persist: async (docs) => {
    const errors: IngestionError[] = [];
    try {
      const mapped = docs.map((d) => ({
        class_id: d.class_name,     
        teacher_id: d.teacher_id,
        subject_id: d.subject_code, 
        room_id: d.room_number,       
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
      }));
      await Timetable.insertMany(mapped, { ordered: false });
    } catch (err: unknown) {
      const mongoErr = err as { writeErrors?: Array<{ index: number; errmsg: string }> };
      if (mongoErr.writeErrors) {
        for (const we of mongoErr.writeErrors) {
          errors.push({
            row: we.index + 1,
            column: '',
            code: 'INSERT_FAILED',
            message: we.errmsg,
          });
        }
      } else {
        errors.push({
          row: 0,
          column: '',
          code: 'INSERT_FAILED',
          message: (err as Error).message,
        });
      }
    }
    return errors;
  },
};
