'use client';

import { CrudPage } from '@/components/crud-page';
import { AttendanceForm } from '@/components/forms';
import type { Column } from '@/components/data-table';
import type { AttendanceEntity, StudentEntity, SessionEntity } from '@/lib/types';

const columns: Column<AttendanceEntity>[] = [
    {
        key: 'student_id',
        header: 'Student',
        render: (v) => {
            if (!v || typeof v === 'string') {
                return <span className="text-[#525252]">{String(v) || '—'}</span>;
            }
            const student = v as StudentEntity;
            const name = typeof student.userId === 'object' ? student.userId.name : '';
            return (
                <div>
                    <span className="font-medium text-white">{student.registration_number}</span>
                    {name && <span className="text-xs text-text-muted block">{name}</span>}
                </div>
            );
        },
    },
    {
        key: 'session_id',
        header: 'Session',
        render: (v) => {
            if (!v || typeof v === 'string') {
                return <span className="text-[#525252]">—</span>;
            }
            const session = v as SessionEntity;
            const date = new Date(session.date).toLocaleDateString();
            return <span className="text-xs text-text-secondary">{date}</span>;
        },
    },
    {
        key: 'timestamp',
        header: 'Time',
        render: (v) => (
            <span className="text-xs text-text-secondary">
                {new Date(v as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        ),
    },
    {
        key: 'status',
        header: 'Status',
        render: (v) => {
            const colors: Record<string, string> = {
                Present: 'bg-emerald-500/10 text-emerald-400',
                Late: 'bg-amber-500/10 text-amber-400',
                Absent: 'bg-red-500/10 text-red-400',
            };
            return (
                <span className={`text-xs px-2 py-0.5 rounded-full ${colors[v as string] || 'bg-[#333] text-text-muted'}`}>
                    {v as string}
                </span>
            );
        },
    },
    {
        key: 'verification_method',
        header: 'Method',
        render: (v) => (
            <span className={`text-xs px-2 py-0.5 rounded-full ${v === 'Face' ? 'bg-accent-500/10 text-accent-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                {v === 'Face' ? 'Face' : 'QR'}
            </span>
        ),
    },
    {
        key: 'confidence_score',
        header: 'Confidence',
        render: (v) =>
            v != null ? (
                <span className="text-xs text-text-secondary">{((v as number) * 100).toFixed(0)}%</span>
            ) : (
                <span className="text-[#525252]">—</span>
            ),
    },
    {
        key: 'location_verified',
        header: 'Location',
        render: (v) => (
            <span className={`text-xs ${v ? 'text-emerald-400' : 'text-[#525252]'}`}>
                {v ? '✓ Verified' : '—'}
            </span>
        ),
    },
    {
        key: 'createdAt',
        header: 'Created',
        render: (v) => (
            <span className="text-text-muted text-xs">
                {new Date(v as string).toLocaleDateString()}
            </span>
        ),
    },
];

export default function AttendancePage() {
    return (
        <CrudPage<AttendanceEntity>
            endpoint="/attendance"
            columns={columns}
            title="Attendance"
            description="View and manage attendance records"
            entityLabel="Attendance Record"
            renderForm={(props) => <AttendanceForm {...props} />}
            wide
        />
    );
}
