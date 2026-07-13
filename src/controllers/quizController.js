import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Quiz (Instructor/Admin)
export const createQuiz = async (req, res) => {
  try {
    const { classId, title, questions } = req.body;
    // questions should be an array of objects: { question_text, options: [], correct_answer }

    // Validate class
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return res.status(404).json({ success: false, error: { message: 'Class not found' } });
    if (cls.instructorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        classId,
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

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to create quiz' } });
  }
};

// Get Quizzes by Class (Member)
export const getQuizzesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Check enrollment if member
    if (req.user.role === 'member') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_classId: { userId: req.user.id, classId } }
      });
      if (!enrollment) {
        return res.status(403).json({ success: false, error: { message: 'Not enrolled in this class' } });
      }
    }

    const quizzes = await prisma.quiz.findMany({
      where: { classId },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { userId: req.user.id },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch quizzes' } });
  }
};

// Get single quiz with questions
export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true }
    });

    if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz not found' } });

    // Parse options back to array, but omit correct_answer for members!
    const questions = quiz.questions.map(q => {
      const parsedOptions = JSON.parse(q.options);
      if (req.user.role === 'member') {
        return {
          id: q.id,
          question_text: q.question_text,
          options: parsedOptions
        };
      }
      return {
        ...q,
        options: parsedOptions
      };
    });

    res.json({ success: true, data: { ...quiz, questions } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch quiz' } });
  }
};

// Submit Quiz Attempt
export const submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // { "questionId1": "Option A", "questionId2": "Option B" }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true }
    });

    if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz not found' } });

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100) || 0;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        userId: req.user.id,
        score
      }
    });

    // Gamification bonus for doing a quiz
    await prisma.user.update({
      where: { id: req.user.id },
      data: { points: { increment: 20 } }
    });

    res.json({ success: true, data: attempt, message: `You scored ${score} out of 100` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Failed to submit quiz' } });
  }
};
