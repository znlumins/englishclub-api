import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getAllClasses,
  createClass,
  enrollClass,
  getClassDetail,
  addMaterial,
  getMyClasses,
  getManagedClasses,
  getClassMembers
} from '../controllers/classController.js';

const router = express.Router();

router.get('/', authenticate, getAllClasses);
router.post('/', authenticate, createClass);
router.get('/my', authenticate, getMyClasses); // Must be before /:id
router.get('/managed', authenticate, getManagedClasses); // Must be before /:id
router.get('/:id', authenticate, getClassDetail);
router.post('/:id/enroll', authenticate, enrollClass);
router.post('/:id/materials', authenticate, addMaterial);
router.get('/:id/members', authenticate, getClassMembers);

export default router;
