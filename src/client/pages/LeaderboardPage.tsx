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
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import LoadError from '../components/LoadError';

const RANK_COLOR: Record<number, string> = {
  1: '#EAB308',
  2: '#94A3B8',
  3: '#B45309',
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    setLoadError(null);
    setEntries(null);
    api.get<LeaderboardEntry[]>('/auth/leaderboard').then((res) => {
      if (res.success) setEntries(res.data);
      else setLoadError(res.error.message);
    });
  };

  useEffect(load, []);

  const myRank = entries?.findIndex((e) => e.id === user?.id) ?? -1;

  return (
    <Box>
      <Typography variant="overline">Progres Kamu</Typography>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Papan Peringkat
      </Typography>
      {myRank >= 0 && (
        <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
          Posisimu saat ini: <strong>#{myRank + 1}</strong>
          {entries?.[myRank] != null && ` · ${entries[myRank].points} poin`}
        </Typography>
      )}
      {myRank < 0 && <Box sx={{ mb: 4 }} />}

      {entries === null && !loadError && <PageLoader />}

      {loadError && <LoadError title="Gagal memuat peringkat" message={loadError} onRetry={load} />}

      {entries !== null && entries.length === 0 && (
        <EmptyState icon={<EmojiEventsIcon />} title="Belum ada data" description="Belum ada member aktif dengan poin." />
      )}

      {entries !== null && entries.length > 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={64} align="center">Peringkat</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell align="right">Streak</TableCell>
                  <TableCell align="right">Poin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe = entry.id === user?.id;
                  return (
                    <TableRow
                      key={entry.id}
                      hover
                      sx={isMe ? { bgcolor: 'primary.light', '& td': { fontWeight: 600 } } : undefined}
                    >
                      <TableCell align="center">
                        {rank <= 3 ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }} aria-label={`Peringkat ${rank}`}>
                            <WorkspacePremiumIcon sx={{ color: RANK_COLOR[rank] }} />
                            <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>
                              {rank}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rank}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={entry.avatar_url ?? undefined}
                            sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, fontWeight: 700 }}
                          >
                            {entry.full_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {entry.full_name}
                              {isMe && (
                                <Chip label="Kamu" size="small" color="primary" sx={{ ml: 1, height: 20, fontSize: 11 }} />
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          icon={<LocalFireDepartmentIcon fontSize="small" />}
                          label={`${entry.streak_days} hari`}
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
