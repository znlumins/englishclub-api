import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LinkIcon from '@mui/icons-material/Link';
import QuizIcon from '@mui/icons-material/Quiz';
import GroupIcon from '@mui/icons-material/Group';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { api } from '../../api/client';
import type {
  ClassDetailDTO,
  ClassMemberDTO,
  MaterialDTO,
  MaterialType,
  QuizListItemDTO,
  QuizQuestionInput,
} from '../../api/types';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';

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
  const [quizzes, setQuizzes] = useState<QuizListItemDTO[] | null>(null);
  const [members, setMembers] = useState<ClassMemberDTO[] | null>(null);

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState<MaterialFormState>(EMPTY_MATERIAL);
  const [savingMaterial, setSavingMaterial] = useState(false);

  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<QuizFormQuestion[]>([emptyQuestion()]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const load = () => {
    if (!id) return;
    api.get<ClassDetailDTO>(`/classes/${id}`).then((res) => {
      if (res.success) setDetail(res.data);
    });
    api.get<QuizListItemDTO[]>(`/quizzes/class/${id}`).then((res) => {
      if (res.success) setQuizzes(res.data);
    });
    api.get<ClassMemberDTO[]>(`/classes/${id}/members`).then((res) => {
      if (res.success) setMembers(res.data);
    });
  };

  useEffect(load, [id]);

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
    setQuizTitle('');
    setQuestions([emptyQuestion()]);
    setQuizDialogOpen(true);
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
    const res = await api.post('/quizzes', { classId: id, title: quizTitle, questions: payloadQuestions });
    setSavingQuiz(false);
    if (res.success) {
      showToast(res.message ?? 'Quiz berhasil dibuat', 'success');
      setQuizDialogOpen(false);
      load();
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

  if (!detail) return <PageLoader />;

  return (
    <Box>
      <Typography variant="overline">Kelola Kelas</Typography>
      <Typography variant="h2" sx={{ mb: 4 }}>
        {detail.name}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3">Materi</Typography>
        <Button startIcon={<AddIcon />} onClick={openCreateMaterial} variant="outlined" size="small">
          Tambah Materi
        </Button>
      </Box>
      {detail.materials.length === 0 ? (
        <EmptyState icon={<DescriptionIcon />} title="Belum ada materi" />
      ) : (
        <Card sx={{ mb: 5 }}>
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
                      <IconButton size="small" color="error" onClick={() => handleDeleteMaterial(material)} aria-label="Hapus materi">
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3">Kuis</Typography>
        <Button startIcon={<AddIcon />} onClick={openCreateQuiz} variant="outlined" size="small">
          Buat Kuis
        </Button>
      </Box>
      {quizzes === null && <PageLoader />}
      {quizzes !== null && quizzes.length === 0 && <EmptyState icon={<QuizIcon />} title="Belum ada kuis" />}
      {quizzes !== null && quizzes.length > 0 && (
        <Stack spacing={1.5} sx={{ mb: 5 }}>
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4">{quiz.title}</Typography>
                  <Typography variant="body2">{quiz._count.questions} soal</Typography>
                </Box>
                <IconButton color="error" onClick={() => handleDeleteQuiz(quiz)} aria-label="Hapus kuis">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Typography variant="h3" sx={{ mb: 2 }}>
        Peserta
      </Typography>
      {members === null && <PageLoader />}
      {members !== null && members.length === 0 && <EmptyState icon={<GroupIcon />} title="Belum ada peserta" />}
      {members !== null && members.length > 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama</TableCell>
                  <TableCell>NIM</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>{member.full_name}</TableCell>
                    <TableCell>{member.nim}</TableCell>
                    <TableCell>{member.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
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
        <DialogTitle>Buat Kuis Baru</DialogTitle>
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
              {questions.map((q, qIndex) => (
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
                            <IconButton size="small" onClick={() => removeOption(qIndex, oIndex)}>
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
              <Button startIcon={<AddIcon />} onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>
                Tambah Soal
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setQuizDialogOpen(false)} color="inherit">
              Batal
            </Button>
            <Button type="submit" variant="contained" disabled={savingQuiz}>
              {savingQuiz ? 'Menyimpan...' : 'Simpan Kuis'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
