'use client';

import { useState } from 'react';
import { DataTable, type Column } from '@/components/data-table';
import { Modal } from '@/components/ui';
import { useMutation } from '@/lib/hooks';
import { humanizeApiError } from '@/lib/error-messages';
import { AlertCircle } from 'lucide-react';

interface CrudPageProps<T extends { _id: string }> {
  endpoint: string;
  columns: Column<T>[];
  title: string;
  description?: string;
  entityLabel: string;
  renderForm: (props: {
    initial: T | null;
    fieldErrors: Record<string, string>;
    onSubmit: (data: unknown) => void;
    loading: boolean;
  }) => React.ReactNode;
  /** If true, the form modal uses the wider variant */
  wide?: boolean;
}

export function CrudPage<T extends { _id: string }>({
  endpoint,
  columns,
  title,
  description,
  entityLabel,
  renderForm,
  wide,
}: CrudPageProps<T>) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const { state, create, update, resetError } = useMutation();

  function openCreate() {
    setEditing(null);
    resetError();
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    resetError();
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(data: unknown) {
    let ok: boolean;
    if (editing) {
      ok = await update(`${endpoint}/${editing._id}`, data);
    } else {
      ok = await create(endpoint, data);
    }
    if (ok) {
      closeForm();
      setRefreshKey((k) => k + 1);
    }
  }

  return (
    <>
      <DataTable<T>
        endpoint={endpoint}
        columns={columns}
        title={title}
        description={description}
        onCreate={openCreate}
        onEdit={openEdit}
        refreshKey={refreshKey}
      />

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Edit ${entityLabel}` : `New ${entityLabel}`}
        wide={wide}
      >
        {state.error && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{humanizeApiError(state.error)}</p>
          </div>
        )}
        <div key={formKey}>
          {renderForm({
            initial: editing,
            fieldErrors: state.fieldErrors,
            onSubmit: handleSubmit,
            loading: state.loading,
          })}
        </div>
      </Modal>
    </>
  );
}
