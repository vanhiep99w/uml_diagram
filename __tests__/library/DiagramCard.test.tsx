import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DiagramCard from '@/components/library/DiagramCard';

const mockDiagram = {
  id: 'test-id-1',
  title: 'My Test Diagram',
  diagramType: 'Class',
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
};

describe('DiagramCard', () => {
  it('renders diagram title', () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const onRename = jest.fn();
    render(
      <DiagramCard diagram={mockDiagram} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
    );
    expect(screen.getByTestId('diagram-title')).toHaveTextContent('My Test Diagram');
  });

  it('renders diagramType badge', () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const onRename = jest.fn();
    render(
      <DiagramCard diagram={mockDiagram} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
    );
    expect(screen.getByTestId('diagram-type-badge')).toHaveTextContent('Class');
  });

  it('renders relative date (shows "ago" somewhere)', () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const onRename = jest.fn();
    render(
      <DiagramCard diagram={mockDiagram} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
    );
    expect(screen.getByTestId('diagram-card')).toHaveTextContent(/ago/i);
  });

  it('clicking card calls onOpen with diagram id', () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const onRename = jest.fn();
    render(
      <DiagramCard diagram={mockDiagram} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
    );
    fireEvent.click(screen.getByTestId('diagram-card'));
    expect(onOpen).toHaveBeenCalledWith('test-id-1');
  });

  it('clicking delete button calls onDelete with diagram id', () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const onRename = jest.fn();
    render(
      <DiagramCard diagram={mockDiagram} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
    );
    fireEvent.click(screen.getByTestId('delete-button'));
    expect(onDelete).toHaveBeenCalledWith('test-id-1');
  });

  it('clicking rename button calls onRename with diagram id', () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const onRename = jest.fn();
    render(
      <DiagramCard diagram={mockDiagram} onOpen={onOpen} onDelete={onDelete} onRename={onRename} />
    );
    fireEvent.click(screen.getByTestId('rename-button'));
    expect(onRename).toHaveBeenCalledWith('test-id-1');
  });
});
