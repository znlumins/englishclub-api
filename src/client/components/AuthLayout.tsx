import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  footer: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({ eyebrow, title, footer, children }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #EEF2FF 0%, #F8FAFC 70%)',
        px: 2,
        py: 6,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 5 } }}>
        <Typography
          component={RouterLink}
          to="/"
          variant="h4"
          sx={{ fontWeight: 800, color: 'primary.main', textDecoration: 'none', display: 'block', mb: 3 }}
        >
          English Club
        </Typography>
        <Typography variant="overline">{eyebrow}</Typography>
        <Typography variant="h2" sx={{ fontSize: '1.75rem', mb: 3 }}>
          {title}
        </Typography>
        {children}
        <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
      </Card>
    </Box>
  );
}
