import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DiagramTypeSelector from '@/components/editor/DiagramTypeSelector';

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

describe('DiagramTypeSelector', () => {
  it('renders a select/dropdown element', () => {
    const onChange = jest.fn();
    render(
      <DiagramTypeSelector value="Class" onChange={onChange} />
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('has all 10 UML types as options', () => {
    const onChange = jest.fn();
    render(
      <DiagramTypeSelector value="Class" onChange={onChange} />
    );
    for (const umlType of UML_TYPES) {
      expect(screen.getByRole('option', { name: umlType })).toBeInTheDocument();
    }
  });

  it('fires onChange callback when selection changes', () => {
    const onChange = jest.fn();
    render(
      <DiagramTypeSelector value="Class" onChange={onChange} />
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Sequence' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Sequence');
  });

  it('shows the current value as selected', () => {
    const onChange = jest.fn();
    render(
      <DiagramTypeSelector value="State" onChange={onChange} />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('State');
  });
});
