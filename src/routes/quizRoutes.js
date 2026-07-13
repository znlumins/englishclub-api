import express from 'express';
import { createQuiz, getQuizzesByClass, getQuizById, submitQuiz } from '../controllers/quizController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'instructor'), createQuiz);
router.get('/class/:classId', authenticate, getQuizzesByClass);
router.get('/:id', authenticate, getQuizById);
router.post('/:id/submit', authenticate, submitQuiz);

export default router;
