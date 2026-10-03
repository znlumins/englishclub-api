import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const { showToast } = useToast();

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }
    setSubmitting(true);
    const res = await api.post('/auth/reset-password', { token, password });
    setSubmitting(false);
    if (res.success) {
      setDone(true);
      showToast(res.message ?? 'Password berhasil direset', 'success');
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (done) {
    return (
      <AuthLayout
        eyebrow="Berhasil"
        title="Password Diubah"
        panelTitle="Kamu bisa login sekarang"
        panelDescription="Password berhasil direset. Silakan login dengan password baru."
      panelHighlights={['Gunakan password baru untuk login', 'Jangan bagikan password ke siapa pun']}
      footer={
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowBackIcon fontSize="small" /> Kembali ke Login
          </Link>
        </Typography>
      }
    >
        <Stack spacing={2.5} sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 56, mx: 'auto' }} />
          <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth>
            Masuk Sekarang
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Reset Password"
      title="Buat Password Baru"
      panelTitle="Masukkan Token & Password Baru"
      panelDescription="Gunakan token dari email untuk mereset password."
      panelHighlights={['Token dikirim ke email terdaftar', 'Password minimal 6 karakter']}
      footer={
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowBackIcon fontSize="small" /> Kembali ke Login
          </Link>
        </Typography>
      }
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        <TextField
          label="Token Reset"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          fullWidth
          helperText={tokenFromUrl ? 'Token diambil dari tautan email' : 'Tempel token dari email reset password'}
        />
        <TextField
          label="Password Baru"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          slotProps={{ htmlInput: { minLength: 6 } }}
          helperText="Minimal 6 karakter"
        />
        <TextField
          label="Konfirmasi Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {submitting ? 'Memproses...' : 'Reset Password'}
        </Button>
      </Stack>
    </AuthLayout>
  );
}
