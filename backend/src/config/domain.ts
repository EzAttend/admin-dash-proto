/**
 * DOMAIN OWNERSHIP - we might need this later when the admin scope grows
 *
 * This module defines hard ownership boundaries for the admin panel.
 * These constants are the single source of truth for what admin can and cannot do.
 *
 * INVARIANTS (contact krrish to make changes in this):
 * 1. No dangling references — all foreign keys must resolve to existing documents
 * 2. No auto-creation — never auto-create referenced entities during import
 * 3. All relations must pre-exist before write
 * 4. Runtime collections (sessions, attendance) are NEVER mutated by admin APIs
 * 5. Timetable is the single source of truth for all future sessions
 */

export const COLLECTIONS = {
  USERS: 'users',
  AUTH_ACCOUNTS: 'auth_accounts',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  SUBJECTS: 'subjects',
  ROOMS: 'rooms',
  TIMETABLE: 'timetable',
  SESSIONS: 'sessions',
  ATTENDANCE: 'attendance',
  UPLOAD_JOBS: 'upload_jobs',
} as const;

export type Permission = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

type OwnershipEntry = {
  collection: CollectionName;
  admin: readonly Permission[];
  teacher: readonly Permission[];
  student: readonly Permission[];
};

export const OWNERSHIP_MATRIX: readonly OwnershipEntry[] = [
  { collection: COLLECTIONS.USERS,       admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: ['READ'],  student: ['READ'] },
  { collection: COLLECTIONS.AUTH_ACCOUNTS,admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: [],       student: [] },
  { collection: COLLECTIONS.STUDENTS,    admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: ['READ'],  student: ['READ'] },
  { collection: COLLECTIONS.TEACHERS,    admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: ['READ'],  student: [] },
  { collection: COLLECTIONS.CLASSES,     admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: ['READ'],  student: ['READ'] },
  { collection: COLLECTIONS.SUBJECTS,    admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: ['READ'],  student: ['READ'] },
  { collection: COLLECTIONS.ROOMS,       admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: ['READ'],  student: [] },
  { collection: COLLECTIONS.TIMETABLE,   admin: ['CREATE', 'READ', 'UPDATE', 'DELETE'], teacher: ['READ'],  student: ['READ'] },
  { collection: COLLECTIONS.SESSIONS,    admin: ['READ'],                               teacher: ['CREATE', 'READ', 'UPDATE'], student: ['READ'] },
  { collection: COLLECTIONS.ATTENDANCE,  admin: ['READ'],                               teacher: ['READ'],  student: ['CREATE', 'READ'] },
  { collection: COLLECTIONS.UPLOAD_JOBS, admin: ['CREATE', 'READ'],                     teacher: [],        student: [] },
] as const;


export const ADMIN_OWNED_COLLECTIONS = [
  COLLECTIONS.STUDENTS,
  COLLECTIONS.TEACHERS,
  COLLECTIONS.CLASSES,
  COLLECTIONS.SUBJECTS,
  COLLECTIONS.ROOMS,
  COLLECTIONS.TIMETABLE,
] as const;

export const ADMIN_READONLY_COLLECTIONS = [
  COLLECTIONS.SESSIONS,
  COLLECTIONS.ATTENDANCE,
] as const;

export type AdminOwnedCollection = typeof ADMIN_OWNED_COLLECTIONS[number];
export type AdminReadonlyCollection = typeof ADMIN_READONLY_COLLECTIONS[number];

export const RELATION_MAP = {
  [COLLECTIONS.AUTH_ACCOUNTS]: {
    userId: COLLECTIONS.USERS,
  },
  [COLLECTIONS.STUDENTS]: {
    userId: COLLECTIONS.USERS,
    class_id: COLLECTIONS.CLASSES,
  },
  [COLLECTIONS.TEACHERS]: {
    userId: COLLECTIONS.USERS,
  },
  [COLLECTIONS.TIMETABLE]: {
    class_id: COLLECTIONS.CLASSES,
    teacher_id: COLLECTIONS.TEACHERS,
    subject_id: COLLECTIONS.SUBJECTS,
    room_id: COLLECTIONS.ROOMS,
  },
  [COLLECTIONS.SESSIONS]: {
    timetable_id: COLLECTIONS.TIMETABLE,
  },
  [COLLECTIONS.ATTENDANCE]: {
    session_id: COLLECTIONS.SESSIONS,
    student_id: COLLECTIONS.STUDENTS,
  },
} as const;



export const IMPORT_PRECONDITIONS: Record<string, readonly string[]> = {
  CLASS_IMPORT: [],
  SUBJECT_IMPORT: [],
  ROOM_IMPORT: [],
  STUDENT_IMPORT: [COLLECTIONS.CLASSES],
  TEACHER_IMPORT: [],
  TIMETABLE_IMPORT: [
    COLLECTIONS.CLASSES,
    COLLECTIONS.TEACHERS,
    COLLECTIONS.SUBJECTS,
    COLLECTIONS.ROOMS,
  ],
} as const;

export function assertAdminOwned(collection: string): asserts collection is AdminOwnedCollection {
  if (!(ADMIN_OWNED_COLLECTIONS as readonly string[]).includes(collection)) {
    throw new Error(
      `[DOMAIN VIOLATION] Collection '${collection}' is NOT admin-owned. ` +
      `Mutation forbidden. Admin-owned: ${ADMIN_OWNED_COLLECTIONS.join(', ')}`,
    );
  }
}
export function isAdminReadonly(collection: string): collection is AdminReadonlyCollection {
  return (ADMIN_READONLY_COLLECTIONS as readonly string[]).includes(collection);
}
