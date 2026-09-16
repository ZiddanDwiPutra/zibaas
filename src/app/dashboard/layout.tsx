'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddBoxIcon from '@mui/icons-material/AddBox';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import IconButton from '@mui/material/IconButton';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Tooltip from '@mui/material/Tooltip';
import HelpIcon from '@mui/icons-material/Help';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import RateReviewIcon from '@mui/icons-material/RateReview';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useProjectStore } from '@/lib/store';

const DRAWER_WIDTH = 250;

interface SidebarItemProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  pathname: string;
  isMinimized: boolean;
  themeMode: 'light' | 'dark';
  onClick?: () => void;
}

const SidebarItem = ({
  label,
  href,
  icon,
  pathname,
  isMinimized,
  themeMode,
  onClick,
}: SidebarItemProps) => {
  const isSelected = pathname === href;
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <Link href={href} style={{ textDecoration: 'none', width: '100%' }} onClick={onClick}>
        <ListItemButton
          selected={isSelected}
          sx={{
            borderRadius: isMinimized ? 2 : '0 24px 24px 0',
            mr: isMinimized ? 0 : 1.5,
            justifyContent: isMinimized ? 'center' : 'initial',
            px: isMinimized ? 1.5 : 2.5,
            py: 1.25,
            '&.Mui-selected': {
              bgcolor: themeMode === 'light' ? '#e8f0fe' : '#2e2a28',
              color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
              '& .MuiListItemIcon-root': { color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: isMinimized ? 0 : 38, mr: isMinimized ? 'auto' : 0, justifyContent: 'center' }}>
            {icon}
          </ListItemIcon>
          {!isMinimized && (
            <ListItemText>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500 }}>
                {label}
              </Typography>
            </ListItemText>
          )}
        </ListItemButton>
      </Link>
    </ListItem>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { themeMode, toggleThemeMode } = useProjectStore();
  const [isDesktopMinimized, setIsDesktopMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsDesktopMinimized(!isDesktopMinimized);
    }
  };

  const closeMobileDrawer = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'Create Table', href: '/dashboard/new', icon: <AddBoxIcon fontSize="small" /> },
    { label: 'Fetch', href: '/dashboard/fetch', icon: <SendIcon fontSize="small" /> },
    { label: 'Settings', href: '/dashboard/settings', icon: <SettingsIcon fontSize="small" /> },
    { label: 'Feedback', href: '/dashboard/feedback', icon: <RateReviewIcon fontSize="small" /> },
    { label: 'User Guide', href: '/dashboard/guide', icon: <HelpIcon fontSize="small" /> },
  ];

  const drawerContent = (isMini: boolean) => (
    <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <Box sx={{ p: 1.5 }}>
        {isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 1.5, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudQueueIcon sx={{ color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Zibaas
              </Typography>
            </Box>
            <IconButton onClick={() => setMobileOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <List sx={{ pt: isMobile ? 0 : 1 }}>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              pathname={pathname}
              isMinimized={isMini}
              themeMode={themeMode}
              onClick={closeMobileDrawer}
            />
          ))}
        </List>
      </Box>

      {!isMini && (
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              mb: 1.5,
              py: 1,
              px: 1.5,
              bgcolor: themeMode === 'light' ? '#f1f3f4' : '#2e2a28',
              borderRadius: 1.5,
              border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #3e3a38',
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e' }}>
              Version {process.env.version || '1.1.0'}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              bgcolor: themeMode === 'light' ? '#f1f3f4' : '#2e2a28',
              borderRadius: 1.5,
              border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #3e3a38',
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e', mb: 0.5 }}>
              DATABASE STATUS
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: '#34a853', borderRadius: '50%' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: themeMode === 'light' ? '#3c4043' : '#f5f5f4' }}>
                Connected to Engine
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const desktopDrawerWidth = isDesktopMinimized ? 68 : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: themeMode === 'light' ? '#f8f9fa' : '#121212' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: themeMode === 'light' ? '#1a73e8' : '#1e1b18',
          color: themeMode === 'light' ? '#ffffff' : '#f5f5f4',
          height: 52,
          borderBottom: themeMode === 'light' ? 'none' : '1px solid #2e2a28',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 52, px: { xs: 1.5, sm: 2 }, gap: 1.5 }}>
          <IconButton color="inherit" onClick={handleDrawerToggle} edge="start" size="small">
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudQueueIcon />
            <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 700 }}>
              Zibaas
            </Typography>
          </Box>
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

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobileDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: { xs: '82vw', sm: 300 },
              maxWidth: 320,
              boxSizing: 'border-box',
              bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
              borderRight: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
            },
          }}
        >
          {drawerContent(false)}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: desktopDrawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: desktopDrawerWidth,
              boxSizing: 'border-box',
              borderRight: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
              bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
              top: 52,
              height: 'calc(100vh - 52px)',
              transition: 'width 0.2s ease-in-out',
              overflowX: 'hidden',
            },
            transition: 'width 0.2s ease-in-out',
          }}
        >
          {drawerContent(isDesktopMinimized)}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${desktopDrawerWidth}px)` },
          minWidth: 0,
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 8.5, sm: 9, md: 9.5 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
