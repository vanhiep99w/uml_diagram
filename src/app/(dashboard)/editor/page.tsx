'use client';

import React, { useState } from 'react';
import AiGeneratePanel from '@/components/editor/AiGeneratePanel';
import DiagramPreview from '@/components/editor/DiagramPreview';
import DiagramTypeSelector from '@/components/editor/DiagramTypeSelector';
import MonacoEditor from '@/components/editor/MonacoEditor';

export default function EditorPage() {
  const [source, setSource] = useState('');
  const [diagramType, setDiagramType] = useState('Class');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (source: string, diagramType: string) => {
    setIsGenerating(true);
    try {
      setSource(source);
      setDiagramType(diagramType);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#f5f5f5', zIndex: 10 }}>
        <DiagramTypeSelector value={diagramType} onChange={setDiagramType} />
        <button
          disabled
          title="Save (coming soon — requires diagram service)"
        >
          Save
        </button>
      </div>

      {/* Left panel — AI Generate */}
      <div style={{ width: 340, paddingTop: 48 }}>
        <AiGeneratePanel
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          diagramType={diagramType}
        />
      </div>

      {/* Center panel — Diagram Preview */}
      <div style={{ flex: 1, paddingTop: 48 }}>
        <DiagramPreview source={source} diagramType={diagramType} errorMessage={error} />
      </div>

      {/* Right panel — Monaco Editor */}
      <div style={{ width: 420, paddingTop: 48 }}>
        <MonacoEditor value={source} onChange={setSource} />
      </div>
    </div>
  );
}
