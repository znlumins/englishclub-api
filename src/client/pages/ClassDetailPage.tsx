import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import QuizIcon from '@mui/icons-material/Quiz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import type { ClassDetailDTO, QuizListItemDTO, MaterialType } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

const MATERIAL_ICON: Record<MaterialType, React.ReactNode> = {
  link: <LinkIcon />,
  video: <OndemandVideoIcon />,
  pdf: <DescriptionIcon />,
};

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdminOrInstructor } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<ClassDetailDTO | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItemDTO[] | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [detailRes, myClassesRes] = await Promise.all([
      api.get<ClassDetailDTO>(`/classes/${id}`),
      api.get<{ id: string }[]>('/classes/my'),
    ]);
    if (detailRes.success) setDetail(detailRes.data);
    const isEnrolled = myClassesRes.success && myClassesRes.data.some((c) => c.id === id);
    setEnrolled(isEnrolled);

    if (isEnrolled || isAdminOrInstructor) {
      const quizRes = await api.get<QuizListItemDTO[]>(`/quizzes/class/${id}`);
      if (quizRes.success) setQuizzes(quizRes.data);
    } else {
      setQuizzes([]);
    }
  }, [id, isAdminOrInstructor]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async () => {
    if (!id) return;
    setEnrolling(true);
    const res = await api.post(`/classes/${id}/enroll`);
    setEnrolling(false);
    if (res.success) {
      showToast(res.message ?? 'Berhasil mendaftar!', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (!detail) return <PageLoader />;

  const canEnroll = user?.role === 'member' && !enrolled;

  return (
    <Box>
      <Typography variant="overline">Detail Kelas</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="h2">{detail.name}</Typography>
        {enrolled && <Chip label="Terdaftar" color="success" />}
        {canEnroll && (
          <Button variant="contained" onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? 'Memproses...' : 'Enroll Kelas'}
          </Button>
        )}
      </Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Instructor: {detail.instructor?.full_name ?? '-'}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        {detail.description || 'Tidak ada deskripsi.'}
      </Typography>

      <Typography variant="h3" sx={{ mb: 2 }}>
        Materi
      </Typography>
      {detail.materials.length === 0 ? (
        <EmptyState icon={<DescriptionIcon />} title="Belum ada materi" description="Instructor belum menambahkan materi." />
      ) : (
        <Card sx={{ mb: 5 }}>
          <List disablePadding>
            {detail.materials.map((material, idx) => (
              <Box key={material.id}>
                {idx > 0 && <Divider component="li" />}
                <ListItemButton component="a" href={material.url} target="_blank" rel="noopener noreferrer">
                  <ListItemIcon>{MATERIAL_ICON[material.type]}</ListItemIcon>
                  <ListItemText primary={material.title} secondary={material.type.toUpperCase()} />
                  <OpenInNewIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </ListItemButton>
              </Box>
            ))}
          </List>
        </Card>
      )}

      <Typography variant="h3" sx={{ mb: 2 }}>
        Kuis
      </Typography>
      {!enrolled && !isAdminOrInstructor && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Daftar ke kelas ini untuk mengakses kuis.
        </Typography>
      )}
      {quizzes === null && <PageLoader />}
      {quizzes !== null && quizzes.length === 0 && (enrolled || isAdminOrInstructor) && (
        <EmptyState icon={<QuizIcon />} title="Belum ada kuis" description="Instructor belum membuat kuis untuk kelas ini." />
      )}
      {quizzes !== null && quizzes.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
          {quizzes.map((quiz) => {
            const lastAttempt = quiz.attempts[0];
            return (
              <Card key={quiz.id}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {quiz.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {quiz._count.questions} soal
                  </Typography>
                  {lastAttempt && (
                    <Chip
                      label={`Skor terakhir: ${lastAttempt.score}`}
                      size="small"
                      color={lastAttempt.score >= 60 ? 'success' : 'warning'}
                      sx={{ mb: 1.5 }}
                    />
                  )}
                  <Button
                    component={RouterLink}
                    to={`/quiz/${quiz.id}`}
                    endIcon={<ArrowForwardIcon />}
                    fullWidth
                    variant="outlined"
                  >
                    Kerjakan Kuis
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
