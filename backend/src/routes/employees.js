import express from 'express';
import { employeeController } from '../controllers/employees.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const employeeValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('hireDate').isISO8601().withMessage('Invalid hire date'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status')
];

router.get('/', employeeController.getAll);
router.get('/:id', param('id').isUUID(), validate, employeeController.getById);
router.post('/', employeeValidation, validate, employeeController.create);
router.put('/:id', param('id').isUUID(), validate, employeeController.update);
router.delete('/:id', param('id').isUUID(), validate, employeeController.delete);

export default router;
export { router as employeeRoutes };
