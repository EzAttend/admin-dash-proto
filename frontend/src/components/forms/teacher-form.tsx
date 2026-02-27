'use client';

import { useState } from 'react';
import { FormField, inputClass } from '@/components/ui';
import type { TeacherEntity } from '@/lib/types';

interface TeacherFormProps {
  initial?: TeacherEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    teacher_id: string;
    name: string;
    email: string;
    password: string;
  }) => void;
  loading: boolean;
}

export function TeacherForm({ initial, fieldErrors, onSubmit, loading }: TeacherFormProps) {
  const initialUser = initial && typeof initial.userId === 'object' ? initial.userId : null;
  const [teacherId, setTeacherId] = useState(initial?.teacher_id ?? '');
  const [name, setName] = useState(initialUser?.name ?? '');
  const [email, setEmail] = useState(initialUser?.email ?? '');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Parameters<typeof onSubmit>[0] = {
      teacher_id: teacherId.trim(),
      name: name.trim(),
      email: email.trim(),
      password: password,
    };
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
      <FormField label="Teacher ID" required error={fieldErrors.teacher_id}>
        <input
          className={inputClass}
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          placeholder="e.g. TCH001"
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
          placeholder="teacher@example.com"
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
