'use client';

import { useState } from 'react';
import { Modal } from './modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handled by caller
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3 mb-6">
        {danger && (
          <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
        )}
        <p className="text-sm text-[#a3a3a3] pt-2">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 border border-[#333] rounded-lg text-sm font-medium text-[#a3a3a3] hover:bg-[#242424] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
            danger
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-accent-500 hover:bg-accent-600'
          }`}
        >
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
