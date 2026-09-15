'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SensorsIcon from '@mui/icons-material/Sensors';
import { useProjectStore } from '@/lib/store';

const NewChannelPage = () => {
  const router = useRouter();
  const { themeMode, addChannel } = useProjectStore();
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('table_watcher');
  const [targetTable, setTargetTable] = useState('');
  const [authLevel, setAuthLevel] = useState('authenticated');
  const [triggers, setTriggers] = useState({
    insert: true,
    update: true,
    delete: true,
    custom: false,
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTables, setExistingTables] = useState<{ id: number; table_name: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/tables')
      .then((res) => res.json())
      .then((data) => setExistingTables(data.tables || []))
      .catch(() => setExistingTables([]));
  }, []);

  const handleTriggerChange = (key: keyof typeof triggers) => {
    setTriggers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }
    if (channelType === 'table_watcher' && !targetTable) {
      setError('Please select a target table for Table Watcher');
      return;
    }

    setIsDeploying(true);
    setError(null);

    const typeLabels: Record<string, string> = {
      table_watcher: 'Table Watcher',
      pubsub: 'Pub/Sub Broadcast',
      presence: 'Presence & Status',
      direct: 'Direct P2P Relay',
    };

    addChannel({
      id: `ch-${Date.now()}`,
      name: channelName.trim(),
      type: typeLabels[channelType] || channelType,
      targetTable: channelType === 'table_watcher' ? targetTable : '-',
      authLevel,
      triggers,
      clientsCount: 0,
      eventsCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    setTimeout(() => {
      setIsDeploying(false);
      router.push('/wsstore');
    }, 400);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link href="/wsstore" style={{ textDecoration: 'none' }}>
          <IconButton
            sx={{
              borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: 2,
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Link>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: themeMode === 'light' ? '#202124' : '#f5f5f4',
            }}
          >
            Create WebSocket Channel
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              mt: 0.5,
            }}
          >
            Configure real-time event broadcasting and database mutation streams.
          </Typography>
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: themeMode === 'light' ? '#e8f0fe' : '#2e2a28',
          borderColor: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: themeMode === 'light' ? '#1a73e8' : '#d7ccc8',
            fontSize: '0.85rem',
          }}
        >
          <strong>Notice:</strong> Once published, clients can subscribe instantly using <code>/api/v1/ws?channel=YOUR_CHANNEL</code>.
        </Typography>
      </Paper>

      {error && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderColor: '#f2b8b5',
            bgcolor: '#fce8e6',
            color: '#c5221f',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
              border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: themeMode === 'light' ? '#202124' : '#f5f5f4',
                mb: 2.5,
              }}
            >
              Channel Configuration
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Channel Name"
                placeholder="e.g. stream:orders, broadcast:alerts, presence:lobby"
                variant="outlined"
                size="small"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9_:-]/g, ''))}
                required
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ flex: 1, minWidth: 220 }}>
                  <InputLabel id="channel-type-label">Channel Type</InputLabel>
                  <Select
                    labelId="channel-type-label"
                    label="Channel Type"
                    value={channelType}
                    onChange={(e) => setChannelType(e.target.value)}
                  >
                    <MenuItem value="table_watcher">Table Watcher (CDC)</MenuItem>
                    <MenuItem value="pubsub">Pub/Sub Broadcaster</MenuItem>
                    <MenuItem value="presence">Presence & Status</MenuItem>
                    <MenuItem value="direct">Direct P2P Relay</MenuItem>
                  </Select>
                </FormControl>

                {channelType === 'table_watcher' && (
                  <FormControl size="small" sx={{ flex: 1, minWidth: 220 }}>
                    <InputLabel id="target-table-label">Target Database Table</InputLabel>
                    <Select
                      labelId="target-table-label"
                      label="Target Database Table"
                      value={targetTable}
                      onChange={(e) => setTargetTable(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Select Table</MenuItem>
                      {existingTables.map((t) => (
                        <MenuItem key={t.id} value={t.table_name}>
                          {t.table_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
                  <InputLabel id="auth-level-label">Access Control</InputLabel>
                  <Select
                    labelId="auth-level-label"
                    label="Access Control"
                    value={authLevel}
                    onChange={(e) => setAuthLevel(e.target.value)}
                  >
                    <MenuItem value="authenticated">Authenticated Session Only</MenuItem>
                    <MenuItem value="public_readonly">Public Read-Only</MenuItem>
                    <MenuItem value="public_readwrite">Public Read & Write</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>

          {channelType === 'table_watcher' && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
                border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: themeMode === 'light' ? '#202124' : '#f5f5f4',
                  mb: 1.5,
                }}
              >
                Event Triggers
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
                  mb: 2,
                }}
              >
                Select which database actions will broadcast a WebSocket event frame to listeners.
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={triggers.insert}
                      onChange={() => handleTriggerChange('insert')}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">INSERT (On row creation)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={triggers.update}
                      onChange={() => handleTriggerChange('update')}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">UPDATE (On row modification)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={triggers.delete}
                      onChange={() => handleTriggerChange('delete')}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">DELETE (On row removal)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={triggers.custom}
                      onChange={() => handleTriggerChange('custom')}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Custom RPC Events</Typography>}
                />
              </Box>
            </Paper>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Link href="/wsstore" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                sx={{
                  color: themeMode === 'light' ? '#3c4043' : '#d7ccc8',
                  borderColor: themeMode === 'light' ? '#dadce0' : '#3e3a38',
                }}
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SensorsIcon />}
              disabled={isDeploying}
              sx={{
                bgcolor: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                color: themeMode === 'light' ? '#ffffff' : '#121212',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: themeMode === 'light' ? '#1557b0' : '#d7ccc8',
                },
              }}
            >
              {isDeploying ? 'Activating...' : 'Activate Channel'}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default NewChannelPage;
