'use client';

import { useState } from 'react';
import { FormField, selectClass, inputClass } from '@/components/ui';
import { useList } from '@/lib/hooks';
import type { SessionEntity, TimetableEntity } from '@/lib/types';

interface SessionFormProps {
  initial?: SessionEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    timetable_id: string;
    date: string;
    is_active: boolean;
    start_time_actual?: string;
    teacher_location_data?: {
      lat: number;
      lng: number;
      altitude: number;
    };
    qr_code_secret?: string;
  }) => void;
  loading: boolean;
}

export function SessionForm({ initial, fieldErrors, onSubmit, loading }: SessionFormProps) {
  const { data: timetables } = useList<TimetableEntity>('/timetable');

  const resolveId = (ref: string | { _id: string }): string =>
    typeof ref === 'string' ? ref : ref._id;

  const parseDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  };

  const parseDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 16);
  };

  const [timetableId, setTimetableId] = useState(initial ? resolveId(initial.timetable_id) : '');
  const [date, setDate] = useState(parseDate(initial?.date));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [startTimeActual, setStartTimeActual] = useState(parseDateTime(initial?.start_time_actual));
  const [lat, setLat] = useState(initial?.teacher_location_data?.lat?.toString() ?? '');
  const [lng, setLng] = useState(initial?.teacher_location_data?.lng?.toString() ?? '');
  const [altitude, setAltitude] = useState(initial?.teacher_location_data?.altitude?.toString() ?? '');
  const [qrCodeSecret, setQrCodeSecret] = useState(initial?.qr_code_secret ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Parameters<typeof onSubmit>[0] = {
      timetable_id: timetableId,
      date: new Date(date).toISOString(),
      is_active: isActive,
    };

    if (startTimeActual) {
      data.start_time_actual = new Date(startTimeActual).toISOString();
    }

    if (lat && lng && altitude) {
      data.teacher_location_data = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        altitude: parseFloat(altitude),
      };
    }

    if (qrCodeSecret.trim()) {
      data.qr_code_secret = qrCodeSecret.trim();
    }

    onSubmit(data);
  }

  const getTimetableLabel = (t: TimetableEntity): string => {
    const className = typeof t.class_id === 'object' ? t.class_id.class_name : 'Class';
    const subjectName = typeof t.subject_id === 'object' ? t.subject_id.subject_name : 'Subject';
    return `${className} - ${subjectName} (${t.day_of_week} ${t.start_time})`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Timetable Entry" required error={fieldErrors.timetable_id}>
        <select
          className={selectClass}
          value={timetableId}
          onChange={(e) => setTimetableId(e.target.value)}
          required
        >
          <option value="">Select timetable entry...</option>
          {timetables.map((t) => (
            <option key={t._id} value={t._id}>
              {getTimetableLabel(t)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Session Date" required error={fieldErrors.date}>
        <input
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Active" error={fieldErrors.is_active}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Session is active</span>
        </label>
      </FormField>

      <FormField label="Actual Start Time" error={fieldErrors.start_time_actual}>
        <input
          type="datetime-local"
          className={inputClass}
          value={startTimeActual}
          onChange={(e) => setStartTimeActual(e.target.value)}
        />
      </FormField>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Teacher Location (optional)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <FormField label="Latitude" error={fieldErrors['teacher_location_data.lat']}>
            <input
              type="number"
              step="any"
              className={inputClass}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Lat"
            />
          </FormField>
          <FormField label="Longitude" error={fieldErrors['teacher_location_data.lng']}>
            <input
              type="number"
              step="any"
              className={inputClass}
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Lng"
            />
          </FormField>
          <FormField label="Altitude" error={fieldErrors['teacher_location_data.altitude']}>
            <input
              type="number"
              step="any"
              className={inputClass}
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              placeholder="Alt"
            />
          </FormField>
        </div>
      </div>

      <FormField label="QR Code Secret" error={fieldErrors.qr_code_secret}>
        <input
          type="text"
          className={inputClass}
          value={qrCodeSecret}
          onChange={(e) => setQrCodeSecret(e.target.value)}
          placeholder="Optional secret for QR attendance"
        />
      </FormField>

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
