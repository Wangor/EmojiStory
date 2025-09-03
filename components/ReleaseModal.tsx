'use client';

import { useState } from 'react';

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

export default function ReleaseModal({ isOpen, onClose, onConfirm }: ReleaseModalProps) {
  const [dateTime, setDateTime] = useState<string>(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Publish Movie</h2>
        <label className="block text-sm mb-2" htmlFor="publish-datetime">
          Release Date & Time
        </label>
        <input
          id="publish-datetime"
          type="datetime-local"
          className="w-full border rounded p-2 mb-4"
          value={dateTime}
          onChange={e => setDateTime(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const date = new Date(dateTime);
              onConfirm(date);
            }}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

