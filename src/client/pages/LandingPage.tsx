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
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import QuizIcon from '@mui/icons-material/Quiz';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import GroupsIcon from '@mui/icons-material/Groups';
import Brand from '../components/Brand';
import SkillTicker from '../components/SkillTicker';

const CARD_HOVER_SX = {
  transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(15,23,42,.08)' },
};

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

const BENEFITS = [
  {
    icon: <OndemandVideoIcon />,
    title: 'Materi Fleksibel',
    description: 'Akses materi berupa dokumen, video, dan tautan langsung dari instruktur, kapan saja.',
  },
  {
    icon: <QuizIcon />,
    title: 'Kuis & Penilaian Otomatis',
    description: 'Uji pemahamanmu lewat kuis interaktif dengan skor yang dihitung otomatis.',
  },
  {
    icon: <WorkspacePremiumIcon />,
    title: 'Gamifikasi & Poin',
    description: 'Kumpulkan poin dari keaktifan harian, enroll kelas, dan kuis — pantau progresmu.',
  },
  {
    icon: <GroupsIcon />,
    title: 'Leaderboard Komunitas',
    description: 'Bersaing sehat dengan member lain dan lihat peringkatmu secara real-time.',
  },
];

export default function LandingPage() {
  return (
    <Box>
      <AppBar position="sticky" color="transparent">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Brand />
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
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.75rem', sm: '3.75rem', md: '4.75rem' },
              lineHeight: { xs: 1.1, md: 1.02 },
              letterSpacing: '-0.03em',
              mt: 1,
              mb: 2,
            }}
          >
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

      <SkillTicker />

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
            <Card key={step.title} sx={CARD_HOVER_SX}>
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

      <Box sx={{ bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
          <Typography variant="overline" sx={{ display: 'block', textAlign: 'center' }}>
            Kenapa Gabung
          </Typography>
          <Typography variant="h2" sx={{ textAlign: 'center', mb: 6 }}>
            Semua yang Kamu Butuhkan untuk Belajar
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            }}
          >
            {BENEFITS.map((benefit) => (
              <Card key={benefit.title} sx={CARD_HOVER_SX}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2">{benefit.description}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
          py: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h2" sx={{ color: '#FFFFFF', mb: 2 }}>
            Siap Mulai Belajar Hari Ini?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4 }}>
            Daftar sekarang, tunggu persetujuan admin, dan langsung akses kelas serta materi bahasa
            Inggris pilihan.
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            size="large"
            sx={{ bgcolor: '#FFFFFF', color: 'primary.main', '&:hover': { bgcolor: '#EEF2FF' } }}
          >
            Daftar Sekarang
          </Button>
        </Container>
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Container
          maxWidth="lg"
          sx={{
            py: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Brand size={28} />
          <Typography variant="body2">
            © {new Date().getFullYear()} English Club Vokasi UB. Seluruh hak cipta dilindungi.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
