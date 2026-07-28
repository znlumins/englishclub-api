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
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import QuizIcon from '@mui/icons-material/Quiz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageBreadcrumb from '../components/PageBreadcrumb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import type { ClassDetailDTO, QuizListItemDTO, MaterialType } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

const MATERIAL_ICON: Partial<Record<MaterialType, React.ReactNode>> = {
  link: <LinkIcon />,
  video: <OndemandVideoIcon />,
  pdf: <DescriptionIcon />,
};

const FALLBACK_MATERIAL_ICON = <DescriptionIcon />;

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
      <PageBreadcrumb items={[{ label: detail.name }]} />

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
      ) : !enrolled && !isAdminOrInstructor ? (
        <Card sx={{ mb: 5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Kelas ini memiliki <strong>{detail.materials.length} materi</strong>. Daftar untuk mengakses:
            </Typography>
            <List disablePadding>
              {detail.materials.map((material, idx) => (
                <Box key={material.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>{MATERIAL_ICON[material.type] ?? FALLBACK_MATERIAL_ICON}</ListItemIcon>
                    <ListItemText
                      primary={material.title}
                      secondary={material.type.toUpperCase()}
                      slotProps={{
                        primary: { variant: 'body2', color: 'text.secondary' },
                        secondary: { variant: 'caption' },
                      }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
            <Button
              variant="contained"
              onClick={handleEnroll}
              disabled={enrolling}
              sx={{ mt: 2 }}
            >
              {enrolling ? 'Memproses...' : 'Enroll untuk Akses Materi'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 5 }}>
          <List disablePadding>
            {detail.materials.map((material, idx) => (
              <Box key={material.id}>
                {idx > 0 && <Divider component="li" />}
                <ListItemButton component="a" href={material.url} target="_blank" rel="noopener noreferrer">
                  <ListItemIcon>{MATERIAL_ICON[material.type] ?? FALLBACK_MATERIAL_ICON}</ListItemIcon>
                  <ListItemText
                    primary={material.title}
                    secondary={material.type.toUpperCase()}
                    slotProps={{
                      primary: { variant: 'body2' },
                      secondary: { variant: 'caption' },
                    }}
                  />
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
            const attemptCount = quiz.attemptCount ?? 0;
            const attemptLabel = attemptCount === 1 ? '1 kali dikerjakan' : `${attemptCount} kali dikerjakan`;
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
                    <Box sx={{ mb: 1.5 }}>
                      <Chip
                        label={`Skor terakhir: ${lastAttempt.score}`}
                        size="small"
                        color={lastAttempt.score >= 60 ? 'success' : 'warning'}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {attemptLabel}
                      </Typography>
                    </Box>
                  )}
                  {!lastAttempt && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary' }}>
                      Belum pernah dikerjakan
                    </Typography>
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
