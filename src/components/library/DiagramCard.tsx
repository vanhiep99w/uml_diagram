'use client';

import { Diagram } from '@/lib/mock-diagrams';

interface DiagramCardProps {
  diagram: Diagram;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
}

function getRelativeDate(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return 'today';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return new Date(isoDate).toLocaleDateString();
  }
}

export default function DiagramCard({ diagram, onOpen, onDelete, onRename }: DiagramCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when delete or rename button is clicked
    if (
      (e.target as HTMLElement).closest('[data-testid="delete-button"]') ||
      (e.target as HTMLElement).closest('[data-testid="rename-button"]')
    ) {
      return;
    }
    onOpen(diagram.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(diagram.id);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename(diagram.id);
  };

  return (
    <div
      data-testid="diagram-card"
      onClick={handleCardClick}
      className="relative border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow bg-white"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 data-testid="diagram-title" className="font-semibold text-gray-900 truncate">
            {diagram.title}
          </h3>
          <span
            data-testid="diagram-type-badge"
            className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
          >
            {diagram.diagramType}
          </span>
          <p className="mt-2 text-sm text-gray-500">{getRelativeDate(diagram.updatedAt)}</p>
        </div>
        <button
          data-testid="rename-button"
          onClick={handleRenameClick}
          className="ml-2 p-1 text-gray-400 hover:text-blue-500 transition-colors"
          aria-label="Rename diagram"
        >
          ✎
        </button>
        <button
          data-testid="delete-button"
          onClick={handleDeleteClick}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Delete diagram"
        >
          ×
        </button>
      </div>
    </div>
  );
}
