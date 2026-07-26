import { useEffect, useState, type FormEvent } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import type { ClassSummary, UserDTO } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [programStudi, setProgramStudi] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [myClasses, setMyClasses] = useState<ClassSummary[] | null>(null);

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
      if (res.success) setMyClasses(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        </Stack>

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
              <TextField
                label="URL Avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                fullWidth
                helperText="Tempel tautan gambar (upload langsung belum didukung)"
              />
              <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: 'flex-start' }}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
