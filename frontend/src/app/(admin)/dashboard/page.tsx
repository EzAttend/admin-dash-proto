'use client';

import { useMemo } from 'react';
import { useList } from '@/lib/hooks';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  AlertTriangle,
  BarChart3,
  MapPin,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
  RoomEntity,
  UserIdentity,
} from '@/lib/types';

/* ─── Helpers ─────────────────────────────────────────────────── */
function getPersonName(user: string | UserIdentity): string {
  if (typeof user === 'object' && user !== null) return user.name;
  return String(user);
}

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const CLASS_COLORS = ['#f97316', '#374151', '#4b5563', '#6b7280', '#9ca3af'];

/* ─── KPI Card Component ──────────────────────────────────────── */
function KPICard({
  label,
  value,
  trend,
  trendValue,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <div className="kpi-card group hover:border-accent-500/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#737373] mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white font-display tracking-tight">
              {value}
            </span>
            <span
              className={`flex items-center gap-1 text-xs font-semibold ${
                trend === 'up'
                  ? 'text-emerald-400'
                  : trend === 'down'
                  ? 'text-red-400'
                  : 'text-[#737373]'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

/* ─── Custom Tooltip ──────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-xl">
        <p className="text-[#737373] text-xs mb-1">{label}</p>
        {payload.map((p, idx) => (
          <p key={idx} className="text-white text-sm font-semibold">
            {p.dataKey === 'current' ? 'Present' : 'Absent'}: {p.value.toLocaleString()}
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
  const { data: _sessions, loading: l3 } = useList<SessionEntity>('/sessions');
  const { data: attendance, loading: l4 } = useList<AttendanceEntity>('/attendance');
  const { data: classes, loading: l5 } = useList<ClassEntity>('/classes');
  const { data: rooms, loading: l6 } = useList<RoomEntity>('/rooms');

  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  // Calculate stats
  const totalStudents = students.length;
  const enrolledStudents = students.filter(s => s.enrollment_status === 'Enrolled').length;
  const _pendingEnrollments = students.filter(s => s.enrollment_status === 'Pending').length;
  
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const totalAttendance = attendance.length;
  const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0';
  
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const absenteeRate = totalAttendance > 0 ? ((absentCount / totalAttendance) * 100).toFixed(1) : '0';

  // ── Attendance trends by month (present vs absent) ────────────
  // Always render the last 6 months so the chart has a full X-axis like the original
  const attendanceTrends = useMemo(() => {
    const now = new Date();
    // Build lookup of attendance per month
    const monthMap: Record<string, { present: number; absent: number }> = {};
    for (const a of attendance) {
      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { present: 0, absent: 0 };
      if (a.status === 'Present' || a.status === 'Late') {
        monthMap[key].present++;
      } else {
        monthMap[key].absent++;
      }
    }
    // Generate last 6 months (current month + 5 previous)
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const vals = monthMap[key] || { present: 0, absent: 0 };
      result.push({ month: MONTH_LABELS[d.getMonth()], current: vals.present, previous: vals.absent });
    }
    return result;
  }, [attendance]);

  const totalPresent = attendanceTrends.reduce((s: number, d) => s + d.current, 0);
  const totalAbsent = attendanceTrends.reduce((s: number, d) => s + d.previous, 0);

  // ── Class distribution (for pie chart) ────────────────────────
  const departmentData = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    for (const cls of classes) {
      counts[cls._id] = { name: cls.class_name, count: 0 };
    }
    for (const s of students) {
      const classId = typeof s.class_id === 'string' ? s.class_id : s.class_id?._id;
      if (classId && counts[classId]) counts[classId].count++;
    }
    return Object.values(counts)
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((c, i) => ({
        name: c.name,
        value: totalStudents > 0 ? parseFloat(((c.count / totalStudents) * 100).toFixed(1)) : 0,
        color: CLASS_COLORS[i % CLASS_COLORS.length],
      }));
  }, [classes, students, totalStudents]);

  const topDept = departmentData[0];

  // ── Rooms by building (for location bars) ─────────────────────
  const locationData = useMemo(() => {
    if (rooms.length === 0) return [];
    const buildingCounts: Record<string, number> = {};
    for (const r of rooms) buildingCounts[r.building_name] = (buildingCounts[r.building_name] || 0) + 1;
    const totalRooms = rooms.length;
    return Object.entries(buildingCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        percentage: totalRooms > 0 ? Math.round((count / totalRooms) * 100) : 0,
      }));
  }, [rooms]);

  // ── Faculty activity (real teachers) ──────────────────────────
  const facultyActivity = useMemo(() => {
    return teachers.slice(0, 3).map((t) => {
      const name = getPersonName(t.userId);
      return {
        name,
        dept: `ID: ${t.teacher_id}`,
        status: 'LOGGED' as const,
        time: '',
      };
    });
  }, [teachers]);

  // ── Low attendance students (<80% threshold) ──────────────────
  const lowAttendanceStudents = useMemo(() => {
    if (attendance.length === 0 || students.length === 0) return [];
    const studentStats: Record<string, { total: number; present: number }> = {};
    for (const a of attendance) {
      const sid = typeof a.student_id === 'string' ? a.student_id : a.student_id?._id;
      if (!sid) continue;
      if (!studentStats[sid]) studentStats[sid] = { total: 0, present: 0 };
      studentStats[sid].total++;
      if (a.status === 'Present' || a.status === 'Late') studentStats[sid].present++;
    }
    const studentMap = new Map(students.map(s => [s._id, s]));
    return Object.entries(studentStats)
      .map(([sid, stats]) => {
        const student = studentMap.get(sid);
        const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 100;
        const className = student && typeof student.class_id === 'object' ? student.class_id.class_name : '';
        return {
          name: student ? getPersonName(student.userId) : sid,
          course: className || '—',
          rate,
          trend: rate < 60 ? 'down' as const : 'up' as const,
        };
      })
      .filter(s => s.rate < 80)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3);
  }, [attendance, students]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Students"
          value={loading ? '...' : totalStudents.toLocaleString()}
          trend={enrolledStudents > 0 ? 'up' : 'neutral'}
          trendValue={`${enrolledStudents} enrolled`}
          icon={GraduationCap}
          iconBg="bg-[#1e3a5f] text-blue-400"
        />
        <KPICard
          label="Faculty Attendance"
          value={loading ? '...' : `${attendanceRate}%`}
          trend={parseFloat(attendanceRate) >= 75 ? 'up' : 'down'}
          trendValue={`${presentCount}/${totalAttendance}`}
          icon={Users}
          iconBg="bg-[#1e3a3a] text-emerald-400"
        />
        <KPICard
          label="Absentee Rate"
          value={loading ? '...' : `${absenteeRate}%`}
          trend={parseFloat(absenteeRate) > 25 ? 'down' : 'up'}
          trendValue={`${absentCount} absent`}
          icon={AlertTriangle}
          iconBg="bg-[#3a2a1e] text-amber-400"
        />
        <KPICard
          label="Enrollment Growth"
          value={loading ? '...' : `${((enrolledStudents / (totalStudents || 1)) * 100).toFixed(1)}%`}
          trend={parseFloat(String((enrolledStudents / (totalStudents || 1)) * 100)) >= 50 ? 'up' : 'down'}
          trendValue={`${_pendingEnrollments} pending`}
          icon={BarChart3}
          iconBg="bg-[#2a1e3a] text-purple-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trends Chart - Takes 2 columns */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Attendance Trends</h2>
              <p className="text-sm text-[#737373]">Academic performance and attendance metrics</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-500"></span>
                <span className="text-[#a3a3a3]">PRESENT</span>
                <span className="text-white font-semibold">{totalPresent.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#525252]"></span>
                <span className="text-[#a3a3a3]">ABSENT</span>
                <span className="text-white font-semibold">{totalAbsent.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#525252" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#525252" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#525252" 
                  tick={{ fill: '#737373', fontSize: 12 }}
                  axisLine={{ stroke: '#262626' }}
                />
                <YAxis 
                  stroke="#525252" 
                  tick={{ fill: '#737373', fontSize: 12 }}
                  axisLine={{ stroke: '#262626' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="previous"
                  stroke="#525252"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrevious)"
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCurrent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Department Distribution */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-white mb-4">Department Distribution</h3>
            <div className="relative h-[180px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData.length > 0 ? departmentData : [{ name: 'No data', value: 100, color: '#262626' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(departmentData.length > 0 ? departmentData : [{ name: 'No data', value: 100, color: '#262626' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <p className="text-2xl font-bold text-white">{topDept?.value ?? 0}%</p>
                <p className="text-[10px] text-accent-500 uppercase tracking-wider">{topDept?.name ?? '—'}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {departmentData.slice(0, 2).map((dept) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }}></span>
                    <span className="text-sm text-[#a3a3a3]">{dept.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{dept.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance by Location */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Attendance by Location</h3>
            </div>
            <div className="space-y-4">
              {locationData.map((loc) => (
                <div key={loc.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent-500" />
                    <span className="text-sm text-[#a3a3a3]">{loc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#262626] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-500 rounded-full transition-all duration-500"
                        style={{ width: `${loc.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-accent-500">{loc.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#262626] flex items-center justify-between">
              <span className="text-xs text-[#525252]">{rooms.length} TOTAL ROOMS</span>
              <Link href="/rooms" className="text-xs font-semibold text-accent-500 hover:text-accent-400 transition-colors">
                VIEW ALL
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Faculty Activity</h3>
            <Link href="/teachers" className="text-xs font-semibold text-accent-500 hover:text-accent-400 transition-colors">
              VIEW ALL
            </Link>
          </div>
          <div className="space-y-4">
            {facultyActivity.map((faculty, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#737373] font-medium text-sm">
                  {faculty.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{faculty.name}</p>
                  <p className="text-xs text-[#525252]">{faculty.dept}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    faculty.status === 'LOGGED' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-accent-500/10 text-accent-400'
                  }`}>
                    {faculty.status}
                  </span>
                  <p className="text-[10px] text-[#525252] mt-1">{faculty.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Low Attendance */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Critical Low Attendance</h3>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-red-500/10 text-red-400">
              ALERTS
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-[#525252] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Course</th>
                  <th className="pb-3 font-medium">Rate</th>
                  <th className="pb-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {lowAttendanceStudents.map((student, idx) => (
                  <tr key={idx} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-[#737373] text-xs font-medium">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-white">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-[#737373]">{student.course}</td>
                    <td className="py-3">
                      <span className="text-sm font-semibold text-red-400">{student.rate}%</span>
                    </td>
                    <td className="py-3">
                      {student.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
