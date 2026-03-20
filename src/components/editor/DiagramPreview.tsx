'use client';

import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

interface DiagramPreviewProps {
  source: string;
  diagramType: string;
  errorMessage?: string | null;
}

export default function DiagramPreview({ source, diagramType, errorMessage }: DiagramPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!source || errorMessage) return;

    const renderDiagram = async () => {
      try {
        if (typeof window === 'undefined') return;
        const mermaid = await import('mermaid');
        mermaid.default.initialize({ startOnLoad: false });
        if (containerRef.current) {
          const id = `mermaid-${Date.now()}`;
          const result = await mermaid.default.render(id, source);
          if (typeof window !== 'undefined') {
            containerRef.current.innerHTML = DOMPurify.sanitize(result.svg, {
              USE_PROFILES: { svg: true, svgFilters: true },
            });
          }
        }
      } catch {
        // Silently fail — error is shown via errorMessage prop
      }
    };

    renderDiagram();
  }, [source, diagramType, errorMessage]);

  return (
    <div>
      {errorMessage ? (
        <div data-testid="diagram-error" role="alert">
          {errorMessage}
        </div>
      ) : (
        <div ref={containerRef} />
      )}
    </div>
  );
}
