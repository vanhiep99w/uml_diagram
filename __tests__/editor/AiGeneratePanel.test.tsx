import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiGeneratePanel from '@/components/editor/AiGeneratePanel';

jest.mock('@/lib/mock-api', () => ({
  mockGenerate: jest.fn((prompt: string, diagramType: string) =>
    Promise.resolve({ source: prompt, diagramType })
  ),
}));

describe('AiGeneratePanel', () => {
  it('renders a text input', () => {
    const onGenerate = jest.fn();
    render(
      <AiGeneratePanel onGenerate={onGenerate} isGenerating={false} />
    );
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders a Generate button', () => {
    const onGenerate = jest.fn();
    render(
      <AiGeneratePanel onGenerate={onGenerate} isGenerating={false} />
    );
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeInTheDocument();
  });

  it('does not call onGenerate when input is empty and Generate is clicked', async () => {
    const onGenerate = jest.fn();
    render(
      <AiGeneratePanel onGenerate={onGenerate} isGenerating={false} />
    );
    const button = screen.getByRole('button', { name: /generate/i });
    // button should be disabled when input is empty
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('calls onGenerate with the input text when Generate is clicked with text', async () => {
    const user = userEvent.setup();
    const onGenerate = jest.fn();
    render(
      <AiGeneratePanel onGenerate={onGenerate} isGenerating={false} />
    );
    const input = screen.getByRole('textbox');
    await user.type(input, 'Create a class diagram for a blog');
    const button = screen.getByRole('button', { name: /generate/i });
    await user.click(button);
    await waitFor(() => expect(onGenerate).toHaveBeenCalledTimes(1));
    expect(onGenerate).toHaveBeenCalledWith('Create a class diagram for a blog', 'Class');
  });

  it('shows loading state (spinner or disabled button) while generating', () => {
    const onGenerate = jest.fn();
    render(
      <AiGeneratePanel onGenerate={onGenerate} isGenerating={true} />
    );
    // Either button is disabled or a spinner is shown
    const button = screen.getByRole('button', { name: /generat/i });
    // The button should be disabled during generation
    expect(button).toBeDisabled();
  });
});
