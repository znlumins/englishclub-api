import express from 'express';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { getStats, getPointTransactions } from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/points', authenticate, authorize('admin'), getPointTransactions);

export default router;
