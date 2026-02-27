'use client';

import { CrudPage } from '@/components/crud-page';
import { TeacherForm } from '@/components/forms';
import type { Column } from '@/components/data-table';
import type { TeacherEntity } from '@/lib/types';

const columns: Column<TeacherEntity>[] = [
  {
    key: 'teacher_id',
    header: 'Teacher ID',
    render: (v) => (
      <span className="font-mono text-sm font-medium text-white">{String(v)}</span>
    ),
  },
  {
    key: 'userId',
    header: 'Name',
    render: (v) => {
      if (v && typeof v === 'object' && 'name' in (v as Record<string, unknown>)) {
        return <span className="font-medium text-white">{String((v as { name: string }).name)}</span>;
      }
      return <span className="text-[#525252]">—</span>;
    },
  },
  {
    key: 'userId',
    header: 'Email',
    render: (v) => {
      if (v && typeof v === 'object' && 'email' in (v as Record<string, unknown>)) {
        return <span className="text-[#a3a3a3]">{String((v as { email: string }).email)}</span>;
      }
      return <span className="text-[#525252]">—</span>;
    },
  },
];

export default function TeachersPage() {
  return (
    <CrudPage<TeacherEntity>
      endpoint="/teachers"
      columns={columns}
      title="Teachers"
      description="Manage teacher records"
      entityLabel="Teacher"
      renderForm={(props) => <TeacherForm {...props} />}
    />
  );
}
