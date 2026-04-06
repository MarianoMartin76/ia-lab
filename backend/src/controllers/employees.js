import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const employeeController = {
  async getAll(req, res) {
    try {
      const employees = await prisma.employee.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const employee = await prisma.employee.findUnique({
        where: { id }
      });
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, email, department, position, hireDate, status } = req.body;
      
      const existingEmployee = await prisma.employee.findUnique({
        where: { email }
      });
      
      if (existingEmployee) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const employee = await prisma.employee.create({
        data: {
          name,
          email,
          department,
          position,
          hireDate: new Date(hireDate),
          status: status || 'ACTIVE'
        }
      });
      
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, department, position, hireDate, status } = req.body;

      if (email) {
        const existingEmployee = await prisma.employee.findFirst({
          where: { email, NOT: { id } }
        });
        if (existingEmployee) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      const employee = await prisma.employee.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(department && { department }),
          ...(position && { position }),
          ...(hireDate && { hireDate: new Date(hireDate) }),
          ...(status && { status })
        }
      });
      
      res.json(employee);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.employee.delete({
        where: { id }
      });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
};
