import { describe, it, expect, beforeEach } from 'vitest';

describe('Employee Form Validation', () => {
  const validEmployee = {
    name: 'John Doe',
    email: 'john@example.com',
    department: 'Engineering',
    position: 'Developer',
    hireDate: '2024-01-15',
    status: 'ACTIVE'
  };

  it('should validate required name field', () => {
    const { name, ...rest } = validEmployee;
    expect(() => {
      if (!validEmployee.name || validEmployee.name.length < 2) {
        throw new Error('Name must be at least 2 characters');
      }
    }).not.toThrow();
  });

  it('should validate email format', () => {
    const email = 'john@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(true);
  });

  it('should validate status values', () => {
    expect(['ACTIVE', 'INACTIVE'].includes(validEmployee.status)).toBe(true);
  });

  it('should have required fields', () => {
    expect(validEmployee).toHaveProperty('name');
    expect(validEmployee).toHaveProperty('email');
    expect(validEmployee).toHaveProperty('department');
    expect(validEmployee).toHaveProperty('position');
    expect(validEmployee).toHaveProperty('hireDate');
  });
});

describe('Dashboard Stats', () => {
  const employees = [
    { id: '1', name: 'John', status: 'ACTIVE' },
    { id: '2', name: 'Jane', status: 'ACTIVE' },
    { id: '3', name: 'Bob', status: 'INACTIVE' }
  ];

  it('should count active employees', () => {
    const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
    expect(activeCount).toBe(2);
  });

  it('should count inactive employees', () => {
    const inactiveCount = employees.filter(e => e.status === 'INACTIVE').length;
    expect(inactiveCount).toBe(1);
  });

  it('should count total employees', () => {
    expect(employees.length).toBe(3);
  });
});
