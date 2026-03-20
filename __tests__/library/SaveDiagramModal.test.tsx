import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SaveDiagramModal from '@/components/library/SaveDiagramModal';

describe('SaveDiagramModal', () => {
  it('renders name input', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<SaveDiagramModal onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByTestId('save-name-input')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<SaveDiagramModal onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
  });

  it('Save button disabled when name is empty', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<SaveDiagramModal onSave={onSave} onCancel={onCancel} />);
    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  it('calls onSave with entered name when Save clicked', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<SaveDiagramModal onSave={onSave} onCancel={onCancel} />);
    const input = screen.getByTestId('save-name-input');
    fireEvent.change(input, { target: { value: 'My New Diagram' } });
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onSave).toHaveBeenCalledWith('My New Diagram');
  });

  it('calls onCancel when Cancel clicked', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<SaveDiagramModal onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalled();
  });
});
