import express from 'express';
import { createQuiz, getQuizzesByClass, getQuizById, submitQuiz, deleteQuiz } from '../controllers/quizController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { validate, schemas } from '../middlewares/validate.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'instructor'), validate(schemas.createQuiz), createQuiz);
router.get('/class/:classId', authenticate, getQuizzesByClass);
router.get('/:id', authenticate, getQuizById);
router.post('/:id/submit', authenticate, submitQuiz);
router.delete('/:id', authenticate, authorize('admin', 'instructor'), deleteQuiz);

export default router;
