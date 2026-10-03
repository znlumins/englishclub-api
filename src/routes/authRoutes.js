import express from 'express';
import {
  register, login, me, updateProfile, changePassword, getLeaderboard, forgotPassword, resetPassword,
  getPointHistory, getUserBadges,
  getAllUsers, getUserDetail, approveUser, blockUser, updateUserRole, createUser, updateUserByAdmin, adjustUserPoints, deleteUser,
  getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearReadNotifications
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validate.js';

const router = express.Router();

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, validate(schemas.updateProfile), updateProfile);
router.put('/me/password', authenticate, validate(schemas.changePassword), changePassword);
router.get('/me/points', authenticate, getPointHistory);
router.get('/me/badges', authenticate, getUserBadges);
// B-3 (HIGH): leaderboard mem bocorkan PII (full_name, poin, streak, avatar)
// ke internet publik. Wajib autentikasi.
router.get('/leaderboard', authenticate, getLeaderboard);
router.post('/forgot-password', validate(schemas.forgotPassword), forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), resetPassword);

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationRead);
router.put('/notifications/read-all', authenticate, markAllNotificationsRead);
router.delete('/notifications/:id', authenticate, deleteNotification);
router.delete('/notifications/read', authenticate, clearReadNotifications);

// Admin-only routes
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.post('/users', authenticate, authorize('admin'), validate(schemas.createUser), createUser);
router.get('/users/:id', authenticate, authorize('admin'), getUserDetail);
router.put('/users/:id', authenticate, authorize('admin'), validate(schemas.updateUserByAdmin), updateUserByAdmin);
router.put('/users/:id/approve', authenticate, authorize('admin'), approveUser);
router.put('/users/:id/block', authenticate, authorize('admin'), blockUser);
router.put('/users/:id/role', authenticate, authorize('admin'), updateUserRole);
router.put('/users/:id/points', authenticate, authorize('admin'), validate(schemas.adjustPoints), adjustUserPoints);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

export default router;
