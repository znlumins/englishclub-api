import express from 'express';
import { createQuiz, updateQuiz, getQuizzesByClass, getQuizById, getQuizScores, submitQuiz, deleteQuiz, resetQuizAttempts, getMyQuizAttempts } from '../controllers/quizController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validate.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'instructor'), validate(schemas.createQuiz), createQuiz);
router.put('/:id', authenticate, authorize('admin', 'instructor'), validate(schemas.updateQuiz), updateQuiz);
router.get('/class/:classId', authenticate, getQuizzesByClass);
router.get('/me/attempts', authenticate, getMyQuizAttempts);
router.get('/:id', authenticate, getQuizById);
router.get('/:id/scores', authenticate, authorize('admin', 'instructor'), getQuizScores);
router.delete('/:id/attempts/:userId', authenticate, authorize('admin', 'instructor'), resetQuizAttempts);
// B-4 (HIGH): body wajib divalidasi — tanpa ini `answers` undefined → TypeError → 500.
router.post('/:id/submit', authenticate, validate(schemas.submitQuiz), submitQuiz);
router.delete('/:id', authenticate, authorize('admin', 'instructor'), deleteQuiz);

export default router;
