'use client';

import { useState } from 'react';
import { FormField, selectClass, inputClass } from '@/components/ui';
import { useList } from '@/lib/hooks';
import type {
  TimetableEntity,
  ClassEntity,
  TeacherEntity,
  SubjectEntity,
  RoomEntity,
} from '@/lib/types';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

interface TimetableFormProps {
  initial?: TimetableEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    class_id: string;
    teacher_id: string;
    subject_id: string;
    room_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }) => void;
  loading: boolean;
}

export function TimetableForm({ initial, fieldErrors, onSubmit, loading }: TimetableFormProps) {
  const { data: classes } = useList<ClassEntity>('/classes');
  const { data: teachers } = useList<TeacherEntity>('/teachers');
  const { data: subjects } = useList<SubjectEntity>('/subjects');
  const { data: rooms } = useList<RoomEntity>('/rooms');

  const resolveId = (ref: string | { _id: string }): string =>
    typeof ref === 'string' ? ref : ref._id;

  const [classId, setClassId] = useState(initial ? resolveId(initial.class_id) : '');
  const [teacherId, setTeacherId] = useState(initial ? resolveId(initial.teacher_id) : '');
  const [subjectId, setSubjectId] = useState(initial ? resolveId(initial.subject_id) : '');
  const [roomId, setRoomId] = useState(initial ? resolveId(initial.room_id) : '');
  const [dayOfWeek, setDayOfWeek] = useState(initial?.day_of_week ?? '');
  const [startTime, setStartTime] = useState(initial?.start_time ?? '');
  const [endTime, setEndTime] = useState(initial?.end_time ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      class_id: classId,
      teacher_id: teacherId,
      subject_id: subjectId,
      room_id: roomId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Class" required error={fieldErrors.class_id}>
        <select
          className={selectClass}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          required
        >
          <option value="">Select class...</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.class_name} ({c.batch})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Teacher" required error={fieldErrors.teacher_id}>
        <select
          className={selectClass}
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          required
        >
          <option value="">Select teacher...</option>
          {teachers.map((t) => {
            const userName = typeof t.userId === 'object' ? t.userId.name : t.teacher_id;
            return (
              <option key={t._id} value={t._id}>
                {userName} ({t.teacher_id})
              </option>
            );
          })}
        </select>
      </FormField>

      <FormField label="Subject" required error={fieldErrors.subject_id}>
        <select
          className={selectClass}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          required
        >
          <option value="">Select subject...</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.subject_code} — {s.subject_name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Room" required error={fieldErrors.room_id}>
        <select
          className={selectClass}
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        >
          <option value="">Select room...</option>
          {rooms.map((r) => (
            <option key={r._id} value={r._id}>
              {r.room_number} — {r.building_name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Day of Week" required error={fieldErrors.day_of_week}>
        <select
          className={selectClass}
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          required
        >
          <option value="">Select day...</option>
          {DAYS_OF_WEEK.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start Time" required error={fieldErrors.start_time}>
          <input
            type="time"
            className={inputClass}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </FormField>

        <FormField label="End Time" required error={fieldErrors.end_time}>
          <input
            type="time"
            className={inputClass}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </FormField>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
