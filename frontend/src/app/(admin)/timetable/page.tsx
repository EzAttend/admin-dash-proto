'use client';

import { CrudPage } from '@/components/crud-page';
import { TimetableForm } from '@/components/forms';
import type { Column } from '@/components/data-table';
import type { TimetableEntity } from '@/lib/types';

function refName(v: unknown, field: string): string {
  if (v && typeof v === 'object' && field in (v as Record<string, unknown>)) {
    return String((v as Record<string, string>)[field]);
  }
  return typeof v === 'string' ? v.slice(0, 8) + '…' : '—';
}

const DAY_COLORS: Record<string, string> = {
  Monday: 'bg-blue-500/10 text-blue-400',
  Tuesday: 'bg-purple-500/10 text-purple-400',
  Wednesday: 'bg-amber-500/10 text-amber-400',
  Thursday: 'bg-emerald-500/10 text-emerald-400',
  Friday: 'bg-rose-500/10 text-rose-400',
  Saturday: 'bg-[#333] text-[#737373]',
  Sunday: 'bg-[#333] text-[#737373]',
};

const columns: Column<TimetableEntity>[] = [
  {
    key: 'day_of_week',
    header: 'Day',
    render: (v) => {
      const day = String(v);
      const color = DAY_COLORS[day] ?? 'bg-[#333] text-[#737373]';
      return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${color}`}>{day}</span>;
    },
  },
  {
    key: 'start_time',
    header: 'Start',
    render: (v) => <span className="font-mono text-sm text-[#a3a3a3]">{String(v)}</span>,
  },
  {
    key: 'end_time',
    header: 'End',
    render: (v) => <span className="font-mono text-sm text-[#a3a3a3]">{String(v)}</span>,
  },
  {
    key: 'class_id',
    header: 'Class',
    render: (v) => {
      const name = refName(v, 'class_name');
      return name === '—'
        ? <span className="text-[#525252]">—</span>
        : <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">{name}</span>;
    },
  },
  {
    key: 'teacher_id',
    header: 'Teacher',
    render: (v) => {
      if (v && typeof v === 'object') {
        const t = v as { userId?: string | { name: string } };
        if (t.userId && typeof t.userId === 'object' && 'name' in t.userId) {
          return <span className="font-medium text-white">{t.userId.name}</span>;
        }
      }
      return <span className="text-[#525252]">—</span>;
    },
  },
  {
    key: 'subject_id',
    header: 'Subject',
    render: (v) => {
      const code = refName(v, 'subject_code');
      return code === '—'
        ? <span className="text-[#525252]">—</span>
        : <span className="font-mono text-sm font-medium text-white">{code}</span>;
    },
  },
  {
    key: 'room_id',
    header: 'Room',
    render: (v) => {
      const num = refName(v, 'room_number');
      return num === '—'
        ? <span className="text-[#525252]">—</span>
        : <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full">{num}</span>;
    },
  },
];

export default function TimetablePage() {
  return (
    <CrudPage<TimetableEntity>
      endpoint="/timetable"
      columns={columns}
      title="Timetable"
      description="Manage weekly class schedules"
      entityLabel="Timetable Entry"
      wide
      renderForm={(props) => <TimetableForm {...props} />}
    />
  );
}
