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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddBoxIcon from '@mui/icons-material/AddBox';
import MenuIcon from '@mui/icons-material/Menu';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import IconButton from '@mui/material/IconButton';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Tooltip from '@mui/material/Tooltip';
import HelpIcon from '@mui/icons-material/Help';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import { useProjectStore } from '@/lib/store';

const drawerWidth = 240;

const SidebarItem = ({
  label,
  href,
  icon,
  pathname,
  isMinimized,
  themeMode,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  pathname: string;
  isMinimized: boolean;
  themeMode: 'light' | 'dark';
}) => {
  const isSelected = pathname === href;
  return (
    <ListItem disablePadding>
      <Link href={href} style={{ textDecoration: 'none', width: '100%' }}>
        <ListItemButton
          selected={isSelected}
          sx={{
            borderRadius: '0 20px 20px 0',
            mr: 1,
            justifyContent: isMinimized ? 'center' : 'initial',
            px: isMinimized ? 1.5 : 2,
            '&.Mui-selected': {
              bgcolor: themeMode === 'light' ? '#e8f0fe' : '#2e2a28',
              color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
              '& .MuiListItemIcon-root': { color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: isMinimized ? 0 : 36, mr: isMinimized ? 'auto' : 0, justifyContent: 'center' }}>
            {icon}
          </ListItemIcon>
          {!isMinimized && (
            <ListItemText>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: isSelected ? 600 : 500 }}>
                {label}
              </Typography>
            </ListItemText>
          )}
        </ListItemButton>
      </Link>
    </ListItem>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { project, setProject, themeMode, toggleThemeMode } = useProjectStore();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const currentDrawerWidth = isMinimized ? 64 : drawerWidth;

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'Create Table', href: '/dashboard/new', icon: <AddBoxIcon fontSize="small" /> },
    { label: 'Fetch', href: '/dashboard/fetch', icon: <SendIcon fontSize="small" /> },
    { label: 'Settings', href: '/dashboard/settings', icon: <SettingsIcon fontSize="small" /> },
    { label: 'User Guide', href: '/dashboard/guide', icon: <HelpIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: themeMode === 'light' ? '#f8f9fa' : '#121212' }}>
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
        <Toolbar variant="dense" sx={{ minHeight: 48, px: 2, gap: 2 }}>
          <IconButton color="inherit" onClick={() => setIsMinimized(!isMinimized)} edge="start" size="small">
            <MenuIcon />
          </IconButton>
          <CloudQueueIcon />
          <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600 }}>
            Zibaas
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: themeMode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', mx: 1 }} />
          <FormControl size="small" variant="standard" sx={{ m: 1, minWidth: 160 }}>
            <Select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disableUnderline
              sx={{
                color: themeMode === 'light' ? '#ffffff' : '#f5f5f4',
                fontSize: '0.875rem',
                fontWeight: 500,
                '& .MuiSelect-icon': { color: themeMode === 'light' ? '#ffffff' : '#f5f5f4' },
              }}
            >
              <MenuItem value="zibaas-default-project">zibaas-default-project</MenuItem>
              <MenuItem value="zibaas-development">zibaas-development</MenuItem>
              <MenuItem value="zibaas-production">zibaas-production</MenuItem>
            </Select>
          </FormControl>
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

      <Drawer
        variant="permanent"
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            borderRight: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
            bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
            top: 48,
            height: 'calc(100vh - 48px)',
            transition: 'width 0.2s ease-in-out',
            overflowX: 'hidden',
          },
          transition: 'width 0.2s ease-in-out',
        }}
      >
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ p: 1 }}>
            <List>
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  pathname={pathname}
                  isMinimized={isMinimized}
                  themeMode={themeMode}
                />
              ))}
            </List>
          </Box>

          {!isMinimized && (
            <Box sx={{ mt: 'auto', p: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: themeMode === 'light' ? '#f1f3f4' : '#2e2a28',
                  borderRadius: 1,
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
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4, pt: 8 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
