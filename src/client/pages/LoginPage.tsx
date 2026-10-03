import { useEffect, useState, type FormEvent } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthLayout from '../components/AuthLayout';

const PENDING_APPROVAL_MSG = 'menunggu persetujuan admin';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingError, setPendingError] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(fromPath.startsWith('/') ? fromPath : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, fromPath, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setPendingError(false);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      const target = fromPath.startsWith('/') && fromPath !== '/login' ? fromPath : '/dashboard';
      navigate(target, { replace: true });
    } else {
      const msg = result.message ?? '';
      if (msg.includes(PENDING_APPROVAL_MSG)) {
        setPendingError(true);
      } else {
        showToast(msg || 'Email atau password salah', 'error');
      }
    }
  };

  return (
    <AuthLayout
      eyebrow="Selamat Datang"
      title="Masuk ke Akunmu"
      panelTitle="Lanjutkan Belajar Bahasa Inggrismu"
      panelDescription="Masuk untuk akses kelas, materi, dan kuis yang sudah kamu ikuti — sekaligus pantau progres poinmu."
      panelHighlights={[
        'Akses materi kapan saja',
        'Kerjakan kuis & lihat skor otomatis',
        'Pantau peringkatmu di papan peringkat',
      ]}
      footer={
        <Typography variant="body2">
          Belum punya akun?{' '}
          <Link component={RouterLink} to="/register" underline="hover">
            Daftar sekarang
          </Link>
        </Typography>
      }
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        {pendingError && (
          <Alert
            severity="warning"
            icon={<ScheduleIcon />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Akun Belum Disetujui
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Akun kamu masih menunggu persetujuan dari admin. Kamu akan bisa login setelah disetujui.
            </Typography>
            <Link
              component={RouterLink}
              to="/pending-approval"
              underline="hover"
              sx={{ fontWeight: 600, fontSize: '0.875rem' }}
            >
              Pelajari Lebih Lanjut →
            </Link>
          </Alert>
        )}
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
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {submitting ? 'Memproses...' : 'Masuk'}
        </Button>
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          <Link component={RouterLink} to="/forgot-password" underline="hover" sx={{ color: 'text.secondary' }}>
            Lupa password?
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
