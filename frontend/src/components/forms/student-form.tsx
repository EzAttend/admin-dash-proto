'use client';

import { useState } from 'react';
import { FormField, inputClass, selectClass } from '@/components/ui';
import { useList } from '@/lib/hooks';
import type { StudentEntity, ClassEntity } from '@/lib/types';

const ENROLLMENT_STATUSES = ['Pending', 'Enrolled', 'Failed'] as const;

interface StudentFormProps {
  initial?: StudentEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    registration_number: string;
    name: string;
    email: string;
    password: string;
    class_id: string;
    enrollment_status: string;
  }) => void;
  loading: boolean;
}

export function StudentForm({ initial, fieldErrors, onSubmit, loading }: StudentFormProps) {
  const { data: classes } = useList<ClassEntity>('/classes');

  const initialUser = initial && typeof initial.userId === 'object' ? initial.userId : null;
  const [regNumber, setRegNumber] = useState(initial?.registration_number ?? '');
  const [name, setName] = useState(initialUser?.name ?? '');
  const [email, setEmail] = useState(initialUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState(
    initial
      ? typeof initial.class_id === 'string'
        ? initial.class_id
        : initial.class_id._id
      : '',
  );
  const [status, setStatus] = useState<string>(initial?.enrollment_status ?? 'Pending');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Parameters<typeof onSubmit>[0] = {
      registration_number: regNumber.trim(),
      name: name.trim(),
      email: email.trim(),
      password: password,
      class_id: classId,
      enrollment_status: status,
    };
    // On update, only send password if changed
    if (initial && !password) {
      const { password: _password, ...rest } = data;
      void _password;
      onSubmit(rest as Parameters<typeof onSubmit>[0]);
      return;
    }
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Registration Number" required error={fieldErrors.registration_number}>
        <input
          className={inputClass}
          value={regNumber}
          onChange={(e) => setRegNumber(e.target.value)}
          placeholder="e.g. 2024CS001"
          required
        />
      </FormField>

      <FormField label="Name" required error={fieldErrors.name}>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
        />
      </FormField>

      <FormField label="Email" required error={fieldErrors.email}>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@example.com"
          required
        />
      </FormField>

      <FormField
        label={initial ? 'New Password (leave blank to keep)' : 'Password'}
        required={!initial}
        error={fieldErrors.password}
      >
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={initial ? '••••••••' : 'Password'}
          required={!initial}
        />
      </FormField>

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

      <FormField label="Enrollment Status" error={fieldErrors.enrollment_status}>
        <select
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {ENROLLMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
