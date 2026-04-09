import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from '../src/components/Input';

describe('Input Component', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Entetr your name')).toBeInTheDocument();
  });

  it('renders with label and type', () => {
    render(<Input label="Email" type="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });
});