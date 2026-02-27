'use client';

import { useState, useRef, useCallback } from 'react';
import { StatusBadge } from './status-badge';
import {
  humanizeErrorCode,
  humanizeApiError,
  ENTITY_TYPE_LABELS,
} from '@/lib/error-messages';
import type { EntityType, JobStatus } from '@/lib/types';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  GraduationCap,
  Users,
  Calendar,
  Info,
  X,
  School,
  BookOpen,
  DoorOpen,
} from 'lucide-react';

interface UploadResponse {
  status: 'ok' | 'error';
  message: string;
  data?: {
    jobId: string;
    entityType: EntityType;
    totalRows: number;
    status: JobStatus;
  };
  errors?: Array<{ row: number; column: string; code: string; message: string }>;
}

interface JobPoll {
  _id: string;
  entity_type: EntityType;
  status: JobStatus;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  failure_count: number;
  row_errors: Array<{ row: number; column: string; code: string; message: string }>;
}

interface EntityOption {
  value: EntityType;
  label: string;
  icon: React.ElementType;
  columns: { name: string; required: boolean; example: string }[];
  prerequisites: string[];
  notes?: string;
}

const ENTITY_OPTIONS: EntityOption[] = [
  // Tier 1: Foundation (no prerequisites)
  {
    value: 'CLASS_IMPORT',
    label: 'Classes',
    icon: School,
    columns: [
      { name: 'class_name', required: true, example: 'CSE-A' },
      { name: 'batch', required: true, example: '2024-2028' },
    ],
    prerequisites: [],
    notes: 'Import classes first — students and timetable depend on them.',
  },
  {
    value: 'SUBJECT_IMPORT',
    label: 'Subjects',
    icon: BookOpen,
    columns: [
      { name: 'subject_code', required: true, example: 'CS101' },
      { name: 'subject_name', required: true, example: 'Data Structures' },
    ],
    prerequisites: [],
    notes: 'Import subjects first — teachers and timetable depend on them.',
  },
  {
    value: 'ROOM_IMPORT',
    label: 'Rooms',
    icon: DoorOpen,
    columns: [
      { name: 'room_number', required: true, example: '301' },
      { name: 'building_name', required: true, example: 'Block A' },
      { name: 'floor_number', required: true, example: '3' },
    ],
    prerequisites: [],
    notes: 'Import rooms first — timetable depends on them. Geofence can be set later via edit.',
  },
  // Tier 2: People (need Tier 1)
  {
    value: 'STUDENT_IMPORT',
    label: 'Students',
    icon: GraduationCap,
    columns: [
      { name: 'registration_number', required: true, example: 'STU001' },
      { name: 'name', required: true, example: 'Jane Doe' },
      { name: 'email', required: true, example: 'jane@example.com' },
      { name: 'password', required: true, example: 'SecurePass123' },
      { name: 'class_name', required: true, example: 'CSE-A' },
      { name: 'enrollment_status', required: false, example: 'Enrolled' },
    ],
    prerequisites: ['Classes'],
    notes: 'Each student will automatically get a login account created.',
  },
  {
    value: 'TEACHER_IMPORT',
    label: 'Teachers',
    icon: Users,
    columns: [
      { name: 'teacher_id', required: true, example: 'TCH001' },
      { name: 'name', required: true, example: 'Dr. Smith' },
      { name: 'email', required: true, example: 'smith@example.com' },
      { name: 'password', required: true, example: 'SecurePass123' },
    ],
    prerequisites: [],
    notes: 'Each teacher will automatically get a login account created.',
  },
  // Tier 3: Schedule (needs everything)
  {
    value: 'TIMETABLE_IMPORT',
    label: 'Timetable',
    icon: Calendar,
    columns: [
      { name: 'class_name', required: true, example: 'CSE-A' },
      { name: 'teacher_id', required: true, example: 'TCH001' },
      { name: 'subject_code', required: true, example: 'CS101' },
      { name: 'room_number', required: true, example: '101' },
      { name: 'day_of_week', required: true, example: 'Monday' },
      { name: 'start_time', required: true, example: '09:00' },
      { name: 'end_time', required: true, example: '10:00' },
    ],
    prerequisites: ['Classes', 'Teachers', 'Subjects', 'Rooms'],
    notes: 'Time format: HH:MM (24-hour). Days: Monday through Saturday.',
  },
];

/* ─── Component ───────────────────────────────────────────────── */

export function CsvUpload() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [job, setJob] = useState<JobPoll | null>(null);
  const [polling, setPolling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const selectedOption = ENTITY_OPTIONS.find((o) => o.value === entityType);

  /* ── Polling ──────────────────────────────────────────────── */

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  const startPolling = useCallback(
    (jobId: string) => {
      setPolling(true);
      const poll = async () => {
        try {
          const res = await fetch(`${apiBase}/jobs/${jobId}`, { credentials: 'include' });
          const json = await res.json();
          if (json.status === 'ok' && json.data) {
            setJob(json.data);
            if (json.data.status === 'COMPLETED' || json.data.status === 'FAILED') {
              stopPolling();
            }
          }
        } catch {
          // Silently retry on network error
        }
      };
      poll();
      pollRef.current = setInterval(poll, 2000);
    },
    [apiBase, stopPolling],
  );

  /* ── Handlers ─────────────────────────────────────────────── */

  function selectEntity(type: EntityType) {
    setEntityType(type);
    setStep(2);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv')) {
      setFile(droppedFile);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!file || !entityType) return;
    setUploading(true);
    setUploadResult(null);
    setJob(null);
    stopPolling();

    try {
      const csvText = await file.text();
      const res = await fetch(`${apiBase}/upload/${entityType}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'text/csv' },
        body: csvText,
      });
      const json: UploadResponse = await res.json();
      setUploadResult(json);
      setStep(3);
      if (json.status === 'ok' && json.data?.jobId) {
        startPolling(json.data.jobId);
      }
    } catch (err) {
      setUploadResult({
        status: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
      setStep(3);
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setEntityType(null);
    setFile(null);
    setUploadResult(null);
    setJob(null);
    stopPolling();
    if (fileRef.current) fileRef.current.value = '';
  }

  const progressPct =
    job && job.total_rows > 0
      ? Math.round((job.processed_rows / job.total_rows) * 100)
      : 0;

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {[ 'Choose Type', 'Upload File', 'Results' ].map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-[#333]" />}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-accent-500 text-white'
                        : 'bg-[#333] text-[#737373]'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span className={isActive || isDone ? 'text-white font-medium' : 'text-[#737373]'}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Step 1: Choose entity type ─────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-[#737373]">
            Select the type of data you want to import. Each type requires
            specific columns in your CSV file.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ENTITY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => selectEntity(opt.value)}
                  className="text-left card p-5 hover:border-accent-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center group-hover:bg-accent-500/20 transition-colors">
                      <Icon className="w-5 h-5 text-accent-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{opt.label}</p>
                      {opt.prerequisites.length > 0 && (
                        <p className="text-[10px] text-[#737373]">
                          Requires: {opt.prerequisites.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {opt.columns.slice(0, 3).map((col) => (
                      <div key={col.name} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                        <span className="font-medium text-[#e5e5e5]">{col.name}</span>
                        <span className="text-[#525252]">|</span>
                        <span className="text-[#737373]">{col.example}</span>
                      </div>
                    ))}
                    {opt.columns.length > 3 && (
                      <p className="text-[10px] text-[#737373]">
                        +{opt.columns.length - 3} more columns
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-[#737373] group-hover:text-accent-500 transition-colors">
                    <span>Select</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Step 2: Upload file ────────────────────────────── */}
      {step === 2 && selectedOption && (
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => { setStep(1); setFile(null); }}
            className="text-sm text-[#737373] hover:text-white transition-colors"
          >
            &larr; Back to type selection
          </button>

          {/* Column reference */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#333] flex items-center gap-2">
              <Info className="w-4 h-4 text-accent-500" />
              <h3 className="text-sm font-semibold text-white">
                CSV Columns for {selectedOption.label}
              </h3>
            </div>
            <div className="p-5">
              {selectedOption.notes && (
                <p className="text-xs text-[#737373] mb-3">{selectedOption.notes}</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-2 pr-4 font-medium text-[#737373] uppercase tracking-wider">Column</th>
                      <th className="text-left py-2 pr-4 font-medium text-[#737373] uppercase tracking-wider">Required</th>
                      <th className="text-left py-2 font-medium text-[#737373] uppercase tracking-wider">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {selectedOption.columns.map((col) => (
                      <tr key={col.name}>
                        <td className="py-2 pr-4 font-medium text-white">{col.name}</td>
                        <td className="py-2 pr-4">
                          {col.required ? (
                            <span className="text-emerald-400 font-medium">Yes</span>
                          ) : (
                            <span className="text-[#737373]">No</span>
                          )}
                        </td>
                        <td className="py-2 text-[#a3a3a3]">{col.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOption.prerequisites.length > 0 && (
                <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400">
                    <strong>Before importing:</strong> Make sure you have already
                    created {selectedOption.prerequisites.join(', ')} records.
                    The import will fail if referenced records don&apos;t exist.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* File drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragging
                ? 'border-accent-500 bg-accent-500/10'
                : file
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-[#333] hover:border-[#525252] bg-[#1a1a1a]'
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-emerald-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-[#737373]">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="ml-4 p-1 rounded hover:bg-[#333] text-[#737373] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#525252] mx-auto mb-2" />
                <p className="text-sm text-[#a3a3a3] mb-1">
                  Drag and drop your CSV file here
                </p>
                <p className="text-xs text-[#525252] mb-3">or</p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 cursor-pointer transition-colors">
                  <FileText className="w-4 h-4" />
                  Browse files
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>
              </>
            )}
          </div>

          {/* Upload button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-white rounded-lg font-medium text-sm hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent-500/20"
            >
              {uploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload &amp; Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Results ────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Sync rejection */}
          {uploadResult?.status === 'error' && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-400">Import Rejected</p>
                  <p className="text-sm text-red-400/80 mt-1">
                    {humanizeApiError(uploadResult.message)}
                  </p>
                </div>
              </div>

              {/* Precondition errors — Special callout */}
              {uploadResult.errors?.some((e) => e.code === 'PRECONDITION_FAILED') && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">
                        Missing Required Data
                      </p>
                      <p className="text-xs text-amber-400/70 mt-1">
                        Some records referenced in your file don&apos;t exist yet.
                        Create them first, then try importing again.
                      </p>
                      <ul className="mt-2 space-y-1">
                        {uploadResult.errors
                          ?.filter((e) => e.code === 'PRECONDITION_FAILED')
                          .map((e, i) => (
                            <li key={i} className="text-xs text-amber-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                              {e.message}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Other validation errors */}
              {uploadResult.errors &&
                uploadResult.errors.filter((e) => e.code !== 'PRECONDITION_FAILED').length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-2">
                      Issues found ({uploadResult.errors.filter((e) => e.code !== 'PRECONDITION_FAILED').length})
                    </p>
                    <div className="max-h-64 overflow-y-auto border border-red-500/20 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0">
                          <tr className="bg-red-900/30 text-red-400">
                            <th className="text-left px-3 py-2 font-medium">Row</th>
                            <th className="text-left px-3 py-2 font-medium">Column</th>
                            <th className="text-left px-3 py-2 font-medium">Issue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-500/10">
                          {uploadResult.errors
                            .filter((e) => e.code !== 'PRECONDITION_FAILED')
                            .map((e, i) => (
                              <tr key={i} className="text-red-400">
                                <td className="px-3 py-2 font-medium">{e.row}</td>
                                <td className="px-3 py-2 text-red-400/70">{e.column || '—'}</td>
                                <td className="px-3 py-2">{humanizeErrorCode(e.code, e.message)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Job accepted */}
          {uploadResult?.status === 'ok' && uploadResult.data && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="font-semibold text-emerald-400">Import Started</p>
                <StatusBadge status={job?.status ?? uploadResult.data.status} />
              </div>
              <p className="text-sm text-emerald-400/80 mt-1">
                Your {ENTITY_TYPE_LABELS[uploadResult.data.entityType] ?? 'data'} import
                has been queued and is being processed.
              </p>
            </div>
          )}

          {/* Job progress */}
          {job && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Import Progress
                </h3>
                <StatusBadge status={job.status} />
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#737373] mb-1.5">
                  <span>{job.processed_rows} of {job.total_rows} rows processed</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-[#262626] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      job.status === 'FAILED'
                        ? 'bg-red-500'
                        : job.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : 'bg-accent-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <StatPill label="Total" value={job.total_rows} />
                <StatPill label="Processed" value={job.processed_rows} />
                <StatPill label="Succeeded" value={job.success_count} variant="success" />
                <StatPill label="Failed" value={job.failure_count} variant="danger" />
              </div>

              {polling && (
                <div className="flex items-center gap-2 text-xs text-[#737373]">
                  <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse-soft" />
                  Checking for updates...
                </div>
              )}

              {/* Row errors from worker */}
              {job.row_errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-400 mb-2">
                    Issues ({job.row_errors.length})
                  </p>
                  <div className="max-h-64 overflow-y-auto border border-red-500/20 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0">
                        <tr className="bg-red-900/30 text-red-400">
                          <th className="text-left px-3 py-2 font-medium">Row</th>
                          <th className="text-left px-3 py-2 font-medium">Column</th>
                          <th className="text-left px-3 py-2 font-medium">Issue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-500/10">
                        {job.row_errors.map((e, i) => (
                          <tr key={i} className="text-red-400">
                            <td className="px-3 py-2 font-medium">{e.row}</td>
                            <td className="px-3 py-2 text-red-400/70">{e.column || '—'}</td>
                            <td className="px-3 py-2">{humanizeErrorCode(e.code, e.message)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset */}
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start a new import
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Helper ───────────────────────────────────────────────────── */

function StatPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: 'success' | 'danger';
}) {
  const colors =
    variant === 'success'
      ? 'text-emerald-400'
      : variant === 'danger'
        ? 'text-red-400'
        : 'text-white';
  return (
    <div className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-[#737373]">{label}</p>
      <p className={`text-lg font-semibold ${colors}`}>{value}</p>
    </div>
  );
}
