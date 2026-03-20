import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RenameModal from '@/components/library/RenameModal';

describe('RenameModal', () => {
  it('renders pre-filled name input', () => {
    const onRename = jest.fn();
    const onCancel = jest.fn();
    render(
      <RenameModal currentName="Original Name" onRename={onRename} onCancel={onCancel} />
    );
    const input = screen.getByTestId('rename-input') as HTMLInputElement;
    expect(input.value).toBe('Original Name');
  });

  it('Save button disabled when name is empty', () => {
    const onRename = jest.fn();
    const onCancel = jest.fn();
    render(
      <RenameModal currentName="Original Name" onRename={onRename} onCancel={onCancel} />
    );
    const input = screen.getByTestId('rename-input');
    fireEvent.change(input, { target: { value: '' } });
    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  it('calls onRename with new name when Save clicked', () => {
    const onRename = jest.fn();
    const onCancel = jest.fn();
    render(
      <RenameModal currentName="Original Name" onRename={onRename} onCancel={onCancel} />
    );
    const input = screen.getByTestId('rename-input');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByTestId('save-button'));
    expect(onRename).toHaveBeenCalledWith('New Name');
  });
});
