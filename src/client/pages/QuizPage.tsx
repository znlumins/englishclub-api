import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PageBreadcrumb from '../components/PageBreadcrumb';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../api/client';
import type { QuestionOptionsDTO, QuizDetailDTO, SubmitQuizResult } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';

function draftKey(quizId: string) {
  return `quiz-draft:${quizId}`;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitQuizResult | null>(null);
  const draftRestored = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoadError(null);
    setQuiz(null);
    api.get<QuizDetailDTO>(`/quizzes/${id}`).then((res) => {
      if (res.success) {
        setQuiz(res.data);
      } else {
        setLoadError(res.error.message);
      }
    });
  }, [id]);

  // Restore draft answers once quiz loaded
  useEffect(() => {
    if (!quiz || !id || draftRestored.current) return;
    draftRestored.current = true;
    try {
      const raw = localStorage.getItem(draftKey(id));
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        setAnswers(parsed);
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, [quiz, id]);

  // Autosave answers
  useEffect(() => {
    if (!id || !quiz || result) return;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey(id), JSON.stringify(answers));
    }, 400);
    return () => clearTimeout(timer);
  }, [answers, id, quiz, result]);

  const handleSubmit = async () => {
    if (!id || !quiz) return;

    const questions = quiz.questions as QuestionOptionsDTO[];
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      showToast(
        `${unanswered.length} soal belum dijawab. Semua soal harus diisi sebelum dikumpulkan.`,
        'warning',
      );
      return;
    }

    const ok = await confirm({
      title: 'Kumpulkan Jawaban',
      message: `Kirim ${questions.length} jawaban sekarang? Setelah dikumpulkan, jawaban tidak bisa diubah.`,
      confirmText: 'Ya, Kumpulkan',
    });
    if (!ok) return;

    setSubmitting(true);
    const res = await api.post<SubmitQuizResult>(`/quizzes/${id}/submit`, { answers });
    setSubmitting(false);
    if (res.success) {
      localStorage.removeItem(draftKey(id));
      setResult(res.data);
      showToast(res.message ?? 'Kuis berhasil dikumpulkan', 'success');
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (loadError) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <EmptyState icon={<ErrorOutlineIcon />} title="Gagal memuat kuis" description={loadError} />
        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button component={RouterLink} to="/classes" variant="outlined">
            Ke Katalog
          </Button>
          <Button component={RouterLink} to="/dashboard" variant="contained">
            Ke Beranda
          </Button>
        </Box>
      </Box>
    );
  }

  if (!quiz) return <PageLoader />;

  const questions = quiz.questions as QuestionOptionsDTO[];
  const maxAttempt = quiz.max_attempts;
  const attemptCount = quiz.attemptCount ?? 0;
  const isAttemptsExhausted = maxAttempt != null && attemptCount >= maxAttempt;
  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (isAttemptsExhausted) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <EmptyState
          icon={<ErrorOutlineIcon />}
          title="Batas pengerjaan tercapai"
          description={`Kamu sudah mengerjakan kuis ini ${attemptCount}x dari maksimal ${maxAttempt}x yang diizinkan.`}
        />
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button component={RouterLink} to={`/classes/${quiz.classId}`} variant="contained">
            Kembali ke Kelas
          </Button>
        </Box>
      </Box>
    );
  }

  if (result) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', py: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <EmojiEventsIcon color="primary" sx={{ fontSize: 56, mb: 2 }} />
          <Typography variant="h2" sx={{ mb: 1 }}>
            Skor Kamu: {result.score}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {result.correctCount} dari {result.totalQuestions} jawaban benar.
          </Typography>
        </Box>

        {result.results && result.results.length > 0 && (
          <>
            <Typography variant="h3" sx={{ mb: 2 }}>
              Pembahasan
            </Typography>
            <Stack spacing={2} sx={{ mb: 4 }}>
              {result.results.map((r, idx) => (
                <Card
                  key={r.questionId}
                  variant="outlined"
                  sx={{ borderColor: r.isCorrect ? 'success.main' : 'error.main' }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {idx + 1}. {r.question_text}
                    </Typography>
                    <Stack spacing={0.75}>
                      {r.options.map((option) => {
                        const isYourAnswer = option === r.yourAnswer;
                        const isCorrectAnswer = option === r.correctAnswer;
                        return (
                          <Box
                            key={option}
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              borderRadius: 1,
                              bgcolor: isCorrectAnswer ? 'success.light' : isYourAnswer ? 'error.light' : 'transparent',
                              color: isCorrectAnswer ? 'success.dark' : isYourAnswer ? 'error.dark' : 'text.primary',
                              fontWeight: isYourAnswer || isCorrectAnswer ? 600 : 400,
                            }}
                          >
                            {option}
                            {isCorrectAnswer && ' — Jawaban benar'}
                            {isYourAnswer && !isCorrectAnswer && ' — Jawabanmu'}
                          </Box>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}

        <Box sx={{ textAlign: 'center' }}>
          <Button component={RouterLink} to={`/classes/${quiz.classId}`} variant="contained">
            Kembali ke Kelas
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <PageBreadcrumb items={[{ label: quiz.title }]} />

      <Typography variant="h2" sx={{ mb: 1 }}>
        {quiz.title}
      </Typography>

      {maxAttempt != null && (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Maksimal {maxAttempt} kali pengerjaan · Kesempatan ke-{attemptCount + 1}
        </Typography>
      )}

      <Box
        sx={{
          position: 'sticky',
          top: { xs: 64, md: 0 },
          zIndex: 2,
          bgcolor: 'background.default',
          py: 1.5,
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Terjawab {answeredCount} / {questions.length}
          </Typography>
          <Chip
            size="small"
            label={answeredCount === questions.length ? 'Siap dikumpulkan' : 'Belum lengkap'}
            color={answeredCount === questions.length ? 'success' : 'default'}
          />
        </Box>
        <LinearProgress variant="determinate" value={progressPct} sx={{ height: 8, borderRadius: 4 }} />
      </Box>

      <Stack spacing={3}>
        {questions.map((q, idx) => (
          <Card
            key={q.id}
            sx={answers[q.id] ? undefined : { outline: '1px dashed', outlineColor: 'divider' }}
          >
            <CardContent sx={{ p: 3 }}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: 'text.primary', fontWeight: 600, mb: 1.5 }}>
                  {idx + 1}. {q.question_text}
                </FormLabel>
                <RadioGroup
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                >
                  {q.options.map((option) => (
                    <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
                  ))}
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 4 }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Mengirim...' : 'Kumpulkan Jawaban'}
      </Button>
    </Box>
  );
}
