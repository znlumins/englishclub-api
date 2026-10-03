import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.post('/auth/forgot-password', { email });
    setSubmitting(false);
    if (res.success) {
      setSent(true);
    } else {
      showToast(res.error.message, 'error');
    }
  };

  if (sent) {
    return (
      <AuthLayout
        eyebrow="Reset Password"
        title="Cek Email Kamu"
        panelTitle="Tautan Reset Dikirim"
        panelDescription="Jika email terdaftar, kamu akan menerima tautan reset password."
        panelHighlights={[
          'Cek folder spam jika tidak menemukan email',
          'Tautan berlaku selama 1 jam',
          'Hubungi admin jika tidak menerima email',
        ]}
        footer={
          <Typography variant="body2">
            <Link component={RouterLink} to="/login" underline="hover" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <ArrowBackIcon fontSize="small" /> Kembali ke Login
            </Link>
          </Typography>
        }
      >
        <Stack spacing={2.5} sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56, mx: 'auto' }} />
          <Typography variant="body1">
            Jika email <strong>{email}</strong> terdaftar, tautan reset password akan dikirim.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Cek folder spam jika email belum muncul dalam beberapa menit.
          </Typography>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Bantuan"
      title="Lupa Password"
      panelTitle="Reset Password Kamu"
      panelDescription="Masukkan email terdaftar untuk menerima tautan reset password."
      panelHighlights={[
        'Tautan dikirim ke email terdaftar',
        'Berlaku selama 1 jam',
        'Password baru minimal 6 karakter',
      ]}
      footer={
        <Typography variant="body2">
          <Link component={RouterLink} to="/login" underline="hover" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <ArrowBackIcon fontSize="small" /> Kembali ke Login
          </Link>
        </Typography>
      }
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {submitting ? 'Memproses...' : 'Kirim Tautan Reset'}
        </Button>
      </Stack>
    </AuthLayout>
  );
}
