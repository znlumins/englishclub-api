import express from 'express';
import { register, login, me, updateProfile, getLeaderboard } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateProfile);
router.get('/leaderboard', getLeaderboard); // public route or authenticated, let's make it public/authenticated

export default router;
