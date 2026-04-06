import request from 'supertest';
import app from '../src/index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Employee API', () => {
  beforeAll(async () => {
    await prisma.employee.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const validEmployee = {
    name: 'John Doe',
    email: 'john.test@example.com',
    department: 'Engineering',
    position: 'Developer',
    hireDate: '2024-01-15T00:00:00Z',
    status: 'ACTIVE'
  };

  let employeeId;

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send(validEmployee);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(validEmployee.email);
      employeeId = res.body.id;
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send(validEmployee);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Email already exists');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validEmployee, email: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/employees', () => {
    it('should return all employees', async () => {
      const res = await request(app).get('/api/employees');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should return employee by id', async () => {
      const res = await request(app).get(`/api/employees/${employeeId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(employeeId);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app).get('/api/employees/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should update an employee', async () => {
      const res = await request(app)
        .put(`/api/employees/${employeeId}`)
        .send({ name: 'John Updated' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('John Updated');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .put('/api/employees/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should delete an employee', async () => {
      const res = await request(app).delete(`/api/employees/${employeeId}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app).delete('/api/employees/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });
});
