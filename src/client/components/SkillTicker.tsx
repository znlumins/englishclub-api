import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const SKILLS = ['Speaking', 'Listening', 'Writing', 'Reading', 'Grammar', 'Vocabulary', 'Pronunciation', 'TOEFL/IELTS Prep'];

// Rotasi warna dot memakai token yang sudah ada (primary/success/warning), murni dekoratif.
const DOT_COLORS = ['primary.main', 'success.main', 'warning.main'];

export default function SkillTicker() {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: 2.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: 'max-content',
          animation: 'ticker-scroll 28s linear infinite',
          '@keyframes ticker-scroll': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(-50%)' },
          },
          '&:hover': { animationPlayState: 'paused' },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {[0, 1].map((group) => (
          <Box key={group} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {SKILLS.map((skill, index) => (
              <Box key={skill} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    px: 3,
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    fontWeight: 700,
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {skill}
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: DOT_COLORS[index % DOT_COLORS.length],
                    flexShrink: 0,
                  }}
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
