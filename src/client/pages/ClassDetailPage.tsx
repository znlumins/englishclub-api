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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import Avatar from '@mui/material/Avatar';
import PageBreadcrumb from '../components/PageBreadcrumb';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../api/client';
import type { ClassDetailDTO, QuizListItemDTO, MaterialType, ClassLeaderboardEntry } from '../api/types';
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
  const confirm = useConfirm();
  const [detail, setDetail] = useState<ClassDetailDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItemDTO[] | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ClassLeaderboardEntry[] | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const [detailRes, myClassesRes] = await Promise.all([
      api.get<ClassDetailDTO>(`/classes/${id}`),
      api.get<{ id: string }[]>('/classes/my'),
    ]);
    if (detailRes.success) {
      setDetail(detailRes.data);
    } else {
      setLoadError(detailRes.error.message);
      return;
    }
    const isEnrolled = myClassesRes.success && myClassesRes.data.some((c) => c.id === id);
    setEnrolled(isEnrolled);

    if (isEnrolled || isAdminOrInstructor) {
      const [quizRes, leaderboardRes] = await Promise.all([
        api.get<QuizListItemDTO[]>(`/quizzes/class/${id}`),
        api.get<ClassLeaderboardEntry[]>(`/classes/${id}/leaderboard`),
      ]);
      if (quizRes.success) setQuizzes(quizRes.data);
      else setQuizzes([]);
      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
      else setLeaderboard([]);
    } else {
      setQuizzes([]);
      setLeaderboard([]);
    }
  }, [id, isAdminOrInstructor]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async () => {
    if (!id) return;
    const ok = await confirm({
      message: 'Enroll ke kelas ini akan memberikan +50 poin. Lanjutkan?',
      confirmText: 'Ya, Enroll',
    });
    if (!ok) return;
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

  const handleUnenroll = async () => {
    if (!id) return;
    const ok = await confirm({
      title: 'Keluar Kelas',
      message: 'Keluar dari kelas ini akan mengurangi poin yang kamu dapat saat enroll. Lanjutkan?',
      destructive: true,
      confirmText: 'Ya, Keluar',
    });
    if (!ok) return;
    setEnrolling(true);
    const res = await api.delete(`/classes/${id}/enroll`);
    setEnrolling(false);
    if (res.success) {
      showToast(res.message ?? 'Berhasil keluar dari kelas', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (loadError) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6 }}>
        <EmptyState
          icon={<ErrorOutlineIcon />}
          title="Gagal memuat kelas"
          description={loadError}
          action={
            <Button variant="contained" onClick={() => { setLoadError(null); load(); }}>
              Coba Lagi
            </Button>
          }
        />
      </Box>
    );
  }

  if (!detail) return <PageLoader />;

  const canEnroll = user?.role === 'member' && !enrolled;
  const canUnenroll = user?.role === 'member' && enrolled;

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
        {canUnenroll && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToAppIcon />}
            onClick={handleUnenroll}
            disabled={enrolling}
          >
            {enrolling ? 'Memproses...' : 'Keluar Kelas'}
          </Button>
        )}
      </Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Instruktur: {detail.instructor?.full_name ?? '-'}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        {detail.description || 'Tidak ada deskripsi.'}
      </Typography>

      {(enrolled || isAdminOrInstructor) && quizzes !== null && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Progres Belajar
            </Typography>
            {(() => {
              const totalQuizzes = quizzes.length;
              const doneQuizzes = quizzes.filter((q) => (q.attemptCount ?? 0) > 0 || (q.attempts?.length ?? 0) > 0).length;
              const materialCount = detail.materials.length;
              const pct = totalQuizzes > 0 ? (doneQuizzes / totalQuizzes) * 100 : materialCount > 0 ? 100 : 0;
              return (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {doneQuizzes} / {totalQuizzes} kuis dikerjakan · {materialCount} materi tersedia
                  </Typography>
                  <Box
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${pct}%`,
                        bgcolor: 'primary.main',
                        transition: 'width 200ms ease',
                      }}
                    />
                  </Box>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

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
            const maxAttempt = quiz.max_attempts;
            const attemptsLeft = maxAttempt != null ? Math.max(0, maxAttempt - attemptCount) : null;
            const isAttemptsExhausted = maxAttempt != null && attemptCount >= maxAttempt;
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
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
                      Belum pernah dikerjakan
                    </Typography>
                  )}
                  {attemptsLeft != null && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: attemptsLeft <= 1 ? 'error.main' : 'text.secondary' }}>
                      Sisa kesempatan: {attemptsLeft}x
                    </Typography>
                  )}
                  <Button
                    component={RouterLink}
                    to={`/quiz/${quiz.id}`}
                    endIcon={<ArrowForwardIcon />}
                    fullWidth
                    variant={isAttemptsExhausted ? 'outlined' : 'outlined'}
                    disabled={isAttemptsExhausted}
                    color={isAttemptsExhausted ? 'error' : 'primary'}
                  >
                    {isAttemptsExhausted ? 'Batas Tercapai' : 'Kerjakan Kuis'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {(enrolled || isAdminOrInstructor) && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon /> Leaderboard Kelas
          </Typography>
          {leaderboard === null && <PageLoader />}
          {leaderboard !== null && leaderboard.length === 0 && (
            <EmptyState icon={<EmojiEventsIcon />} title="Belum ada peserta" />
          )}
          {leaderboard !== null && leaderboard.length > 0 && (
            <Card>
              <List disablePadding>
                {leaderboard.map((entry, idx) => (
                  <Box key={entry.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      secondaryAction={
                        entry.averageScore != null ? (
                          <Chip
                            label={`Rata-rata: ${entry.averageScore}`}
                            size="small"
                            color={entry.averageScore >= 60 ? 'success' : 'warning'}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Belum ada kuis
                          </Typography>
                        )
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          #{idx + 1}
                        </Typography>
                      </ListItemIcon>
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Avatar src={entry.avatar_url ?? undefined} sx={{ width: 32, height: 32, fontSize: 14 }}>
                          {entry.full_name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={entry.full_name}
                        secondary={`${entry.quizzesCompleted} kuis dikerjakan`}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}
