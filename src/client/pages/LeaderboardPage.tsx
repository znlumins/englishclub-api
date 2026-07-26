import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { api } from '../api/client';
import type { LeaderboardEntry } from '../api/types';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

const RANK_COLOR: Record<number, string> = {
  1: '#D97706',
  2: '#64748B',
  3: '#B45309',
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    api.get<LeaderboardEntry[]>('/auth/leaderboard').then((res) => {
      if (res.success) setEntries(res.data);
    });
  }, []);

  return (
    <Box>
      <Typography variant="overline">Your Progress</Typography>
      <Typography variant="h2" sx={{ mb: 4 }}>
        Leaderboard
      </Typography>

      {entries === null && <PageLoader />}

      {entries !== null && entries.length === 0 && (
        <EmptyState icon={<EmojiEventsIcon />} title="Belum ada data" description="Belum ada member aktif dengan poin." />
      )}

      {entries !== null && entries.length > 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={64}>Rank</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell align="right">Streak</TableCell>
                  <TableCell align="right">Poin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        {rank <= 3 ? (
                          <WorkspacePremiumIcon sx={{ color: RANK_COLOR[rank] }} />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rank}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, fontWeight: 700 }}>
                            {entry.full_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {entry.full_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          icon={<LocalFireDepartmentIcon fontSize="small" />}
                          label={entry.streak_days}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {entry.points}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
