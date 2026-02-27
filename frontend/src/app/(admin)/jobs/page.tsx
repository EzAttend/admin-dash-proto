'use client';

import { useState, useCallback } from 'react';
import { DataTable, type Column } from '@/components/data-table';
import { Modal } from '@/components/ui';
import { StatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api-client';
import {
  humanizeErrorCode,
  ENTITY_TYPE_LABELS,
} from '@/lib/error-messages';
import type { UploadJobEntity, ApiResponse } from '@/lib/types';
import {
  Download,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';

/* ─── Error table inside job detail ────────────────────────────── */

function ErrorTable({ errors }: { errors: UploadJobEntity['row_errors'] }) {
  if (errors.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-sm text-[#737373]">No issues found</p>
      </div>
    );
  }

  return (
    <div className="border border-red-500/20 rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-red-900/30">
              <th className="text-left px-3 py-2 font-medium text-red-400">Row</th>
              <th className="text-left px-3 py-2 font-medium text-red-400">Column</th>
              <th className="text-left px-3 py-2 font-medium text-red-400">Issue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-500/10">
            {errors.map((err, i) => (
              <tr key={i} className="text-red-400 table-row-hover">
                <td className="px-3 py-2 font-medium">{err.row}</td>
                <td className="px-3 py-2 text-red-400/70">{err.column}</td>
                <td className="px-3 py-2">{humanizeErrorCode(err.code, err.message)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── CSV download helper ──────────────────────────────────────── */

function downloadErrorsCsv(job: UploadJobEntity): void {
  const header = 'row,column,code,message';
  const rows = job.row_errors.map(
    (e) =>
      `${e.row},"${e.column}","${e.code}","${e.message.replace(/"/g, '""')}"`,
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `errors-${job._id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Columns ──────────────────────────────────────────────────── */

const columns: Column<UploadJobEntity>[] = [
  {
    key: 'entity_type',
    header: 'Type',
    render: (v) => (
      <span className="font-medium text-white">
        {ENTITY_TYPE_LABELS[v as string] ?? (v as string)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (v) => <StatusBadge status={v as string} />,
  },
  {
    key: 'total_rows',
    header: 'Rows',
    render: (_v, row) => (
      <span className="text-[#a3a3a3]">
        {row.processed_rows}/{row.total_rows}
      </span>
    ),
  },
  {
    key: 'success_count',
    header: 'Succeeded',
    render: (v) => (
      <span className="text-emerald-400 font-medium">{v as number}</span>
    ),
  },
  {
    key: 'failure_count',
    header: 'Failed',
    render: (v) => {
      const n = v as number;
      return (
        <span className={n > 0 ? 'text-red-400 font-medium' : 'text-[#525252]'}>
          {n}
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (v) => {
      const d = new Date(v as string);
      return (
        <span className="text-[#737373] text-xs">
          {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      );
    },
  },
];

/* ─── Page ─────────────────────────────────────────────────────── */

export default function JobsPage() {
  const [selected, setSelected] = useState<UploadJobEntity | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = useCallback(async (row: UploadJobEntity) => {
    setDetailLoading(true);
    setSelected(row);
    try {
      const res = await api.get<ApiResponse<UploadJobEntity>>(`/jobs/${row._id}`);
      setSelected(res.data);
    } catch {
      // Fall back to list row data
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return (
    <>
      <DataTable<UploadJobEntity>
        endpoint="/jobs"
        columns={columns}
        title="Import Jobs"
        description="Track the progress and results of CSV imports"
        emptyMessage="No import jobs yet. Upload a CSV file to get started."
        emptyIcon={ClipboardList}
        onEdit={openDetail}
      />

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Import Job Details"
        wide
      >
        {selected && (
          <div className="space-y-5">
            {/* Status banner */}
            <div
              className={`rounded-lg p-4 flex items-center gap-3 ${
                selected.status === 'COMPLETED'
                  ? 'bg-emerald-900/20 border border-emerald-500/30'
                  : selected.status === 'FAILED'
                    ? 'bg-red-900/20 border border-red-500/30'
                    : selected.status === 'RUNNING'
                      ? 'bg-accent-500/10 border border-accent-500/30'
                      : 'bg-amber-500/10 border border-amber-500/30'
              }`}
            >
              {selected.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : selected.status === 'FAILED' ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <RefreshCw className={`w-5 h-5 text-accent-400 ${selected.status === 'RUNNING' ? 'animate-spin' : ''}`} />
              )}
              <div>
                <p className="text-sm font-semibold text-white">
                  {ENTITY_TYPE_LABELS[selected.entity_type] ?? selected.entity_type} Import
                </p>
                <p className="text-xs text-[#a3a3a3]">
                  {selected.status === 'COMPLETED'
                    ? `Finished on ${new Date(selected.completed_at ?? selected.updatedAt).toLocaleString()}`
                    : selected.status === 'RUNNING'
                      ? 'Currently processing...'
                      : selected.status === 'FAILED'
                        ? 'Import encountered errors'
                        : 'Waiting to be processed'}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total Rows', value: selected.total_rows },
                { label: 'Processed', value: selected.processed_rows },
                { label: 'Succeeded', value: selected.success_count, color: 'text-emerald-400' },
                { label: 'Failed', value: selected.failure_count, color: selected.failure_count > 0 ? 'text-red-400' : undefined },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#1a1a1a] rounded-lg px-3 py-2.5 text-center">
                  <p className="text-xs text-[#737373]">{stat.label}</p>
                  <p className={`text-lg font-semibold ${stat.color ?? 'text-white'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress bar for in-progress jobs */}
            {(selected.status === 'RUNNING' || selected.status === 'PENDING') && (
              <div>
                <div className="flex items-center justify-between text-xs text-[#737373] mb-1">
                  <span>Progress</span>
                  <span>
                    {selected.total_rows > 0
                      ? Math.round((selected.processed_rows / selected.total_rows) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-[#262626] rounded-full h-2">
                  <div
                    className="bg-accent-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        selected.total_rows > 0
                          ? Math.round((selected.processed_rows / selected.total_rows) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Errors section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#a3a3a3]">
                  Issues ({selected.row_errors?.length ?? 0})
                </h4>
                {selected.row_errors && selected.row_errors.length > 0 && (
                  <button
                    onClick={() => downloadErrorsCsv(selected)}
                    className="inline-flex items-center gap-1 text-xs text-[#737373] hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download CSV
                  </button>
                )}
              </div>
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 text-[#525252] text-sm py-6">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading details...
                </div>
              ) : (
                <ErrorTable errors={selected.row_errors ?? []} />
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
