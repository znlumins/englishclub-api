import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const STEPS = [
  {
    icon: <HowToRegIcon fontSize="large" color="primary" />,
    title: 'Daftar & Disetujui',
    description: 'Buat akun dengan NIM & email kampus, lalu tunggu persetujuan admin English Club.',
  },
  {
    icon: <MenuBookIcon fontSize="large" color="primary" />,
    title: 'Ikut Kelas & Materi',
    description: 'Enroll ke kelas yang tersedia, akses materi, dan kerjakan kuis untuk menguji pemahaman.',
  },
  {
    icon: <EmojiEventsIcon fontSize="large" color="primary" />,
    title: 'Kumpulkan Poin',
    description: 'Login harian, enroll, dan kuis memberi poin — pantau posisimu di leaderboard.',
  },
];

export default function LandingPage() {
  return (
    <Box>
      <AppBar position="sticky" color="transparent">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            English Club
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button component={RouterLink} to="/login" variant="outlined">
              Log in
            </Button>
            <Button component={RouterLink} to="/register" variant="contained">
              Sign up
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at top, #EEF2FF 0%, #FFFFFF 70%)',
          py: { xs: 10, md: 16 },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
          <Typography variant="overline">English Club Vokasi UB</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.25rem', md: '3rem' }, mt: 1, mb: 2 }}>
            Tingkatkan Kemampuan Bahasa Inggrismu
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 560, mx: 'auto', mb: 4 }}>
            Bergabunglah dengan kelas-kelas eksklusif, kumpulkan poin, dan asah kemampuan komunikasimu
            secara profesional bersama English Club Vokasi UB.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Button component={RouterLink} to="/register" variant="contained" size="large">
              Mulai Belajar Sekarang
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" size="large">
              Log in
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Typography variant="overline" sx={{ display: 'block', textAlign: 'center' }}>
          Cara Kerja
        </Typography>
        <Typography variant="h2" sx={{ textAlign: 'center', mb: 6 }}>
          Tiga Langkah Sederhana
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {STEPS.map((step) => (
            <Card key={step.title}>
              <CardContent sx={{ p: 4 }}>
                {step.icon}
                <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2">{step.description}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
