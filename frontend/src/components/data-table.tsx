'use client';

import { useState, useMemo, useEffect } from 'react';
import { useList } from '@/lib/hooks';
import { humanizeApiError } from '@/lib/error-messages';
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  searchable?: boolean;
}

interface DataTableProps<T extends { _id: string }> {
  endpoint: string;
  columns: Column<T>[];
  title: string;
  description?: string;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  /** Increment to trigger a data refetch */
  refreshKey?: number;
}

export function DataTable<T extends { _id: string }>({
  endpoint,
  columns,
  title,
  description,
  emptyMessage = 'No records found.',
  emptyIcon: EmptyIcon = Inbox,
  onCreate,
  onEdit,
  onDelete,
  refreshKey,
}: DataTableProps<T>) {
  const { data, loading, error, refetch } = useList<T>(endpoint);
  const [search, setSearch] = useState('');

  // Refetch data when refreshKey changes (e.g. after mutation)
  useEffect(() => {
    if (refreshKey) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const hasActions = Boolean(onEdit || onDelete);

  // Filter data by search query across searchable columns
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        if (col.searchable === false) return false;
        const val = (row as Record<string, unknown>)[String(col.key)];
        if (val == null) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(q);
        }
        return String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search, columns]);

  /* ── Loading state ──────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title={title} description={description} count={null} />
        <div className="card p-12 flex flex-col items-center gap-3 text-[#737373]">
          <RefreshCw className="w-5 h-5 animate-spin text-accent-500" />
          <p className="text-sm">Loading records...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────── */

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader title={title} description={description} count={null} />
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Failed to load data</p>
            <p className="text-sm text-red-400/70 mt-1">{humanizeApiError(error)}</p>
            <button
              onClick={refetch}
              className="mt-3 text-sm font-medium text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Normal state ───────────────────────────────────────────── */

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title={title} description={description} count={data.length} />
        <div className="flex items-center gap-2">
          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 active:bg-accent-700 transition-colors shadow-lg shadow-accent-500/20"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          )}
        </div>
      </div>

      {/* Search + Table */}
      <div className="card overflow-hidden">
        {/* Search bar */}
        {data.length > 0 && (
          <div className="px-4 py-3 border-b border-[#333]">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all bg-[#1a1a1a] text-white placeholder-[#525252]"
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <EmptyIcon className="w-10 h-10 text-[#525252] mb-3" />
            <p className="text-sm text-[#737373]">{emptyMessage}</p>
            {onCreate && (
              <button
                onClick={onCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create your first record
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <Search className="w-10 h-10 text-[#525252] mb-3" />
            <p className="text-sm text-[#737373]">
              No results for &ldquo;{search}&rdquo;
            </p>
            <button
              onClick={() => setSearch('')}
              className="mt-2 text-sm text-accent-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333] bg-[#1a1a1a]">
                  {columns.map((col, colIdx) => (
                    <th
                      key={colIdx}
                      className="text-left px-4 py-3 font-medium text-[#737373] text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                      {col.header}
                    </th>
                  ))}
                  {hasActions && (
                    <th className="text-right px-4 py-3 font-medium text-[#737373] text-xs uppercase tracking-wider whitespace-nowrap w-24">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filtered.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-[#1f1f1f] transition-colors"
                  >
                    {columns.map((col, colIdx) => {
                      const value = (row as Record<string, unknown>)[String(col.key)];
                      return (
                        <td key={colIdx} className="px-4 py-3 whitespace-nowrap text-[#e5e5e5]">
                          {col.render ? col.render(value, row) : String(value ?? '—')}
                        </td>
                      );
                    })}
                    {hasActions && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded-md hover:bg-[#333] text-[#737373] hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-[#737373] hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with count */}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#333] bg-[#1a1a1a] text-xs text-[#737373]">
            Showing {filtered.length} of {data.length} record{data.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared header sub-component ──────────────────────────────── */

function PageHeader({
  title,
  description,
  count,
}: {
  title: string;
  description?: string;
  count: number | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {count !== null && (
          <span className="text-xs font-medium bg-accent-500/10 text-accent-400 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-[#737373] mt-0.5">{description}</p>
      )}
    </div>
  );
}
