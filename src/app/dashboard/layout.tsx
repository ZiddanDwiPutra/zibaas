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
import { useProjectStore } from '@/lib/store';

const drawerWidth = 240;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { project, setProject } = useProjectStore();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#1a73e8',
          color: '#ffffff',
          height: 48,
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48, px: 2, gap: 2 }}>
          <MenuIcon />
          <CloudQueueIcon />
          <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600 }}>
            Zibaas
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />
          <FormControl size="small" variant="standard" sx={{ m: 1, minWidth: 160 }}>
            <Select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disableUnderline
              sx={{
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 500,
                '& .MuiSelect-icon': { color: '#ffffff' },
              }}
            >
              <MenuItem value="zibaas-default-project">zibaas-default-project</MenuItem>
              <MenuItem value="zibaas-development">zibaas-development</MenuItem>
              <MenuItem value="zibaas-production">zibaas-production</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
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
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #dadce0',
            bgcolor: '#ffffff',
            top: 48,
            height: 'calc(100vh - 48px)',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', justifyBetween: 'space-between' }}>
          <Box sx={{ p: 1 }}>
            <List>
              <ListItem disablePadding>
                <Link href="/dashboard" style={{ textDecoration: 'none', width: '100%' }}>
                  <ListItemButton
                    selected={pathname === '/dashboard'}
                    sx={{
                      borderRadius: '0 20px 20px 0',
                      mr: 1,
                      '&.Mui-selected': {
                        bgcolor: '#e8f0fe',
                        color: '#1a73e8',
                        '& .MuiListItemIcon-root': { color: '#1a73e8' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: pathname === '/dashboard' ? 600 : 500 }}>
                        Dashboard
                      </Typography>
                    </ListItemText>
                  </ListItemButton>
                </Link>
              </ListItem>

              <ListItem disablePadding>
                <Link href="/dashboard/new" style={{ textDecoration: 'none', width: '100%' }}>
                  <ListItemButton
                    selected={pathname === '/dashboard/new'}
                    sx={{
                      borderRadius: '0 20px 20px 0',
                      mr: 1,
                      '&.Mui-selected': {
                        bgcolor: '#e8f0fe',
                        color: '#1a73e8',
                        '& .MuiListItemIcon-root': { color: '#1a73e8' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AddBoxIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: pathname === '/dashboard/new' ? 600 : 500 }}>
                        Create Table
                      </Typography>
                    </ListItemText>
                  </ListItemButton>
                </Link>
              </ListItem>
              <ListItem disablePadding>
                <Link href="/dashboard/guide" style={{ textDecoration: 'none', width: '100%' }}>
                  <ListItemButton
                    selected={pathname === '/dashboard/guide'}
                    sx={{
                      borderRadius: '0 20px 20px 0',
                      mr: 1,
                      '&.Mui-selected': {
                        bgcolor: '#e8f0fe',
                        color: '#1a73e8',
                        '& .MuiListItemIcon-root': { color: '#1a73e8' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <HelpIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: pathname === '/dashboard/guide' ? 600 : 500 }}>
                        User Guide
                      </Typography>
                    </ListItemText>
                  </ListItemButton>
                </Link>
              </ListItem>
            </List>
          </Box>

          <Box sx={{ mt: 'auto', p: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#f1f3f4',
                borderRadius: 1,
                border: '1px solid #dadce0',
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#5f6368', mb: 0.5 }}>
                DATABASE STATUS
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#34a853', borderRadius: '50%' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#3c4043' }}>
                  Connected to Engine
                </Typography>
              </Box>
            </Box>
          </Box>
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
