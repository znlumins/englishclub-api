import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import Brand from './Brand';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  footer: ReactNode;
  children: ReactNode;
  panelTitle: string;
  panelDescription: string;
  panelHighlights: string[];
}

export default function AuthLayout({
  eyebrow,
  title,
  footer,
  children,
  panelTitle,
  panelDescription,
  panelHighlights,
}: AuthLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 480px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 6 },
          py: 6,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 380, mx: 'auto' }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: 'block', width: 'fit-content', textDecoration: 'none', mb: 4 }}
          >
            <Brand />
          </Box>
          <Typography variant="overline">{eyebrow}</Typography>
          <Typography variant="h2" sx={{ fontSize: '1.75rem', mb: 3 }}>
            {title}
          </Typography>
          {children}
          <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
          alignItems: 'center',
          px: 8,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
            filter: 'blur(90px)',
            top: -100,
            right: -100,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
            filter: 'blur(90px)',
            bottom: -80,
            left: -80,
          }}
        />
        <Box sx={{ position: 'relative', maxWidth: 440 }}>
          <Typography variant="h2" sx={{ color: '#FFFFFF', mb: 2 }}>
            {panelTitle}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4 }}>
            {panelDescription}
          </Typography>
          <Stack spacing={2}>
            {panelHighlights.map((item) => (
              <Stack key={item} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlineIcon sx={{ color: '#FFFFFF' }} fontSize="small" />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
