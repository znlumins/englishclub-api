import { useEffect, useState, type FormEvent, type SyntheticEvent } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LinkIcon from '@mui/icons-material/Link';
import QuizIcon from '@mui/icons-material/Quiz';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { api } from '../../api/client';
import type {
  ClassDetailDTO,
  ClassMemberDTO,
  MaterialDTO,
  MaterialType,
  QuestionAdminDTO,
  QuizDetailDTO,
  QuizListItemDTO,
  QuizQuestionInput,
  QuizScoreData,
} from '../../api/types';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';
import LoadError from '../../components/LoadError';

const MATERIAL_ICON: Record<MaterialType, React.ReactNode> = {
  link: <LinkIcon />,
  video: <OndemandVideoIcon />,
  pdf: <DescriptionIcon />,
};

interface MaterialFormState {
  id: string | null;
  title: string;
  url: string;
  type: MaterialType;
}

const EMPTY_MATERIAL: MaterialFormState = { id: null, title: '', url: '', type: 'link' };

interface QuizFormQuestion {
  question_text: string;
  options: string[];
  correctIndex: number;
}

function emptyQuestion(): QuizFormQuestion {
  return { question_text: '', options: ['', ''], correctIndex: 0 };
}

export default function AdminClassPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [detail, setDetail] = useState<ClassDetailDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizListItemDTO[] | null>(null);
  const [members, setMembers] = useState<ClassMemberDTO[] | null>(null);
  const [tab, setTab] = useState(0);

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState<MaterialFormState>(EMPTY_MATERIAL);
  const [savingMaterial, setSavingMaterial] = useState(false);

  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizListItemDTO | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [questions, setQuestions] = useState<QuizFormQuestion[]>([emptyQuestion()]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [loadingQuizDetail, setLoadingQuizDetail] = useState(false);

  const [scoresDialogOpen, setScoresDialogOpen] = useState(false);
  const [scoresQuizId, setScoresQuizId] = useState<string | null>(null);
  const [scoresData, setScoresData] = useState<QuizScoreData | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);

  const load = () => {
    if (!id) return;
    setLoadError(null);
    api.get<ClassDetailDTO>(`/classes/${id}`).then((res) => {
      if (res.success) setDetail(res.data);
      else setLoadError(res.error.message);
    });
    api.get<QuizListItemDTO[]>(`/quizzes/class/${id}`).then((res) => {
      if (res.success) setQuizzes(res.data);
    });
    api.get<ClassMemberDTO[]>(`/classes/${id}/members`).then((res) => {
      if (res.success) setMembers(res.data);
    });
  };

  useEffect(load, [id]);

  const handleTabChange = (_: SyntheticEvent, value: number) => {
    setTab(value);
  };

  const openCreateMaterial = () => {
    setMaterialForm(EMPTY_MATERIAL);
    setMaterialDialogOpen(true);
  };

  const openEditMaterial = (material: MaterialDTO) => {
    setMaterialForm({ id: material.id, title: material.title, url: material.url, type: material.type });
    setMaterialDialogOpen(true);
  };

  const handleMaterialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingMaterial(true);
    const payload = { title: materialForm.title, url: materialForm.url, type: materialForm.type };
    const res = materialForm.id
      ? await api.put(`/classes/${id}/materials/${materialForm.id}`, payload)
      : await api.post(`/classes/${id}/materials`, payload);
    setSavingMaterial(false);
    if (res.success) {
      showToast(res.message ?? 'Materi tersimpan', 'success');
      setMaterialDialogOpen(false);
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleDeleteMaterial = async (material: MaterialDTO) => {
    if (!id) return;
    const ok = await confirm({ message: `Hapus materi "${material.title}"?`, destructive: true, confirmText: 'Hapus' });
    if (!ok) return;
    const res = await api.delete(`/classes/${id}/materials/${material.id}`);
    if (res.success) {
      showToast(res.message ?? 'Materi dihapus', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const openCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizTitle('');
    setMaxAttempts(3);
    setQuestions([emptyQuestion()]);
    setQuizDialogOpen(true);
  };

  const openEditQuiz = async (quiz: QuizListItemDTO) => {
    setEditingQuiz(quiz);
    setQuizTitle(quiz.title);
    setMaxAttempts(quiz.max_attempts ?? 3);
    setQuestions([emptyQuestion()]);
    setLoadingQuizDetail(true);
    setQuizDialogOpen(true);
    // Ambil detail lengkap dari server — list quiz hanya berisi _count, bukan isi soal,
    // jadi tidak boleh dipakai langsung untuk mengisi form edit (akan menghapus soal asli saat disimpan).
    const res = await api.get<QuizDetailDTO>(`/quizzes/${quiz.id}`);
    setLoadingQuizDetail(false);
    if (res.success) {
      const qs = res.data.questions as QuestionAdminDTO[];
      setQuestions(
        qs.length > 0
          ? qs.map((q) => ({
              question_text: q.question_text,
              options: q.options,
              correctIndex: Math.max(0, q.options.indexOf(q.correct_answer)),
            }))
          : [emptyQuestion()],
      );
    } else {
      showToast(res.error.message, 'error');
      setQuizDialogOpen(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<QuizFormQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q)),
    );
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIndex && q.options.length < 6 ? { ...q, options: [...q.options, ''] } : q)));
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oIndex);
        return { ...q, options, correctIndex: Math.min(q.correctIndex, options.length - 1) };
      }),
    );
  };

  const handleQuizSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const payloadQuestions: QuizQuestionInput[] = questions.map((q) => ({
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.options[q.correctIndex] ?? '',
    }));
    setSavingQuiz(true);
    const res = editingQuiz
      ? await api.put(`/quizzes/${editingQuiz.id}`, {
          title: quizTitle,
          max_attempts: maxAttempts,
          questions: payloadQuestions,
        })
      : await api.post('/quizzes', {
          classId: id,
          title: quizTitle,
          max_attempts: maxAttempts,
          questions: payloadQuestions,
        });
    setSavingQuiz(false);
    if (res.success) {
      showToast(res.message ?? 'Quiz berhasil dibuat', 'success');
      setQuizDialogOpen(false);
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleViewScores = async (quiz: QuizListItemDTO) => {
    setLoadingScores(true);
    setScoresDialogOpen(true);
    setScoresQuizId(quiz.id);
    const res = await api.get<QuizScoreData>(`/quizzes/${quiz.id}/scores`);
    setLoadingScores(false);
    if (res.success) {
      setScoresData(res.data);
    } else {
      showToast(res.error.message, 'error');
      setScoresDialogOpen(false);
    }
  };

  const handleResetAttempt = async (userId: string, fullName: string) => {
    if (!scoresQuizId) return;
    const ok = await confirm({
      message: `Hapus semua attempt "${fullName}" untuk kuis ini? User bisa mengerjakan ulang dari awal.`,
      destructive: true,
      confirmText: 'Hapus',
    });
    if (!ok) return;
    const res = await api.delete(`/quizzes/${scoresQuizId}/attempts/${userId}`);
    if (res.success) {
      showToast(res.message ?? 'Attempt dihapus', 'success');
      setLoadingScores(true);
      const refreshed = await api.get<QuizScoreData>(`/quizzes/${scoresQuizId}/scores`);
      setLoadingScores(false);
      if (refreshed.success) setScoresData(refreshed.data);
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleDeleteQuiz = async (quiz: QuizListItemDTO) => {
    const ok = await confirm({ message: `Hapus kuis "${quiz.title}"?`, destructive: true, confirmText: 'Hapus' });
    if (!ok) return;
    const res = await api.delete(`/quizzes/${quiz.id}`);
    if (res.success) {
      showToast(res.message ?? 'Quiz dihapus', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleKickMember = async (member: ClassMemberDTO) => {
    if (!id) return;
    const ok = await confirm({
      message: `Keluarkan ${member.full_name} dari kelas ini?`,
      destructive: true,
      confirmText: 'Keluarkan',
    });
    if (!ok) return;
    const res = await api.delete(`/classes/${id}/members/${member.id}`);
    if (res.success) {
      showToast(res.message ?? 'Peserta dikeluarkan', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (loadError) {
    return <LoadError title="Gagal memuat kelas" message={loadError} onRetry={load} />;
  }

  if (!detail) return <PageLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline">Kelola Kelas</Typography>
          <Typography variant="h2">{detail.name}</Typography>
          {detail.instructor && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Instruktur: {detail.instructor.full_name}
            </Typography>
          )}
        </Box>
        <Button
          component={RouterLink}
          to={`/classes/${id}`}
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
        >
          Lihat sebagai siswa
        </Button>
      </Box>

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Materi" />
        <Tab label="Kuis" />
        <Tab label="Peserta" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3">Materi</Typography>
            <Button startIcon={<AddIcon />} onClick={openCreateMaterial} variant="outlined" size="small">
              Tambah Materi
            </Button>
          </Box>
          {detail.materials.length === 0 ? (
            <EmptyState
              icon={<DescriptionIcon />}
              title="Belum ada materi"
              description="Tambahkan link, video, atau PDF untuk dibagikan ke peserta."
            />
          ) : (
            <Card>
              <List disablePadding>
                {detail.materials.map((material, idx) => (
                  <Box key={material.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton size="small" onClick={() => openEditMaterial(material)} aria-label="Edit materi">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteMaterial(material)}
                            aria-label="Hapus materi"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon>{MATERIAL_ICON[material.type]}</ListItemIcon>
                      <ListItemText primary={material.title} secondary={material.url} />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Card>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3">Kuis</Typography>
            <Button startIcon={<AddIcon />} onClick={openCreateQuiz} variant="outlined" size="small">
              Buat Kuis
            </Button>
          </Box>
          {quizzes === null && <PageLoader />}
          {quizzes !== null && quizzes.length === 0 && (
            <EmptyState
              icon={<QuizIcon />}
              title="Belum ada kuis"
              description="Buat kuis dengan soal pilihan ganda untuk mengukur pemahaman peserta."
            />
          )}
          {quizzes !== null && quizzes.length > 0 && (
            <Stack spacing={1.5}>
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4">{quiz.title}</Typography>
                      <Typography variant="body2">
                        {quiz._count.questions} soal
                        {quiz.max_attempts != null && ` \u2022 maks ${quiz.max_attempts}x`}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleViewScores(quiz)} aria-label="Lihat skor">
                        <PeopleIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openEditQuiz(quiz)} aria-label="Edit kuis">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteQuiz(quiz)} aria-label="Hapus kuis">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Peserta
          </Typography>
          {members === null && <PageLoader />}
          {members !== null && members.length === 0 && (
            <EmptyState
              icon={<GroupIcon />}
              title="Belum ada peserta"
              description="Peserta yang mendaftar ke kelas ini akan muncul di sini."
            />
          )}
          {members !== null && members.length > 0 && (
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama</TableCell>
                      <TableCell>NIM</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id} hover>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>{member.nim}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Keluarkan ${member.full_name}`}
                            onClick={() => handleKickMember(member)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}

      <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{materialForm.id ? 'Edit Materi' : 'Tambah Materi'}</DialogTitle>
        <Box component="form" onSubmit={handleMaterialSubmit}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Judul"
                value={materialForm.title}
                onChange={(e) => setMaterialForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="URL"
                value={materialForm.url}
                onChange={(e) => setMaterialForm((prev) => ({ ...prev, url: e.target.value }))}
                required
                fullWidth
                placeholder="https://..."
              />
              <TextField
                label="Tipe"
                select
                value={materialForm.type}
                onChange={(e) => setMaterialForm((prev) => ({ ...prev, type: e.target.value as MaterialType }))}
                fullWidth
              >
                <MenuItem value="link">Link</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setMaterialDialogOpen(false)} color="inherit">
              Batal
            </Button>
            <Button type="submit" variant="contained" disabled={savingMaterial}>
              {savingMaterial ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingQuiz ? 'Edit Kuis' : 'Buat Kuis Baru'}</DialogTitle>
        <Box component="form" onSubmit={handleQuizSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Judul Kuis"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Maksimal Attempt"
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                fullWidth
                helperText="Kosongkan untuk tidak membatasi"
                slotProps={{ htmlInput: { min: 1, max: 99 } }}
              />
              {loadingQuizDetail && <PageLoader />}
              {!loadingQuizDetail &&
                questions.map((q, qIndex) => (
                  <Card key={qIndex} variant="outlined">
                    <CardContent>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="h4" sx={{ fontSize: '1rem' }}>
                          Soal {qIndex + 1}
                        </Typography>
                        {questions.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Hapus soal ${qIndex + 1}`}
                            onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIndex))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                      <TextField
                        label="Pertanyaan"
                        value={q.question_text}
                        onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                        required
                        fullWidth
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Opsi jawaban (pilih yang benar)
                      </Typography>
                      <RadioGroup
                        value={String(q.correctIndex)}
                        onChange={(e) => updateQuestion(qIndex, { correctIndex: Number(e.target.value) })}
                      >
                        {q.options.map((option, oIndex) => (
                          <Stack key={oIndex} direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                            <FormControlLabel value={String(oIndex)} control={<Radio />} label="" sx={{ mr: 0 }} />
                            <TextField
                              size="small"
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Opsi ${oIndex + 1}`}
                              required
                              fullWidth
                            />
                            {q.options.length > 2 && (
                              <IconButton
                                size="small"
                                aria-label={`Hapus opsi ${oIndex + 1}`}
                                onClick={() => removeOption(qIndex, oIndex)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        ))}
                      </RadioGroup>
                      {q.options.length < 6 && (
                        <Button size="small" startIcon={<AddIcon />} onClick={() => addOption(qIndex)}>
                          Tambah Opsi
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              {!loadingQuizDetail && (
                <Button startIcon={<AddIcon />} onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>
                  Tambah Soal
                </Button>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setQuizDialogOpen(false)} color="inherit">
              Batal
            </Button>
            <Button type="submit" variant="contained" disabled={savingQuiz || loadingQuizDetail}>
              {savingQuiz ? 'Menyimpan...' : loadingQuizDetail ? 'Memuat soal...' : 'Simpan Kuis'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={scoresDialogOpen} onClose={() => setScoresDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{scoresData?.quizTitle ?? 'Skor Kuis'}</DialogTitle>
        <DialogContent>
          {loadingScores && <PageLoader />}
          {!loadingScores && scoresData && scoresData.scores.length === 0 && (
            <EmptyState
              icon={<QuizIcon />}
              title="Belum ada yang mengerjakan"
              description="Skor peserta akan muncul setelah mereka mengumpulkan kuis."
            />
          )}
          {!loadingScores && scoresData && scoresData.scores.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell align="center">Skor</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scoresData.scores.map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{s.full_name}</TableCell>
                      <TableCell>{s.nim}</TableCell>
                      <TableCell align="center">
                        <Chip label={`${s.score}`} size="small" color={s.score >= 60 ? 'success' : 'warning'} />
                      </TableCell>
                      <TableCell>{new Date(s.submitted_at).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Reset attempt ${s.full_name}`}
                          onClick={() => handleResetAttempt(s.userId, s.full_name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setScoresDialogOpen(false)} color="inherit">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
