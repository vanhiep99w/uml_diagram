import React from 'react';
import { render, screen } from '@testing-library/react';
import DiagramPreview from '@/components/editor/DiagramPreview';

// Mock mermaid so it doesn't try to run in jsdom
jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg>mock</svg>' }),
  run: jest.fn(),
}));

describe('DiagramPreview', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <DiagramPreview source="" diagramType="Mermaid" errorMessage={null} />
    );
    expect(container).toBeTruthy();
  });

  it('shows error message when errorMessage prop is provided', () => {
    render(
      <DiagramPreview
        source="invalid syntax here"
        diagramType="Mermaid"
        errorMessage="Invalid Mermaid syntax"
      />
    );
    expect(screen.getByText(/Invalid Mermaid syntax/i)).toBeInTheDocument();
  });

  it('does not show error message when errorMessage is null', () => {
    render(
      <DiagramPreview
        source="graph TD; A-->B"
        diagramType="Mermaid"
        errorMessage={null}
      />
    );
    expect(screen.queryByText(/syntax/i)).not.toBeInTheDocument();
  });

  it('does not show error message when errorMessage is undefined', () => {
    render(
      <DiagramPreview
        source="graph TD; A-->B"
        diagramType="Mermaid"
        errorMessage={undefined}
      />
    );
    // No error element should be rendered
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
