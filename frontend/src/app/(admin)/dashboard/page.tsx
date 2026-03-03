'use client';

import { useMemo } from 'react';
import { useList } from '@/lib/hooks';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  BookOpen,
  DoorOpen,
  Calendar,
  Clock,
  CheckSquare,
  RefreshCw,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type {
  StudentEntity,
  TeacherEntity,
  SessionEntity,
  AttendanceEntity,
  ClassEntity,
  SubjectEntity,
  RoomEntity,
  TimetableEntity,
} from '@/lib/types';

/* ─── KPI Card Component ──────────────────────────────────────── */
function KPICard({
  label,
  value,
  icon: Icon,
  iconBg,
  subtitle,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  subtitle?: string;
  href?: string;
}) {
  const card = (
    <div className="kpi-card group hover:border-accent-500/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#737373] mb-1">
            {label}
          </p>
          <span className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
            {value}
          </span>
          {subtitle && (
            <p className="text-xs text-[#737373] mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

/* ─── Custom Tooltip ──────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; fill: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-xl">
        <p className="text-[#737373] text-xs mb-1">{label}</p>
        {payload.map((p, idx) => (
          <p key={idx} className="text-white text-sm font-semibold capitalize">
            {p.dataKey}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/* ─── Dashboard Page ──────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: students, loading: l1 } = useList<StudentEntity>('/students');
  const { data: teachers, loading: l2 } = useList<TeacherEntity>('/teachers');
  const { data: sessions, loading: l3 } = useList<SessionEntity>('/sessions');
  const { data: attendance, loading: l4 } = useList<AttendanceEntity>('/attendance');
  const { data: classes, loading: l5 } = useList<ClassEntity>('/classes');
  const { data: subjects, loading: l6 } = useList<SubjectEntity>('/subjects');
  const { data: rooms, loading: l7 } = useList<RoomEntity>('/rooms');
  const { data: timetable, loading: l8 } = useList<TimetableEntity>('/timetable');

  const loading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

  // ── Computed stats ────────────────────────────────────────────
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;
  const totalSubjects = subjects.length;
  const totalRooms = rooms.length;
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.is_active).length;
  const totalTimetableEntries = timetable.length;

  const enrolledStudents = students.filter(s => s.enrollment_status === 'Enrolled').length;
  const pendingStudents = students.filter(s => s.enrollment_status === 'Pending').length;

  const totalAttendance = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;

  const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0';
  const lateRate = totalAttendance > 0 ? ((lateCount / totalAttendance) * 100).toFixed(1) : '0';
  const absentRate = totalAttendance > 0 ? ((absentCount / totalAttendance) * 100).toFixed(1) : '0';

  // ── Attendance by status for pie chart ────────────────────────
  const attendanceByStatus = useMemo(() => {
    if (totalAttendance === 0) return [];
    return [
      { name: 'Present', value: presentCount, color: '#22c55e' },
      { name: 'Late', value: lateCount, color: '#eab308' },
      { name: 'Absent', value: absentCount, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [presentCount, lateCount, absentCount, totalAttendance]);

  // ── Students per class for bar chart ──────────────────────────
  const studentsPerClass = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    for (const cls of classes) {
      counts[cls._id] = { name: cls.class_name, count: 0 };
    }
    for (const s of students) {
      const classId = typeof s.class_id === 'string' ? s.class_id : s.class_id?._id;
      if (classId && counts[classId]) {
        counts[classId].count++;
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [classes, students]);

  // ── Enrollment distribution for pie chart ─────────────────────
  const enrollmentDistribution = useMemo(() => {
    if (totalStudents === 0) return [];
    return [
      { name: 'Enrolled', value: enrolledStudents, color: '#22c55e' },
      { name: 'Pending', value: pendingStudents, color: '#eab308' },
      { name: 'Failed', value: students.filter(s => s.enrollment_status === 'Failed').length, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [students, enrolledStudents, pendingStudents, totalStudents]);

  // ── Recent attendance records ─────────────────────────────────
  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [attendance]);

  // ── Recent sessions ───────────────────────────────────────────
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [sessions]);

  // ── Timetable by day ──────────────────────────────────────────
  const timetableByDay = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(day => ({
      day: day.slice(0, 3),
      count: timetable.filter(t => t.day_of_week === day).length,
    }));
  }, [timetable]);

  /* ── Loading state ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-6 h-6 animate-spin text-accent-500" />
        <p className="text-sm text-[#737373]">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Students"
          value={totalStudents.toLocaleString()}
          subtitle={`${enrolledStudents} enrolled · ${pendingStudents} pending`}
          icon={GraduationCap}
          iconBg="bg-[#1e3a5f] text-blue-400"
          href="/students"
        />
        <KPICard
          label="Total Faculty"
          value={totalTeachers.toLocaleString()}
          icon={Users}
          iconBg="bg-[#1e3a3a] text-emerald-400"
          href="/teachers"
        />
        <KPICard
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          subtitle={`${presentCount} present of ${totalAttendance} records`}
          icon={CheckSquare}
          iconBg="bg-[#3a2a1e] text-amber-400"
          href="/attendance"
        />
        <KPICard
          label="Active Sessions"
          value={activeSessions}
          subtitle={`${totalSessions} total sessions`}
          icon={Clock}
          iconBg="bg-[#2a1e3a] text-purple-400"
          href="/sessions"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          label="Classes"
          value={totalClasses}
          icon={Layers}
          iconBg="bg-[#1e2a3a] text-cyan-400"
          href="/classes"
        />
        <KPICard
          label="Subjects"
          value={totalSubjects}
          icon={BookOpen}
          iconBg="bg-[#2a1e1e] text-rose-400"
          href="/subjects"
        />
        <KPICard
          label="Rooms"
          value={totalRooms}
          icon={DoorOpen}
          iconBg="bg-[#1e3a2e] text-teal-400"
          href="/rooms"
        />
        <KPICard
          label="Timetable Entries"
          value={totalTimetableEntries}
          icon={Calendar}
          iconBg="bg-[#3a3a1e] text-yellow-400"
          href="/timetable"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students per Class — Bar Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Students per Class</h2>
              <p className="text-sm text-[#737373]">Distribution of students across classes</p>
            </div>
            <Link href="/classes" className="text-xs font-semibold text-accent-500 hover:text-accent-400 transition-colors">
              VIEW ALL
            </Link>
          </div>

          {studentsPerClass.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-[#737373]">
              <Layers className="w-8 h-8 mb-2 text-[#525252]" />
              <p className="text-sm">No classes found. Create some classes first.</p>
            </div>
          ) : (
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsPerClass}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#525252"
                    tick={{ fill: '#737373', fontSize: 12 }}
                    axisLine={{ stroke: '#262626' }}
                  />
                  <YAxis
                    stroke="#525252"
                    tick={{ fill: '#737373', fontSize: 12 }}
                    axisLine={{ stroke: '#262626' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Attendance Breakdown — Pie */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-white mb-4">Attendance Breakdown</h3>
            {attendanceByStatus.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-[#737373]">
                <CheckSquare className="w-8 h-8 mb-2 text-[#525252]" />
                <p className="text-sm">No attendance records yet.</p>
              </div>
            ) : (
              <>
                <div className="relative h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {attendanceByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <p className="text-2xl font-bold text-white">{totalAttendance}</p>
                    <p className="text-[10px] text-accent-500 uppercase tracking-wider">Records</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-sm text-[#a3a3a3]">Present</span>
                    </div>
                    <span className="text-sm font-medium text-white">{presentCount} ({attendanceRate}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span className="text-sm text-[#a3a3a3]">Late</span>
                    </div>
                    <span className="text-sm font-medium text-white">{lateCount} ({lateRate}%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-sm text-[#a3a3a3]">Absent</span>
                    </div>
                    <span className="text-sm font-medium text-white">{absentCount} ({absentRate}%)</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Enrollment Status — Pie */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-white mb-4">Enrollment Status</h3>
            {enrollmentDistribution.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-[#737373]">
                <GraduationCap className="w-8 h-8 mb-2 text-[#525252]" />
                <p className="text-sm">No students yet.</p>
              </div>
            ) : (
              <>
                <div className="relative h-[150px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={enrollmentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {enrollmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <p className="text-xl font-bold text-white">{totalStudents}</p>
                    <p className="text-[10px] text-[#737373] uppercase tracking-wider">Total</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {enrollmentDistribution.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                        <span className="text-sm text-[#a3a3a3]">{d.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timetable by Day — Bar */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Timetable by Day</h3>
              <p className="text-sm text-[#737373]">Classes scheduled per day of the week</p>
            </div>
            <Link href="/timetable" className="text-xs font-semibold text-accent-500 hover:text-accent-400 transition-colors">
              VIEW ALL
            </Link>
          </div>
          {totalTimetableEntries === 0 ? (
            <div className="flex flex-col items-center py-8 text-[#737373]">
              <Calendar className="w-8 h-8 mb-2 text-[#525252]" />
              <p className="text-sm">No timetable entries yet.</p>
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timetableByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#525252"
                    tick={{ fill: '#737373', fontSize: 12 }}
                    axisLine={{ stroke: '#262626' }}
                  />
                  <YAxis
                    stroke="#525252"
                    tick={{ fill: '#737373', fontSize: 12 }}
                    axisLine={{ stroke: '#262626' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Recent Sessions</h3>
            <Link href="/sessions" className="text-xs font-semibold text-accent-500 hover:text-accent-400 transition-colors">
              VIEW ALL
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-[#737373]">
              <Clock className="w-8 h-8 mb-2 text-[#525252]" />
              <p className="text-sm">No sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const dateStr = new Date(session.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <div key={session._id} className="flex items-center gap-4 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${session.is_active ? 'bg-emerald-400' : 'bg-[#525252]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{dateStr}</p>
                      <p className="text-xs text-[#737373]">
                        {session.is_active ? 'Active' : 'Inactive'}
                        {session.start_time_actual && ` · Started ${new Date(session.start_time_actual).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Attendance Records */}
      {recentAttendance.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Recent Attendance</h3>
            <Link href="/attendance" className="text-xs font-semibold text-accent-500 hover:text-accent-400 transition-colors">
              VIEW ALL
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-[#525252] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Confidence</th>
                  <th className="pb-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {recentAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 text-sm text-white whitespace-nowrap">
                      {new Date(record.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : record.status === 'Late'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          record.status === 'Present' ? 'bg-emerald-400'
                          : record.status === 'Late' ? 'bg-amber-400'
                          : 'bg-red-400'
                        }`} />
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-[#a3a3a3]">
                      {record.verification_method === 'Face' ? 'Face' : 'QR Fallback'}
                    </td>
                    <td className="py-3 text-sm text-[#a3a3a3]">
                      {record.confidence_score != null
                        ? `${(record.confidence_score * 100).toFixed(0)}%`
                        : '—'}
                    </td>
                    <td className="py-3 text-sm">
                      {record.location_verified ? (
                        <span className="text-emerald-400">Verified</span>
                      ) : (
                        <span className="text-[#737373]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
