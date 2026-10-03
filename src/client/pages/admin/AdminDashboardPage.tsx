import { useEffect, useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type { AdminStats, ClassSummary, PaginatedUsers, UserDTO } from '../../api/types';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';
import LoadError from '../../components/LoadError';
import StatCard from '../../components/StatCard';

interface ClassFormState {
  id: string | null;
  name: string;
  description: string;
  instructorId: string;
}

const EMPTY_FORM: ClassFormState = { id: null, name: '', description: '', instructorId: '' };

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ClassFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState<UserDTO[]>([]);

  const load = () => {
    setLoadError(null);
    setClasses(null);
    api.get<ClassSummary[]>('/classes/managed').then((res) => {
      if (res.success) setClasses(res.data);
      else setLoadError(res.error.message);
    });
    if (isAdmin) {
      api.get<AdminStats>('/admin/stats').then((res) => {
        if (res.success) setStats(res.data);
      });
      api.get<PaginatedUsers>('/auth/users?role=instructor&pageSize=100').then((res) => {
        if (res.success) setInstructors(res.data.items);
      });
    }
  };

  useEffect(load, [isAdmin]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cls: ClassSummary) => {
    setForm({ id: cls.id, name: cls.name, description: cls.description ?? '', instructorId: cls.instructorId ?? '' });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = { name: form.name, description: form.description };
    if (isAdmin && form.instructorId) payload.instructorId = form.instructorId;
    const res = form.id
      ? await api.put(`/classes/${form.id}`, payload)
      : await api.post('/classes', payload);
    setSaving(false);
    if (res.success) {
      showToast(res.message ?? 'Kelas tersimpan', 'success');
      setDialogOpen(false);
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleDelete = async (cls: ClassSummary) => {
    const ok = await confirm({
      title: 'Hapus Kelas',
      message: `Hapus kelas "${cls.name}"? Semua materi, kuis, dan pendaftaran di dalamnya akan ikut terhapus.`,
      destructive: true,
      confirmText: 'Hapus',
    });
    if (!ok) return;
    const res = await api.delete(`/classes/${cls.id}`);
    if (res.success) {
      showToast(res.message ?? 'Kelas dihapus', 'success');
      load();
    } else {
      showToast(res.error.message, 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline">Khusus Admin/Instruktur</Typography>
          <Typography variant="h2">Kelola Kursus</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Buat Kelas
        </Button>
      </Box>

      {isAdmin && stats && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, mb: 4 }}>
          <StatCard icon={<GroupIcon />} label="Total Pengguna" value={stats.users.total} accent="primary" />
          <StatCard icon={<HourglassEmptyIcon />} label="Menunggu Persetujuan" value={stats.users.pending} accent="warning" />
          <StatCard icon={<QuizIcon />} label="Total Kuis" value={stats.totalQuizzes} accent="success" />
          <StatCard icon={<TrendingUpIcon />} label="Tingkat Pengerjaan Kuis" value={`${stats.completionRate}%`} accent="primary" />
        </Box>
      )}

      {isAdmin && stats && stats.topClasses.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Kelas Terpopuler
            </Typography>
            <Stack spacing={1.5}>
              {stats.topClasses.map((cls, idx) => (
                <Box key={cls.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {idx + 1}. {cls.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {cls.enrollments} peserta
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {classes === null && !loadError && <PageLoader />}

      {loadError && <LoadError title="Gagal memuat kelas" message={loadError} onRetry={load} />}

      {classes !== null && classes.length === 0 && (
        <EmptyState
          icon={<AdminPanelSettingsIcon />}
          title="Belum ada kelas"
          description="Buat kelas pertamamu untuk mulai menambahkan materi & kuis."
          action={
            <Button variant="contained" onClick={openCreate}>
              Buat Kelas
            </Button>
          }
        />
      )}

      {classes !== null && classes.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {cls.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5, minHeight: 40 }}>
                  {cls.description || 'Tidak ada deskripsi.'}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ color: 'text.secondary' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon fontSize="small" />
                    <Typography variant="body2">{cls._count?.enrollments ?? 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DescriptionIcon fontSize="small" />
                    <Typography variant="body2">{cls._count?.materials ?? 0} materi</Typography>
                  </Box>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
                <Button component={RouterLink} to={`/admin/classes/${cls.id}`} variant="contained" size="small">
                  Kelola
                </Button>
                <Box>
                  <IconButton size="small" onClick={() => openEdit(cls)} aria-label="Edit kelas">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(cls)} aria-label="Hapus kelas" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? 'Edit Kelas' : 'Buat Kelas Baru'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Nama Kelas"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Deskripsi"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
              {isAdmin && (
                <TextField
                  label="Instruktur"
                  select
                  value={form.instructorId}
                  onChange={(e) => setForm((prev) => ({ ...prev, instructorId: e.target.value }))}
                  fullWidth
                  required={!form.id}
                >
                  <MenuItem value="">
                    <em>— Pilih instruktur —</em>
                  </MenuItem>
                  {instructors.map((inst) => (
                    <MenuItem key={inst.id} value={inst.id}>
                      {inst.full_name} ({inst.nim})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Batal
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
