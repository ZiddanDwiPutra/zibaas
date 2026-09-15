'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import HomeIcon from '@mui/icons-material/Home';
import FireIcon from '@mui/icons-material/Fireplace';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useProjectStore } from '@/lib/store';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

const AppHeader = ({ onToggleSidebar }: AppHeaderProps) => {
  const pathname = usePathname();
  const { themeMode, toggleThemeMode } = useProjectStore();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const isDashboardActive = pathname.startsWith('/dashboard');
  const isWSStoreActive = pathname.startsWith('/wsstore');

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: themeMode === 'light' ? '#1a73e8' : '#1e1b18',
        color: themeMode === 'light' ? '#ffffff' : '#f5f5f4',
        height: 48,
        borderBottom: themeMode === 'light' ? 'none' : '1px solid #2e2a28',
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 48, px: 2, gap: 1.5 }}>
        {onToggleSidebar && (
          <IconButton color="inherit" onClick={onToggleSidebar} edge="start" size="small">
            <MenuIcon />
          </IconButton>
        )}
        <Box
          component={Link}
          href="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'inherit',
            textDecoration: 'none',
            mr: 1,
          }}
        >
          <CloudQueueIcon />
          <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600 }}>
            Zibaas
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/dashboard"
          size="small"
          startIcon={<HomeIcon fontSize="small" />}
          sx={{
            color: 'inherit',
            textTransform: 'none',
            fontSize: '0.85rem',
            fontWeight: isDashboardActive ? 600 : 400,
            bgcolor: isDashboardActive
              ? themeMode === 'light'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.1)'
              : 'transparent',
            '&:hover': {
              bgcolor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
            },
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          HTTP APIs
        </Button>

        <Button
          component={Link}
          href="/wsstore"
          size="small"
          startIcon={<FireIcon fontSize="small" />}
          sx={{
            color: 'inherit',
            textTransform: 'none',
            fontSize: '0.85rem',
            fontWeight: isWSStoreActive ? 600 : 400,
            bgcolor: isWSStoreActive
              ? themeMode === 'light'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.1)'
              : 'transparent',
            '&:hover': {
              bgcolor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
            },
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          WSStore
        </Button>

        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Toggle theme">
          <IconButton color="inherit" onClick={toggleThemeMode} size="small">
            {themeMode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Sign out">
          <IconButton color="inherit" onClick={handleLogout} size="small">
            <ExitToAppIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
