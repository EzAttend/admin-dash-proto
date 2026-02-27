'use client';

import { CrudPage } from '@/components/crud-page';
import { SubjectForm } from '@/components/forms';
import type { Column } from '@/components/data-table';
import type { SubjectEntity } from '@/lib/types';

const columns: Column<SubjectEntity>[] = [
  {
    key: 'subject_code',
    header: 'Code',
    render: (v) => (
      <span className="font-mono text-sm font-medium text-white">{String(v)}</span>
    ),
  },
  { key: 'subject_name', header: 'Subject Name' },
  {
    key: 'createdAt',
    header: 'Created',
    render: (v) => (
      <span className="text-[#737373] text-xs">{new Date(v as string).toLocaleDateString()}</span>
    ),
  },
];

export default function SubjectsPage() {
  return (
    <CrudPage<SubjectEntity>
      endpoint="/subjects"
      columns={columns}
      title="Subjects"
      description="Manage subjects and course codes"
      entityLabel="Subject"
      renderForm={(props) => <SubjectForm {...props} />}
    />
  );
}
