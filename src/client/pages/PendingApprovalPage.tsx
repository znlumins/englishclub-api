import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Brand from '../components/Brand';

const INFO_ITEMS = [
  'Proses persetujuan biasanya memakan waktu 1×24 jam',
  'Hubungi admin jika sudah melebihi waktu tersebut',
  'Setelah disetujui, kamu bisa login dan mulai belajar',
];

export default function PendingApprovalPage() {
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
              color: 'info.main',
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
            Setelah disetujui, kamu akan bisa login dan mulai belajar.
          </Typography>
        </Box>

        <Card sx={{ mb: 4 }}>
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

        <Button
          component={RouterLink}
          to="/login"
          variant="contained"
          size="large"
          fullWidth
          endIcon={<ArrowForwardIcon />}
        >
          Ke Halaman Login
        </Button>
      </Container>
    </Box>
  );
}
