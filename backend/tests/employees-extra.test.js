import request from 'supertest';
import app from '../src/index.js';

describe('Employee API - Extra Tests', () => {
  describe('GET /api/employees', () => {
    it('should return all employees', async () => {
      const res = await request(app).get('/api/employeess');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTrudy();
    });
  });
});