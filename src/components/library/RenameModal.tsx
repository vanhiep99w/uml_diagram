'use client';

import { useState, useEffect } from 'react';

interface RenameModalProps {
  currentName: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

export default function RenameModal({ currentName, onRename, onCancel }: RenameModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSave = () => {
    if (name.trim()) {
      onRename(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-modal-title"
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <h2 id="rename-modal-title" className="text-lg font-semibold text-gray-900 mb-4">Rename Diagram</h2>
        <div className="mb-4">
          <label htmlFor="rename-name" className="block text-sm font-medium text-gray-700 mb-1">
            Diagram Name
          </label>
          <input
            id="rename-name"
            data-testid="rename-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            data-testid="cancel-button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            data-testid="save-button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
