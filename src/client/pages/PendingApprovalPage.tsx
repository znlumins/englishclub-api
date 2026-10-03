import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ScheduleIcon from '@mui/icons-material/Schedule';
import RefreshIcon from '@mui/icons-material/Refresh';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const INFO_ITEMS = [
  'Proses persetujuan biasanya memakan waktu 1×24 jam',
  'Hubungi admin jika sudah melebihi waktu tersebut',
  'Setelah disetujui, kamu bisa masuk dan mulai belajar',
];

const PENDING_APPROVAL_MSG = 'menunggu persetujuan admin';

export default function PendingApprovalPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showCheck, setShowCheck] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [stillPending, setStillPending] = useState(false);

  const handleCheckStatus = async (e: FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setStillPending(false);
    const result = await login(email, password);
    setChecking(false);
    if (result.ok) {
      showToast('Akun sudah aktif! Mengalihkan...', 'success');
      navigate('/dashboard', { replace: true });
      return;
    }
    const msg = result.message ?? '';
    if (msg.toLowerCase().includes(PENDING_APPROVAL_MSG)) {
      setStillPending(true);
    } else {
      showToast(msg || 'Gagal memeriksa status', 'error');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #EEF2FF 0%, #FFFFFF 70%)',
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box component={RouterLink} to="/" sx={{ display: 'inline-block', textDecoration: 'none', mb: 4 }}>
            <Brand />
          </Box>

          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'success.light',
              color: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h2" sx={{ mb: 1 }}>
            Akun Berhasil Dibuat
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: 'primary.main',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            <ScheduleIcon fontSize="small" />
            Menunggu Persetujuan Admin
          </Typography>

          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 440, mx: 'auto', mb: 4 }}>
            Akun kamu sedang menunggu persetujuan dari admin English Club Vokasi UB.
            Setelah disetujui, kamu akan bisa masuk dan mulai belajar.
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Yang Perlu Kamu Lakukan
            </Typography>
            <Stack spacing={2}>
              {INFO_ITEMS.map((item) => (
                <Stack key={item} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <CheckCircleOutlineIcon sx={{ color: 'success.main', mt: 0.3 }} fontSize="small" />
                  <Typography variant="body2">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setShowCheck((v) => !v)}
            >
              {showCheck ? 'Tutup Cek Status' : 'Cek Status Akun'}
            </Button>
            <Collapse in={showCheck}>
              <Stack component="form" spacing={2} onSubmit={handleCheckStatus} sx={{ mt: 2.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Masukkan email & password yang kamu daftarkan untuk memeriksa apakah akun sudah disetujui.
                </Typography>
                {stillPending && (
                  <Alert severity="warning">
                    Akun masih menunggu persetujuan admin. Coba lagi nanti.
                  </Alert>
                )}
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <Button type="submit" variant="contained" disabled={checking}>
                  {checking ? 'Memeriksa...' : 'Periksa Sekarang'}
                </Button>
              </Stack>
            </Collapse>
          </CardContent>
        </Card>

        <Button
          component={RouterLink}
          to="/login"
          variant="contained"
          size="large"
          fullWidth
          endIcon={<ArrowForwardIcon />}
        >
          Ke Halaman Masuk
        </Button>
      </Container>
    </Box>
  );
}
