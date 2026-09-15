'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import SensorsIcon from '@mui/icons-material/Sensors';
import HubIcon from '@mui/icons-material/Hub';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import StorageIcon from '@mui/icons-material/Storage';
import { useProjectStore } from '@/lib/store';

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  themeMode,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  themeMode: 'light' | 'dark';
}) => (
  <Card
    variant="outlined"
    sx={{
      bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
      border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
      borderRadius: 2,
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: themeMode === 'light' ? '#202124' : '#f5f5f4',
              mt: 1,
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              mt: 0.5,
              display: 'block',
            }}
          >
            {subtitle}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            bgcolor: themeMode === 'light' ? '#e8f0fe' : '#2e2a28',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const WSStorePage = () => {
  const { themeMode, channels, deleteChannel } = useProjectStore();
  const [tables, setTables] = useState<{ id: number; table_name: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
      }
    } catch {
      setTables([]);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCopyEndpoint = (channelName: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = origin.replace(/^https?:\/\//, '');
    const fullUrl = `${protocol}//${host}/api/v1/ws?channel=${channelName}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(channelName);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteChannel = (id: string) => {
    if (confirm('Are you sure you want to delete this channel?')) {
      deleteChannel(id);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: themeMode === 'light' ? '#202124' : '#f5f5f4',
            }}
          >
            WSStore Real-Time Hub
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              mt: 0.5,
            }}
          >
            Manage live WebSocket channels, event broadcasters, and table subscriptions.
          </Typography>
        </Box>
        <Link href="/wsstore/new" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
              color: themeMode === 'light' ? '#ffffff' : '#121212',
              fontWeight: 600,
              '&:hover': {
                bgcolor: themeMode === 'light' ? '#1557b0' : '#d7ccc8',
              },
            }}
          >
            New Channel
          </Button>
        </Link>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="ACTIVE CHANNELS"
            value={channels.length}
            subtitle="Configured streams"
            icon={<HubIcon sx={{ color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4' }} />}
            themeMode={themeMode}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="SYNCED TABLES"
            value={tables.length}
            subtitle="Monitored database tables"
            icon={<StorageIcon sx={{ color: '#34a853' }} />}
            themeMode={themeMode}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="CONNECTED SUBSCRIBERS"
            value={channels.reduce((acc, c) => acc + (c.clientsCount || 0), 0)}
            subtitle="Live socket sessions"
            icon={<SensorsIcon sx={{ color: '#ea4335' }} />}
            themeMode={themeMode}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="EVENT DISPATCHES"
            value={channels.reduce((acc, c) => acc + (c.eventsCount || 0), 0)}
            subtitle="Total real-time frames"
            icon={<FlashOnIcon sx={{ color: '#fbbc04' }} />}
            themeMode={themeMode}
          />
        </Grid>
      </Grid>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          boxShadow: 'none',
          borderRadius: 2,
          bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
          border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
            bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: themeMode === 'light' ? '#202124' : '#f5f5f4',
              }}
            >
              Real-time Channels & Streams
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              }}
            >
              WebSocket stream listeners configured for your system
            </Typography>
          </Box>
          <Chip
            size="small"
            label="Engine Socket: Active"
            sx={{
              bgcolor: themeMode === 'light' ? '#e6f4ea' : '#1c3829',
              color: themeMode === 'light' ? '#137333' : '#81c995',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        {channels.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '50%',
                bgcolor: themeMode === 'light' ? '#f1f3f4' : '#2e2a28',
                display: 'inline-flex',
                color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              }}
            >
              <HubIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="body2" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e' }}>
              No real-time channels created yet. Create your first channel to begin streaming.
            </Typography>
            <Link href="/wsstore/new" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{
                  borderColor: themeMode === 'light' ? '#dadce0' : '#3e3a38',
                  color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                }}
              >
                Create Channel
              </Button>
            </Link>
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: themeMode === 'light' ? '#f8f9fa' : '#181614' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e', py: 1.5 }}>
                  Channel Name
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e', py: 1.5 }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e', py: 1.5 }}>
                  Target Table
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e', py: 1.5 }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e', py: 1.5 }}>
                  WSS Endpoint
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: themeMode === 'light' ? '#5f6368' : '#a8a29e', py: 1.5 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {channels.map((channel) => (
                <TableRow
                  key={channel.id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                      }}
                    >
                      {channel.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={channel.type}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        height: 22,
                        borderColor: themeMode === 'light' ? '#dadce0' : '#3e3a38',
                        color: themeMode === 'light' ? '#3c4043' : '#d7ccc8',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: themeMode === 'light' ? '#202124' : '#f5f5f4',
                      }}
                    >
                      {channel.targetTable || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: channel.status === 'active' ? '#34a853' : '#fbbc04',
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: themeMode === 'light' ? '#3c4043' : '#d7ccc8',
                          textTransform: 'capitalize',
                        }}
                      >
                        {channel.status}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          p: '4px 8px',
                          bgcolor: themeMode === 'light' ? '#f1f3f4' : '#2e2a28',
                          border: '1px solid',
                          borderColor: themeMode === 'light' ? '#dadce0' : '#3e3a38',
                          borderRadius: 1,
                          color: themeMode === 'light' ? '#b06000' : '#e0a96d',
                        }}
                      >
                        /api/v1/ws?channel={channel.name}
                      </Box>
                      <Tooltip title="Copy WSS Endpoint">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyEndpoint(channel.name)}
                          sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e' }}
                        >
                          {copiedId === channel.name ? (
                            <CheckIcon fontSize="inherit" sx={{ color: '#34a853' }} />
                          ) : (
                            <ContentCopyIcon fontSize="inherit" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete Channel">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteChannel(channel.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default WSStorePage;
