import prisma from '../utils/prisma.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { createNotificationForMany } from '../utils/notifications.js';
import { checkQuizMasterBadge, checkTop10Badge } from '../utils/badges.js';


// Create Quiz (Instructor/Admin)
export const createQuiz = asyncHandler(async (req, res) => {
  const { classId, title, questions, max_attempts } = req.body;

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
  if (cls.instructorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title, classId,
      max_attempts: max_attempts ?? 3,
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

  const enrolledUserIds = (
    await prisma.enrollment.findMany({ where: { classId }, select: { userId: true } })
  ).map((e) => e.userId);

  await createNotificationForMany(enrolledUserIds, {
    type: 'new_quiz',
    message: `Kuis baru "${quiz.title}" tersedia di kelas "${cls.name}"`,
    link: `/quiz/${quiz.id}`
  });

  res.status(201).json({ success: true, data: quiz, message: 'Quiz berhasil dibuat' });
});

// Update Quiz (edit title/max_attempts, & opsional ganti seluruh soal)
export const updateQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, questions, max_attempts } = req.body;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { class: true }
  });

  if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz tidak ditemukan' } });
  if (req.user.role === 'instructor' && quiz.class.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  let updated;
  if (questions !== undefined) {
    // Hapus soal lama & buat baru dalam 1 transaksi untuk keamanan data.
    // Index [1] karena hasil $transaction urut sesuai array input: [deleteMany, quizUpdate].
    const results = await prisma.$transaction([
      prisma.question.deleteMany({ where: { quizId: id } }),
      prisma.quiz.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(max_attempts !== undefined && { max_attempts }),
          questions: {
            create: questions.map(q => ({
              question_text: q.question_text,
              options: JSON.stringify(q.options),
              correct_answer: q.correct_answer
            }))
          }
        },
        include: { questions: true }
      })
    ]);
    updated = results[1];
  } else {
    // Sesuai skema validasi, `questions` boleh diomit untuk update title/max_attempts saja
    // tanpa menyentuh soal yang sudah ada.
    updated = await prisma.quiz.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(max_attempts !== undefined && { max_attempts })
      },
      include: { questions: true }
    });
  }

  res.json({ success: true, data: updated, message: 'Quiz berhasil diperbarui' });
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

  if (userRole === 'instructor') {
    const cls = await prisma.class.findUnique({ where: { id: classId }, select: { instructorId: true } });
    if (!cls) return res.status(404).json({ success: false, error: { message: 'Kelas tidak ditemukan' } });
    if (cls.instructorId !== userId) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
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

// Riwayat semua attempt kuis milik user yang login sendiri, lintas kelas/kuis (untuk ProfilePage)
export const getMyQuizAttempts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      quiz: { select: { id: true, title: true, class: { select: { id: true, name: true } } } }
    }
  });

  const data = attempts.map((a) => ({
    id: a.id,
    score: a.score,
    created_at: a.created_at,
    quizId: a.quiz.id,
    quizTitle: a.quiz.title,
    classId: a.quiz.class.id,
    className: a.quiz.class.name
  }));

  res.json({ success: true, data });
});

// Reset (hapus) semua attempt seorang user pada quiz — agar bisa mengerjakan ulang dari awal
export const resetQuizAttempts = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { class: true }
  });

  if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz tidak ditemukan' } });

  if (req.user.role === 'instructor' && quiz.class.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const { count } = await prisma.quizAttempt.deleteMany({ where: { quizId: id, userId } });
  if (count === 0) {
    return res.status(404).json({ success: false, error: { message: 'Tidak ada attempt user ini untuk dihapus' } });
  }

  res.json({ success: true, message: `${count} attempt berhasil dihapus. User dapat mengerjakan ulang kuis ini.` });
});

// Get Quiz Scores (Instructor/Admin)
export const getQuizScores = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { class: true }
  });

  if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz tidak ditemukan' } });

  if (req.user.role === 'instructor' && quiz.class.instructorId !== req.user.id) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: id },
    include: {
      user: { select: { id: true, full_name: true, nim: true } }
    },
    orderBy: { score: 'desc' }
  });

  const scores = attempts.map(a => ({
    userId: a.userId,
    full_name: a.user.full_name,
    nim: a.user.nim,
    score: a.score,
    submitted_at: a.created_at
  }));

  res.json({ success: true, data: { quizTitle: quiz.title, scores } });
});

// Get single quiz with questions
export const getQuizById = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  if (!userId || !userRole) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true, class: true }
  });

  if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz tidak ditemukan' } });

  if (userRole === 'member') {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_classId: { userId, classId: quiz.classId } }
    });
    if (!enrollment) {
      return res.status(403).json({ success: false, error: { message: 'Anda tidak terdaftar di kelas ini' } });
    }
  }

  if (userRole === 'instructor' && quiz.class.instructorId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden. Bukan kelas Anda.' } });
  }

  const questions = quiz.questions.map(q => {
    const parsedOptions = JSON.parse(q.options);
    if (userRole === 'member') {
      return {
        id: q.id, question_text: q.question_text, options: parsedOptions
      };
    }
    return { ...q, options: parsedOptions };
  });

  const attemptCount = await prisma.quizAttempt.count({ where: { quizId: id, userId } });

  res.json({
    success: true,
    data: { id: quiz.id, title: quiz.title, classId: quiz.classId, max_attempts: quiz.max_attempts, attemptCount, questions }
  });
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

  // B-10 (MEDIUM): hanya member yang mengerjakan kuis. Instructor/admin mengelola
  // kuis (create/edit/delete/scores), bukan mengerjakannya. Tanpa gate ini mereka
  // bisa submit semua kuis di platform → farming +20 poin + mencemari skor mereka.
  if (userRole !== 'member') {
    return res.status(403).json({
      success: false,
      error: { message: 'Hanya member yang dapat mengerjakan kuis.' }
    });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_classId: { userId, classId: quiz.classId } }
  });
  if (!enrollment) {
    return res.status(403).json({ success: false, error: { message: 'Anda tidak terdaftar di kelas ini' } });
  }

  const totalQuestions = quiz.questions.length;

  const results = quiz.questions.map((q) => {
    const yourAnswer = answers[q.id] ?? null;
    const isCorrect = yourAnswer === q.correct_answer;
    return {
      questionId: q.id,
      question_text: q.question_text,
      options: JSON.parse(q.options),
      yourAnswer,
      correctAnswer: q.correct_answer,
      isCorrect
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correctCount / totalQuestions) * 100) || 0;

  // Cek batas attempt & simpan attempt dalam satu transaction serializable, supaya submit
  // paralel (double-click, multi-tab) tidak bisa melewati max_attempts atau dapat bonus 2x.
  let isFirstAttempt;
  try {
    isFirstAttempt = await prisma.$transaction(async (tx) => {
      const currentAttemptCount = await tx.quizAttempt.count({ where: { quizId: id, userId } });

      if (quiz.max_attempts !== null && currentAttemptCount >= quiz.max_attempts) {
        const limitError = new Error(`Batas pengerjaan kuis tercapai (maksimal ${quiz.max_attempts} kali).`);
        limitError.status = 403;
        throw limitError;
      }

      await tx.quizAttempt.create({ data: { quizId: id, userId, score } });

      const firstAttempt = currentAttemptCount === 0;
      if (firstAttempt) {
        await tx.user.update({ where: { id: userId }, data: { points: { increment: 20 } } });
        await tx.pointTransaction.create({
          data: { userId, type: 'quiz', amount: 20, description: `Submit kuis "${quiz.title}"` }
        });
      }

      return firstAttempt;
    }, { isolationLevel: 'Serializable' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, error: { message: err.message } });
    }
    throw err;
  }

  if (isFirstAttempt) {
    await checkTop10Badge(userId);
  }

  await checkQuizMasterBadge(userId);

  res.json({
    success: true,
    data: { score, correctCount, totalQuestions, results },
    message: isFirstAttempt
      ? `Skor Anda: ${score} (${correctCount}/${totalQuestions} benar)`
      : `Skor Anda: ${score} (${correctCount}/${totalQuestions} benar). Attempt ulang tidak menambah poin.`
  });
});
