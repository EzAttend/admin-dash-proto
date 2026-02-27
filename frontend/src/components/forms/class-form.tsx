'use client';

import { useState } from 'react';
import { FormField, inputClass } from '@/components/ui';
import type { ClassEntity } from '@/lib/types';

interface ClassFormProps {
  initial?: ClassEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: { class_name: string; batch: string }) => void;
  loading: boolean;
}

export function ClassForm({ initial, fieldErrors, onSubmit, loading }: ClassFormProps) {
  const [className, setClassName] = useState(initial?.class_name ?? '');
  const [batch, setBatch] = useState(initial?.batch ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ class_name: className.trim(), batch: batch.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Class Name" required error={fieldErrors.class_name}>
        <input
          className={inputClass}
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="e.g. CS-A"
          required
        />
      </FormField>

      <FormField label="Batch" required error={fieldErrors.batch}>
        <input
          className={inputClass}
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          placeholder="e.g. 2024-2028"
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
