import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../src/components/Select';

describe('Select Component', () => {
  const options = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' }
  ];

  it('renders select with label', () => {
    render(<Select label="Department" options={options} />);
    expect(screen.getByLabelText('Department')).toBeInTheDocument();
  });

  it('renders options with placeholder', () => {
    render(<Select options={options} placeholder="Select..." />);
    const select = screen.getByRole('combobox');
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('shows first option value when no placeholder', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('combobox')).toHaveValue('engineering');
  });

  it('renders with placeholder', () => {
    render(<Select placeholder="Select department" options={options} />);
    expect(screen.getByText('Select department')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Select error="Required field" options={options} />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('shows error styling when error is present', () => {
    const { container } = render(<Select error="Error" options={options} />);
    const select = container.querySelector('select');
    expect(select).toHaveClass('border-red-500');
  });

  it('calls onChange when selecting', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Select options={options} onChange={handleChange} />);
    await user.selectOptions(screen.getByRole('combobox'), 'engineering');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('accepts value', () => {
    render(<Select value="engineering" options={options} />);
    expect(screen.getByRole('combobox')).toHaveValue('engineering');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select disabled options={options} />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});