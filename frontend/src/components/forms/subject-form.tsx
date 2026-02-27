'use client';

import { useState } from 'react';
import { FormField, inputClass } from '@/components/ui';
import type { SubjectEntity } from '@/lib/types';

interface SubjectFormProps {
  initial?: SubjectEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: { subject_code: string; subject_name: string }) => void;
  loading: boolean;
}

export function SubjectForm({ initial, fieldErrors, onSubmit, loading }: SubjectFormProps) {
  const [subjectCode, setSubjectCode] = useState(initial?.subject_code ?? '');
  const [subjectName, setSubjectName] = useState(initial?.subject_name ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ subject_code: subjectCode.trim(), subject_name: subjectName.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Subject Code" required error={fieldErrors.subject_code}>
        <input
          className={inputClass}
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
          placeholder="e.g. CS101"
          required
        />
      </FormField>

      <FormField label="Subject Name" required error={fieldErrors.subject_name}>
        <input
          className={inputClass}
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="e.g. Data Structures"
          required
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
