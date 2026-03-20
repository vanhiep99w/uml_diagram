'use client';

import React, { useState } from 'react';
import { mockGenerate } from '@/lib/mock-api';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AiGeneratePanelProps {
  onGenerate: (promptOrSource: string, diagramType?: string) => void;
  isGenerating: boolean;
  diagramType?: string;
  onRefine?: (prompt: string, currentSource: string) => void;
}

export default function AiGeneratePanel({
  onGenerate,
  isGenerating,
  diagramType = 'Class',
  onRefine,
}: AiGeneratePanelProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    const userPrompt = prompt;
    setPrompt('');
    setMessages((prev) => [...prev, { role: 'user', content: userPrompt }]);

    try {
      const result = await mockGenerate(userPrompt, diagramType);
      onGenerate(result.source, result.diagramType);
    } catch {
      // Silently handle mock errors
    }
  };

  const isDisabled = !prompt.trim() || isGenerating;

  return (
    <div>
      <textarea
        data-testid="ai-prompt-input"
        aria-label="Describe your diagram"
        placeholder="Describe your diagram..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />
      <button
        data-testid="generate-button"
        onClick={handleGenerate}
        disabled={isDisabled}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>

      {messages.length > 0 && (
        <div data-testid="chat-thread">
          {messages.map((msg, i) => (
            <div key={i} data-role={msg.role}>
              {msg.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
