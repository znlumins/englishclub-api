import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import StarIcon from '@mui/icons-material/Star';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Divider from '@mui/material/Divider';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import LoginIcon from '@mui/icons-material/Login';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Tooltip from '@mui/material/Tooltip';
import LockIcon from '@mui/icons-material/Lock';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import type { BadgeDTO, ClassSummary, MyQuizAttemptDTO, PointTransactionDTO, UserDTO } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

const MAX_AVATAR_BYTES = 180_000; // ~180KB data URL

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [programStudi, setProgramStudi] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [myClasses, setMyClasses] = useState<ClassSummary[] | null>(null);
  const [pointHistory, setPointHistory] = useState<PointTransactionDTO[] | null>(null);
  const [badges, setBadges] = useState<BadgeDTO[] | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<MyQuizAttemptDTO[] | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    api.get<UserDTO>('/auth/me').then((res) => {
      if (res.success) {
        updateUser(res.data);
        setBio(res.data.bio ?? '');
        setPhone(res.data.phone ?? '');
        setProgramStudi(res.data.program_studi ?? '');
        setAvatarUrl(res.data.avatar_url ?? '');
      }
    });
    api.get<ClassSummary[]>('/classes/my').then((res) => {
      setMyClasses(res.success ? res.data : []);
    });
    api.get<PointTransactionDTO[]>('/auth/me/points').then((res) => {
      setPointHistory(res.success ? res.data : []);
    });
    api.get<BadgeDTO[]>('/auth/me/badges').then((res) => {
      setBadges(res.success ? res.data : []);
    });
    api.get<MyQuizAttemptDTO[]>('/quizzes/me/attempts').then((res) => {
      setQuizAttempts(res.success ? res.data : []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showToast('Gambar terlalu besar. Maksimal sekitar 150 KB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result.length > MAX_AVATAR_BYTES * 1.4) {
        showToast('Gambar terlalu besar setelah dikompresi. Pilih file lebih kecil.', 'error');
        return;
      }
      setAvatarUrl(result);
      showToast('Pratinjau avatar siap. Klik Simpan untuk menerapkan.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.put('/auth/me', { bio, phone, program_studi: programStudi, avatar_url: avatarUrl });
    setSaving(false);
    if (res.success) {
      updateUser({ bio, phone, program_studi: programStudi, avatar_url: avatarUrl });
      showToast(res.message ?? 'Profil berhasil diperbarui', 'success');
    } else {
      showToast(res.error.message, 'error');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password baru tidak cocok', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }
    setChangingPassword(true);
    const res = await api.put('/auth/me/password', { currentPassword, newPassword });
    setChangingPassword(false);
    if (res.success) {
      showToast(res.message ?? 'Password berhasil diubah', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (!user) return <PageLoader />;

  return (
    <Box>
      <Typography variant="overline">Akun Saya</Typography>
      <Typography variant="h2" sx={{ mb: 4 }}>
        Profil
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '320px 1fr' } }}>
        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                src={avatarUrl || undefined}
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 28, fontWeight: 700 }}
              >
                {user.full_name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h4">{user.full_name}</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                <Chip icon={<StarIcon />} label={`${user.points} poin`} size="small" color="primary" />
                <Chip icon={<LocalFireDepartmentIcon />} label={`${user.streak_days ?? 0} hari`} size="small" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Kelas Diikuti
              </Typography>
              {myClasses === null && <PageLoader />}
              {myClasses !== null && myClasses.length === 0 && (
                <EmptyState icon={<MenuBookIcon />} title="Belum ada kelas" />
              )}
              {myClasses !== null && myClasses.length > 0 && (
                <Stack spacing={1}>
                  {myClasses.map((cls) => (
                    <Typography
                      key={cls.id}
                      component={RouterLink}
                      to={`/classes/${cls.id}`}
                      variant="body2"
                      sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {cls.name}
                    </Typography>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon /> Badge
              </Typography>
              {badges === null && <PageLoader />}
              {badges !== null && badges.length === 0 && (
                <EmptyState icon={<EmojiEventsIcon />} title="Belum ada badge" description="Terus aktif untuk mendapatkan badge pertamamu." />
              )}
              {badges !== null && badges.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {badges.map((badge) => (
                    <Tooltip key={badge.badgeKey} title={badge.description}>
                      <Chip icon={<EmojiEventsIcon />} label={badge.label} color="primary" variant="outlined" />
                    </Tooltip>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 3 }}>
                Edit Profil
              </Typography>
              <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
                <TextField label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} multiline rows={3} fullWidth />
                <TextField label="Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
                <TextField
                  label="Program Studi"
                  value={programStudi}
                  onChange={(e) => setProgramStudi(e.target.value)}
                  fullWidth
                />
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Pilih Foto
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
                    />
                    {avatarUrl && (
                      <Button size="small" color="inherit" onClick={() => setAvatarUrl('')}>
                        Hapus
                      </Button>
                    )}
                  </Stack>
                  <TextField
                    label="URL Avatar (opsional)"
                    value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    fullWidth
                    helperText={
                      avatarUrl.startsWith('data:')
                        ? 'Foto lokal dipilih — simpan untuk menerapkan'
                        : 'Unggah foto kecil (≤150 KB) atau tempel tautan gambar'
                    }
                    disabled={avatarUrl.startsWith('data:')}
                  />
                </Box>
                <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: 'flex-start' }}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon /> Ganti Password
              </Typography>
              <Stack component="form" spacing={2.5} onSubmit={handleChangePassword}>
                <TextField
                  label="Password Saat Ini"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Password Baru"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { minLength: 6 } }}
                  helperText="Minimal 6 karakter"
                />
                <TextField
                  label="Konfirmasi Password Baru"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  error={confirmPassword.length > 0 && confirmPassword !== newPassword}
                  helperText={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? 'Konfirmasi tidak cocok'
                      : undefined
                  }
                />
                <Button type="submit" variant="contained" disabled={changingPassword} sx={{ alignSelf: 'flex-start' }}>
                  {changingPassword ? 'Menyimpan...' : 'Ubah Password'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon /> Riwayat Poin
          </Typography>
          {pointHistory === null && <PageLoader />}
          {pointHistory !== null && pointHistory.length === 0 && (
            <EmptyState icon={<StarIcon />} title="Belum ada transaksi" description="Aktivitas kamu akan tercatat di sini." />
          )}
          {pointHistory !== null && pointHistory.length > 0 && (
            <List disablePadding>
              {pointHistory.map((tx, idx) => {
                const iconMap: Record<string, React.ReactNode> = {
                  login: <LoginIcon />,
                  enroll: <SchoolIcon />,
                  quiz: <QuizIcon />,
                  admin: <StarIcon />,
                };
                const colorMap: Record<string, string> = {
                  login: 'warning.main',
                  enroll: 'success.main',
                  quiz: 'primary.main',
                  admin: 'secondary.main',
                };
                const isNegative = tx.amount < 0;
                return (
                  <Box key={tx.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: colorMap[tx.type] ?? 'grey.500', width: 36, height: 36 }}>
                          {iconMap[tx.type] ?? <StarIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={tx.description}
                        secondary={new Date(tx.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isNegative ? 'error.main' : 'success.main' }}>
                        {isNegative ? '' : '+'}
                        {tx.amount}
                      </Typography>
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon /> Riwayat Kuis
          </Typography>
          {quizAttempts === null && <PageLoader />}
          {quizAttempts !== null && quizAttempts.length === 0 && (
            <EmptyState icon={<QuizIcon />} title="Belum ada kuis yang dikerjakan" description="Riwayat kuismu akan tercatat di sini." />
          )}
          {quizAttempts !== null && quizAttempts.length > 0 && (
            <List disablePadding>
              {quizAttempts.map((attempt, idx) => (
                <Box key={attempt.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    secondaryAction={
                      <Chip
                        label={attempt.score}
                        size="small"
                        color={attempt.score >= 60 ? 'success' : 'warning'}
                      />
                    }
                  >
                    <ListItemText
                      primary={attempt.quizTitle}
                      secondary={`${attempt.className} • ${new Date(attempt.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
