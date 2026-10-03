import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import ClassIcon from '@mui/icons-material/MenuBook';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { api } from '../api/client';
import type { NotificationDTO } from '../api/types';
import Brand from './Brand';

const DRAWER_WIDTH = 260;

const NAV_LINKS = [
  { to: '/dashboard', label: 'Beranda', icon: <DashboardIcon /> },
  { to: '/classes', label: 'Katalog Kelas', icon: <ClassIcon /> },
  { to: '/leaderboard', label: 'Papan Peringkat', icon: <EmojiEventsIcon /> },
  { to: '/profile', label: 'Profil', icon: <PersonIcon /> },
];

const ADMIN_LINKS = [{ to: '/admin', label: 'Kelola Kursus', icon: <AdminPanelSettingsIcon /> }];
const ADMIN_ONLY_LINKS = [{ to: '/admin/users', label: 'Kelola Pengguna', icon: <GroupIcon /> }];

export default function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdminOrInstructor, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const loadNotifications = () => {
    api.get<{ notifications: NotificationDTO[]; unreadCount: number }>('/auth/notifications').then((res) => {
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    });
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: NotificationDTO) => {
    setNotifAnchor(null);
    if (!notification.read) {
      await api.put(`/auth/notifications/${notification.id}/read`);
      loadNotifications();
    }
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    await api.put('/auth/notifications/read-all');
    loadNotifications();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/auth/notifications/${id}`);
    loadNotifications();
  };

  const handleClearRead = async () => {
    await api.delete('/auth/notifications/read');
    loadNotifications();
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Keluar',
      message: 'Yakin ingin keluar dari akun ini?',
      confirmText: 'Ya, Keluar',
    });
    if (!ok) return;
    logout();
    navigate('/');
  };

  const notificationBell = (
    <>
      <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} aria-label="Notifikasi">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
          <Typography variant="subtitle2">Notifikasi</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {notifications.some((n) => n.read) && (
              <Button size="small" onClick={handleClearRead}>
                Bersihkan yang dibaca
              </Button>
            )}
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead}>
                Tandai semua dibaca
              </Button>
            )}
          </Box>
        </Box>
        <Divider />
        {notifications.length === 0 && (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Belum ada notifikasi
            </Typography>
          </Box>
        )}
        {notifications.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => handleNotificationClick(n)}
            sx={{
              whiteSpace: 'normal',
              alignItems: 'flex-start',
              bgcolor: n.read ? 'transparent' : 'primary.light',
              py: 1.25,
              pr: 5,
              position: 'relative',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                {n.message}
                {!n.read && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: 'primary.main', fontWeight: 700 }}>
                    Baru
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {new Date(n.created_at).toLocaleString('id-ID')}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => handleDeleteNotification(e, n.id)}
              aria-label="Hapus notifikasi"
              sx={{
                position: 'absolute',
                right: 4,
                top: 4,
                opacity: 0.5,
                '&:hover': { opacity: 1 },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  const navItem = (link: { to: string; label: string; icon: React.ReactNode }) => (
    <ListItemButton
      key={link.to}
      component={NavLink}
      to={link.to}
      onClick={() => setMobileOpen(false)}
      sx={{
        borderRadius: 2,
        mx: 1,
        mb: 0.5,
        '&.active': {
          backgroundColor: 'primary.light',
          color: 'primary.main',
          '& .MuiListItemIcon-root': { color: 'primary.main' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>{link.icon}</ListItemIcon>
      <ListItemText primary={link.label} slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }} />
    </ListItemButton>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 3 }}>
        <Brand />
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, pt: 2 }}>
        {NAV_LINKS.map(navItem)}
        {isAdminOrInstructor && (
          <>
            <Typography
              variant="overline"
              sx={{ display: 'block', px: 3, mt: 2, mb: 0.5, fontSize: 11 }}
            >
              {isAdmin ? 'Admin' : 'Kelola'}
            </Typography>
            {ADMIN_LINKS.map(navItem)}
            {isAdmin && ADMIN_ONLY_LINKS.map(navItem)}
          </>
        )}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
            {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
              {user?.full_name ?? 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
              {user?.role ?? 'member'}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          size="small"
        >
          Keluar
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }} aria-label="Buka menu">
              <MenuIcon />
            </IconButton>
            <Brand size={28} />
            <Box sx={{ flexGrow: 1 }} />
            {notificationBell}
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: isMobile ? 8 : 0,
          p: { xs: 2, md: 4 },
        }}
      >
        {!isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>{notificationBell}</Box>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
