'use client';

import { useState } from 'react';
import { submitReport } from '../lib/report';

interface ReportModalProps {
  isOpen: boolean;
  targetId: string;
  targetType: 'movie' | 'comment';
  onClose: () => void;
}

export default function ReportModal({
  isOpen,
  targetId,
  targetType,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await submitReport({
        targetId,
        targetType,
        reason: reason.trim(),
      });
      onClose();
      alert('Report submitted');
    } catch (err) {
      console.error(err);
      alert('Failed to submit report');
    } finally {
      setSubmitting(false);
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Report Content</h2>
        <textarea
          className="w-full border rounded p-2 mb-4"
          placeholder="Describe the issue"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}

