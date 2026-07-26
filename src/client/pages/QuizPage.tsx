import { useEffect, useState } from 'react';
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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import type { QuestionOptionsDTO, QuizDetailDTO, SubmitQuizResult } from '../api/types';
import PageLoader from '../components/PageLoader';

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [quiz, setQuiz] = useState<QuizDetailDTO | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitQuizResult | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<QuizDetailDTO>(`/quizzes/${id}`).then((res) => {
      if (res.success) setQuiz(res.data);
    });
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    const res = await api.post<SubmitQuizResult>(`/quizzes/${id}/submit`, { answers });
    setSubmitting(false);
    if (res.success) {
      setResult(res.data);
      showToast(res.message ?? 'Kuis berhasil dikumpulkan', 'success');
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (!quiz) return <PageLoader />;

  const questions = quiz.questions as QuestionOptionsDTO[];

  if (result) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', textAlign: 'center', py: 6 }}>
        <EmojiEventsIcon color="primary" sx={{ fontSize: 56, mb: 2 }} />
        <Typography variant="h2" sx={{ mb: 1 }}>
          Skor Kamu: {result.score}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          {result.correctCount} dari {result.totalQuestions} jawaban benar.
        </Typography>
        <Button component={RouterLink} to={`/classes/${quiz.classId}`} variant="contained">
          Kembali ke Kelas
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="overline">Kuis</Typography>
      <Typography variant="h2" sx={{ mb: 4 }}>
        {quiz.title}
      </Typography>

      <Stack spacing={3}>
        {questions.map((q, idx) => (
          <Card key={q.id}>
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
