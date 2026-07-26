import express from 'express';
import {
  register, login, me, updateProfile, getLeaderboard,
  getAllUsers, approveUser, rejectUser
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validate.js';

const router = express.Router();

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, validate(schemas.updateProfile), updateProfile);
router.get('/leaderboard', getLeaderboard);

// Admin-only routes
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.put('/users/:id/approve', authenticate, authorize('admin'), approveUser);
router.put('/users/:id/reject', authenticate, authorize('admin'), rejectUser);

export default router;
