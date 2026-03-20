'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Diagram, getMockDiagrams, deleteMockDiagram, renameMockDiagram } from '@/lib/mock-diagrams';
import DiagramCard from '@/components/library/DiagramCard';
import RenameModal from '@/components/library/RenameModal';

export default function LibraryPage() {
  const router = useRouter();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Diagram | null>(null);

  useEffect(() => {
    setDiagrams(getMockDiagrams());
  }, []);

  useEffect(() => {
    if (!deleteConfirmId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteConfirmId(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [deleteConfirmId]);

  const handleOpen = (id: string) => {
    router.push(`/editor/${id}`);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      // Optimistic UI: remove from local state immediately
      setDiagrams((prev) => prev.filter((d) => d.id !== deleteConfirmId));
      deleteMockDiagram(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const handleRenameRequest = (id: string) => {
    const diagram = diagrams.find((d) => d.id === id);
    if (diagram) {
      setRenameTarget(diagram);
    }
  };

  const handleRenameConfirm = (newName: string) => {
    if (renameTarget) {
      setDiagrams((prev) =>
        prev.map((d) => (d.id === renameTarget.id ? { ...d, title: newName } : d))
      );
      renameMockDiagram(renameTarget.id, newName);
      setRenameTarget(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Diagrams</h1>

      {diagrams.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            No diagrams yet. Create your first diagram!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {diagrams.map((diagram) => (
            <DiagramCard
              key={diagram.id}
              diagram={diagram}
              onOpen={handleOpen}
              onDelete={handleDeleteRequest}
              onRename={handleRenameRequest}
            />
          ))}
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"
          >
            <h2 id="delete-confirm-title" className="text-lg font-semibold text-gray-900 mb-2">Delete Diagram</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this diagram? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm text-gray-700 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <RenameModal
          currentName={renameTarget.title}
          onRename={handleRenameConfirm}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
}
