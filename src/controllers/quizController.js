import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler.js';

const prisma = new PrismaClient();

// Create Quiz (Instructor/Admin)
export const createQuiz = asyncHandler(async (req, res) => {
  const { classId, title, questions } = req.body;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  if (cls.instructorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title, classId,
      questions: {
        create: questions.map(q => ({
          question_text: q.question_text,
          options: JSON.stringify(q.options),
          correct_answer: q.correct_answer
        }))
      }
    },
    include: { questions: true }
  });

  res.status(201).json({ success: true, data: quiz, message: 'Quiz berhasil dibuat' });
});

// Delete Quiz
export const deleteQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { class: true }
  });

  if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz tidak ditemukan' } });

  if (req.user.role === 'instructor' && quiz.class.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  await prisma.quizAttempt.deleteMany({ where: { quizId: id } });
  await prisma.question.deleteMany({ where: { quizId: id } });
  await prisma.quiz.delete({ where: { id } });

  res.json({ success: true, message: 'Quiz berhasil dihapus' });
});

// Get Quizzes by Class (Member)
export const getQuizzesByClass = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  if (!userId || !userRole) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const { classId } = req.params;

  if (userRole === 'member') {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_classId: { userId, classId } }
    });
    if (!enrollment) {
      return res.status(403).json({ success: false, error: { message: 'Anda tidak terdaftar di kelas ini' } });
    }
  }

  const quizzes = await prisma.quiz.findMany({
    where: { classId },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { userId },
        orderBy: { created_at: 'desc' },
        take: 1
      }
    }
  });

  // Hitung total attempt count semua quiz sekaligus (1 query, bukan N query)
  const quizIds = quizzes.map((q) => q.id);
  const attemptCounts = await prisma.quizAttempt.groupBy({
    by: ['quizId'],
    where: { userId, quizId: { in: quizIds } },
    _count: { id: true },
  });

  const attemptCountMap = Object.fromEntries(
    attemptCounts.map((entry) => [entry.quizId, entry._count.id])
  );

  const quizzesWithCount = quizzes.map((quiz) => ({
    ...quiz,
    attemptCount: attemptCountMap[quiz.id] ?? 0,
  }));

  res.json({ success: true, data: quizzesWithCount });
});

// Get single quiz with questions
export const getQuizById = asyncHandler(async (req, res) => {
  const userRole = req.user?.role;
  if (!req.user?.id || !userRole) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true }
  });

  if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz tidak ditemukan' } });

  const questions = quiz.questions.map(q => {
    const parsedOptions = JSON.parse(q.options);
    if (userRole === 'member') {
      return {
        id: q.id, question_text: q.question_text, options: parsedOptions
      };
    }
    return { ...q, options: parsedOptions };
  });

  res.json({ success: true, data: { ...quiz, questions } });
});

// Submit Quiz Attempt
export const submitQuiz = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  if (!userId || !userRole) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const { id } = req.params;
  const { answers } = req.body;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true }
  });

  if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz tidak ditemukan' } });

  let correctCount = 0;
  const totalQuestions = quiz.questions.length;

  quiz.questions.forEach(q => {
    if (answers[q.id] === q.correct_answer) {
      correctCount++;
    }
  });

  const score = Math.round((correctCount / totalQuestions) * 100) || 0;

  const previousAttemptCount = await prisma.quizAttempt.count({
    where: { quizId: id, userId }
  });
  const isFirstAttempt = previousAttemptCount === 0;

  await prisma.quizAttempt.create({
    data: { quizId: id, userId, score }
  });

  // Gamification: +20 points hanya untuk attempt pertama, cegah numpuk poin dari submit berulang
  if (isFirstAttempt) {
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 20 } }
    });
  }

  res.json({
    success: true,
    data: { score, correctCount, totalQuestions },
    message: isFirstAttempt
      ? `Skor Anda: ${score} (${correctCount}/${totalQuestions} benar)`
      : `Skor Anda: ${score} (${correctCount}/${totalQuestions} benar). Attempt ulang tidak menambah poin.`
  });
});
