import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Brand from './Brand';

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
        <Box component={RouterLink} to="/" sx={{ display: 'block', width: 'fit-content', textDecoration: 'none', mb: 3 }}>
          <Brand />
        </Box>
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
