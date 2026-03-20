'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MonacoEditor({ value, onChange }: MonacoEditorProps) {
  return (
    <Editor
      height="100%"
      language="plaintext"
      value={value}
      onChange={(val) => onChange(val ?? '')}
      options={{
        minimap: { enabled: false },
        wordWrap: 'on',
      }}
    />
  );
}
