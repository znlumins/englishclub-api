import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthLayout from '../components/AuthLayout';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [programStudi, setProgramStudi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await register({
      full_name: fullName,
      nim,
      email,
      password,
      program_studi: programStudi || undefined,
    });
    setSubmitting(false);
    if (result.ok) {
      showToast(result.message ?? 'Akun berhasil dibuat. Menunggu persetujuan admin.', 'success');
      navigate('/login');
    } else {
      showToast(result.message ?? 'Registrasi gagal', 'error');
    }
  };

  return (
    <AuthLayout
      eyebrow="Gabung Sekarang"
      title="Buat Akun Baru"
      panelTitle="Satu Langkah Menuju Kelas Impianmu"
      panelDescription="Daftar sekarang, tunggu persetujuan admin, dan mulai belajar bersama English Club Vokasi UB."
      panelHighlights={[
        'Materi fleksibel: dokumen, video, tautan',
        'Kuis interaktif dengan penilaian otomatis',
        'Kumpulkan poin & bersaing di leaderboard',
      ]}
      footer={
        <Typography variant="body2">
          Sudah punya akun?{' '}
          <Link component={RouterLink} to="/login" underline="hover">
            Log in
          </Link>
        </Typography>
      }
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' } }}>
          <TextField
            label="Nama Lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
          />
          <TextField label="NIM" value={nim} onChange={(e) => setNim(e.target.value)} required fullWidth />
        </Box>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          helperText="Minimal 6 karakter"
        />
        <TextField
          label="Program Studi (opsional)"
          value={programStudi}
          onChange={(e) => setProgramStudi(e.target.value)}
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {submitting ? 'Memproses...' : 'Daftar'}
        </Button>
      </Stack>
    </AuthLayout>
  );
}
