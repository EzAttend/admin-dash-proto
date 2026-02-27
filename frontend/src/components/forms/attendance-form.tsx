'use client';

import { useState } from 'react';
import { FormField, selectClass, inputClass } from '@/components/ui';
import { useList } from '@/lib/hooks';
import type { AttendanceEntity, SessionEntity, StudentEntity, AttendanceStatus, VerificationMethod } from '@/lib/types';

const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ['Present', 'Late', 'Absent'] as const;
const VERIFICATION_METHODS: readonly VerificationMethod[] = ['Face', 'QR_Fallback'] as const;

interface AttendanceFormProps {
  initial?: AttendanceEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    session_id: string;
    student_id: string;
    timestamp: string;
    status: string;
    verification_method: string;
    confidence_score?: number;
    location_verified?: boolean;
  }) => void;
  loading: boolean;
}

export function AttendanceForm({ initial, fieldErrors, onSubmit, loading }: AttendanceFormProps) {
  const { data: sessions } = useList<SessionEntity>('/sessions');
  const { data: students } = useList<StudentEntity>('/students');

  const resolveId = (ref: string | { _id: string }): string =>
    typeof ref === 'string' ? ref : ref._id;

  const parseDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 16);
  };

  const [sessionId, setSessionId] = useState(initial ? resolveId(initial.session_id) : '');
  const [studentId, setStudentId] = useState(initial ? resolveId(initial.student_id) : '');
  const [timestamp, setTimestamp] = useState(parseDateTime(initial?.timestamp) || parseDateTime(new Date().toISOString()));
  const [status, setStatus] = useState<AttendanceStatus>(initial?.status ?? 'Present');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(initial?.verification_method ?? 'Face');
  const [confidenceScore, setConfidenceScore] = useState(
    initial?.confidence_score != null ? String(initial.confidence_score) : ''
  );
  const [locationVerified, setLocationVerified] = useState(initial?.location_verified ?? false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Parameters<typeof onSubmit>[0] = {
      session_id: sessionId,
      student_id: studentId,
      timestamp: new Date(timestamp).toISOString(),
      status,
      verification_method: verificationMethod,
    };

    if (confidenceScore.trim()) {
      data.confidence_score = parseFloat(confidenceScore);
    }

    data.location_verified = locationVerified;

    onSubmit(data);
  }

  const getSessionLabel = (s: SessionEntity): string => {
    const date = new Date(s.date).toLocaleDateString();
    const activeLabel = s.is_active ? 'Active' : 'Inactive';
    return `Session ${date} (${activeLabel})`;
  };

  const getStudentLabel = (s: StudentEntity): string => {
    const name = typeof s.userId === 'object' ? s.userId.name : '';
    return name ? `${s.registration_number} - ${name}` : s.registration_number;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Session" required error={fieldErrors.session_id}>
        <select
          className={selectClass}
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          required
        >
          <option value="">Select session...</option>
          {sessions.map((s) => (
            <option key={s._id} value={s._id}>
              {getSessionLabel(s)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Student" required error={fieldErrors.student_id}>
        <select
          className={selectClass}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        >
          <option value="">Select student...</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {getStudentLabel(s)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Timestamp" required error={fieldErrors.timestamp}>
        <input
          type="datetime-local"
          className={inputClass}
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Status" required error={fieldErrors.status}>
        <select
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
          required
        >
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Verification Method" required error={fieldErrors.verification_method}>
        <select
          className={selectClass}
          value={verificationMethod}
          onChange={(e) => setVerificationMethod(e.target.value as VerificationMethod)}
          required
        >
          {VERIFICATION_METHODS.map((m) => (
            <option key={m} value={m}>
              {m === 'Face' ? 'Face Recognition' : 'QR Fallback'}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Confidence Score (0-1)" error={fieldErrors.confidence_score}>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          className={inputClass}
          value={confidenceScore}
          onChange={(e) => setConfidenceScore(e.target.value)}
          placeholder="e.g. 0.95"
        />
      </FormField>

      <FormField label="Location Verified" error={fieldErrors.location_verified}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={locationVerified}
            onChange={(e) => setLocationVerified(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Location was verified</span>
        </label>
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
