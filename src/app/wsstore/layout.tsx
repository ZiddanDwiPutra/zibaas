'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import HubIcon from '@mui/icons-material/Hub';
import AddBoxIcon from '@mui/icons-material/AddBox';
import SendIcon from '@mui/icons-material/Send';
import HelpIcon from '@mui/icons-material/Help';
import { useProjectStore } from '@/lib/store';
import AppHeader from '@/components/AppHeader';

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

const WSStoreLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { themeMode } = useProjectStore();
  const [isMinimized, setIsMinimized] = useState(false);

  const currentDrawerWidth = isMinimized ? 64 : drawerWidth;

  const menuItems = [
    { label: 'Channels Dashboard', href: '/wsstore', icon: <HubIcon fontSize="small" /> },
    { label: 'Create Channel', href: '/wsstore/new', icon: <AddBoxIcon fontSize="small" /> },
    { label: 'Channel Tester', href: '/wsstore/test', icon: <SendIcon fontSize="small" /> },
    { label: 'User Guide', href: '/wsstore/guide', icon: <HelpIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: themeMode === 'light' ? '#f8f9fa' : '#121212' }}>
      <AppHeader onToggleSidebar={() => setIsMinimized(!isMinimized)} />

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
                  WSSTORE ENGINE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, bgcolor: '#34a853', borderRadius: '50%' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: themeMode === 'light' ? '#3c4043' : '#f5f5f4' }}>
                    WebSocket Stream Active
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
};

export default WSStoreLayout;
