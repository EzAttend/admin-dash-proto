'use client';

import { CrudPage } from '@/components/crud-page';
import { StudentForm } from '@/components/forms';
import { StatusBadge } from '@/components/status-badge';
import type { Column } from '@/components/data-table';
import type { StudentEntity } from '@/lib/types';

const columns: Column<StudentEntity>[] = [
  {
    key: 'registration_number',
    header: 'Reg. Number',
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
  {
    key: 'class_id',
    header: 'Class',
    render: (v) => {
      if (v && typeof v === 'object' && 'class_name' in (v as Record<string, unknown>)) {
        const cls = v as { class_name: string; batch: string };
        return (
          <span className="text-xs bg-accent-500/10 text-accent-400 px-2 py-0.5 rounded-full">
            {cls.class_name} ({cls.batch})
          </span>
        );
      }
      return <span className="text-[#525252]">—</span>;
    },
  },
  {
    key: 'enrollment_status',
    header: 'Status',
    render: (v) => <StatusBadge status={v as string} />,
  },
];

export default function StudentsPage() {
  return (
    <CrudPage<StudentEntity>
      endpoint="/students"
      columns={columns}
      title="Students"
      description="Manage student records and enrollment"
      entityLabel="Student"
      renderForm={(props) => <StudentForm {...props} />}
    />
  );
}
