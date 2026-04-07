import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../src/components/Input';

describe('Input Component', () => {
  it('renders input with label', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with type attribute', () => {
    render(<Input type="text" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  it('renders password type', () => {
    render(<Input label="Password" type="password" />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('displays error message', () => {
    render(<Input error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('shows error styling when error is present', () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-red-500');
  });

  it('accepts value', () => {
    render(<Input value="test value" />);
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });

  it('accepts placeholder', () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});