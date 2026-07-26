import express from 'express';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validate.js';
import {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  enrollClass,
  getClassDetail,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  getMyClasses,
  getManagedClasses,
  getClassMembers
} from '../controllers/classController.js';

const router = express.Router();

router.get('/', authenticate, getAllClasses);
router.post('/', authenticate, authorize('admin', 'instructor'), validate(schemas.createClass), createClass);
router.put('/:id', authenticate, authorize('admin', 'instructor'), validate(schemas.updateClass), updateClass);
router.delete('/:id', authenticate, authorize('admin', 'instructor'), deleteClass);
router.get('/my', authenticate, getMyClasses);
router.get('/managed', authenticate, getManagedClasses);
router.get('/:id', authenticate, getClassDetail);
router.post('/:id/enroll', authenticate, enrollClass);

// Materials
router.post('/:id/materials', authenticate, authorize('admin', 'instructor'), validate(schemas.addMaterial), addMaterial);
router.put('/:id/materials/:materialId', authenticate, authorize('admin', 'instructor'), validate(schemas.updateMaterial), updateMaterial);
router.delete('/:id/materials/:materialId', authenticate, authorize('admin', 'instructor'), deleteMaterial);

router.get('/:id/members', authenticate, getClassMembers);

export default router;
