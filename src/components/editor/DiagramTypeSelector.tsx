'use client';

import React from 'react';

const UML_TYPES = [
  'Class',
  'Sequence',
  'Use Case',
  'Activity',
  'Component',
  'State',
  'Deployment',
  'Object',
  'Communication',
  'Timing',
];

interface DiagramTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

export default function DiagramTypeSelector({ value, onChange }: DiagramTypeSelectorProps) {
  return (
    <select
      data-testid="diagram-type-selector"
      aria-label="Diagram type"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {UML_TYPES.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  );
}
