'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HubIcon from '@mui/icons-material/Hub';
import { useProjectStore } from '@/lib/store';

interface LogFrame {
  id: string;
  timestamp: string;
  direction: 'IN' | 'OUT';
  event: string;
  payload: any;
}

const WSChannelTesterPage = () => {
  const { themeMode, channels } = useProjectStore();
  const [selectedChannel, setSelectedChannel] = useState('');
  const [manualChannel, setManualChannel] = useState('stream:orders');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [eventName, setEventName] = useState('message');
  const [payloadText, setPayloadText] = useState('{\n  "message": "Hello from WSStore client!",\n  "sender": "admin"\n}');
  const [logs, setLogs] = useState<LogFrame[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeChannelName = manualChannel.trim() || selectedChannel || 'stream:orders';

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].name);
      setManualChannel(channels[0].name);
    }
  }, [channels, selectedChannel]);

  const handleChannelSelectChange = (value: string) => {
    setSelectedChannel(value);
    setManualChannel(value);
  };

  const handleConnectToggle = () => {
    if (isConnected) {
      setIsConnected(false);
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'IN',
          event: 'system:disconnected',
          payload: { status: 'Closed', channel: activeChannelName },
        },
        ...prev,
      ]);
    } else {
      setIsConnecting(true);
      setError(null);
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        setLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            direction: 'IN',
            event: 'system:connected',
            payload: {
              status: 'Handshake 101 Switching Protocols',
              channel: activeChannelName,
              session_id: `ws_sess_${Math.random().toString(36).substring(2, 9)}`,
            },
          },
          ...prev,
        ]);
      }, 500);
    }
  };

  const handleSendFrame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setError('Please connect to the channel before sending event frames.');
      return;
    }

    try {
      const parsedPayload = JSON.parse(payloadText);
      const newFrame: LogFrame = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        direction: 'OUT',
        event: eventName.trim() || 'message',
        payload: parsedPayload,
      };

      setLogs((prev) => [newFrame, ...prev]);
      setError(null);

      setTimeout(() => {
        const replyFrame: LogFrame = {
          id: `log-${Date.now() + 1}`,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'IN',
          event: `ack:${eventName.trim() || 'message'}`,
          payload: {
            received: true,
            channel: activeChannelName,
            echo: parsedPayload,
            server_time: new Date().toISOString(),
          },
        };
        setLogs((prev) => [replyFrame, ...prev]);
      }, 400);
    } catch {
      setError('Invalid JSON format in Message Payload');
    }
  };

  const handleApplyPreset = (type: 'ping' | 'chat' | 'cdc' | 'presence') => {
    if (type === 'ping') {
      setEventName('ping');
      setPayloadText('{\n  "type": "ping",\n  "client_time": ' + Date.now() + '\n}');
    } else if (type === 'chat') {
      setEventName('chat:message');
      setPayloadText('{\n  "user": "developer",\n  "text": "Real-time communication active!",\n  "room": "' + activeChannelName + '"\n}');
    } else if (type === 'cdc') {
      setEventName('database:insert');
      setPayloadText('{\n  "table": "orders",\n  "action": "INSERT",\n  "record": {\n    "id": 101,\n    "item": "Premium Plan",\n    "amount": 49.99\n  }\n}');
    } else if (type === 'presence') {
      setEventName('presence:update');
      setPayloadText('{\n  "user_id": "usr_99",\n  "status": "online",\n  "typing": false\n}');
    }
  };

  const handleCopyEndpoint = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = origin.replace(/^https?:\/\//, '');
    const fullUrl = `${protocol}//${host}/api/v1/ws?channel=${activeChannelName}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: themeMode === 'light' ? '#202124' : '#f5f5f4',
            }}
          >
            WebSocket Channel Tester
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
              mt: 0.5,
            }}
          >
            Connect to custom channels manually, publish event frames, and monitor live streaming payloads.
          </Typography>
        </Box>
        <Chip
          icon={<HubIcon fontSize="small" />}
          label={isConnected ? `Connected: ${activeChannelName}` : 'Disconnected'}
          sx={{
            bgcolor: isConnected
              ? themeMode === 'light'
                ? '#e6f4ea'
                : '#1c3829'
              : themeMode === 'light'
              ? '#f1f3f4'
              : '#2e2a28',
            color: isConnected
              ? themeMode === 'light'
                ? '#137333'
                : '#81c995'
              : themeMode === 'light'
              ? '#5f6368'
              : '#a8a29e',
            fontWeight: 700,
            fontSize: '0.8rem',
            px: 1,
            py: 2,
          }}
        />
      </Box>

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
            mb: 2,
          }}
        >
          Channel Connection Target
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {channels.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="preset-channel-label">Select Created Channel</InputLabel>
                <Select
                  labelId="preset-channel-label"
                  label="Select Created Channel"
                  value={selectedChannel}
                  onChange={(e) => handleChannelSelectChange(e.target.value)}
                >
                  {channels.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name} ({c.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              size="small"
              label="Manual Channel Name / Stream ID"
              placeholder="e.g. stream:orders, broadcast:alerts, custom:room"
              value={manualChannel}
              onChange={(e) => setManualChannel(e.target.value.toLowerCase().replace(/[^a-z0-9_:-]/g, ''))}
              sx={{ flex: 1, minWidth: 260 }}
              required
            />

            <Button
              variant="contained"
              onClick={handleConnectToggle}
              disabled={isConnecting}
              startIcon={isConnected ? <StopIcon /> : <PlayArrowIcon />}
              sx={{
                px: 3,
                bgcolor: isConnected
                  ? '#ea4335'
                  : themeMode === 'light'
                  ? '#1a73e8'
                  : '#bcaaa4',
                color: isConnected
                  ? '#ffffff'
                  : themeMode === 'light'
                  ? '#ffffff'
                  : '#121212',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: isConnected
                    ? '#c5221f'
                    : themeMode === 'light'
                    ? '#1557b0'
                    : '#d7ccc8',
                },
              }}
            >
              {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e', fontWeight: 600 }}>
              WSS URL:
            </Typography>
            <Box
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                p: '4px 10px',
                bgcolor: themeMode === 'light' ? '#f1f3f4' : '#2e2a28',
                border: '1px solid',
                borderColor: themeMode === 'light' ? '#dadce0' : '#3e3a38',
                borderRadius: 1,
                color: themeMode === 'light' ? '#b06000' : '#e0a96d',
              }}
            >
              /api/v1/ws?channel={activeChannelName}
            </Box>
            <Tooltip title="Copy WSS URL">
              <IconButton size="small" onClick={handleCopyEndpoint}>
                {copied ? <CheckIcon fontSize="small" sx={{ color: '#34a853' }} /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: '100%',
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
                mb: 2,
              }}
            >
              Send Event Frame
            </Typography>

            <form onSubmit={handleSendFrame}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Event Name"
                  placeholder="e.g. message, cdc:insert, ping"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: themeMode === 'light' ? '#5f6368' : '#a8a29e' }}>
                      Payload Presets:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label="Ping"
                        size="small"
                        clickable
                        onClick={() => handleApplyPreset('ping')}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      <Chip
                        label="Chat"
                        size="small"
                        clickable
                        onClick={() => handleApplyPreset('chat')}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      <Chip
                        label="CDC"
                        size="small"
                        clickable
                        onClick={() => handleApplyPreset('cdc')}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      <Chip
                        label="Presence"
                        size="small"
                        clickable
                        onClick={() => handleApplyPreset('presence')}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="JSON Frame Payload"
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                      },
                    }}
                    required
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SendIcon />}
                  disabled={!isConnected}
                  sx={{
                    bgcolor: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                    color: themeMode === 'light' ? '#ffffff' : '#121212',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: themeMode === 'light' ? '#1557b0' : '#d7ccc8',
                    },
                  }}
                >
                  Send Event Frame
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
              border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: themeMode === 'light' ? '#202124' : '#f5f5f4',
                  }}
                >
                  Live Frame Terminal
                </Typography>
                <Chip
                  label={`${logs.length} events`}
                  size="small"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setLogs([])}
                disabled={logs.length === 0}
                sx={{
                  fontSize: '0.75rem',
                  borderColor: themeMode === 'light' ? '#dadce0' : '#3e3a38',
                  color: themeMode === 'light' ? '#5f6368' : '#a8a29e',
                }}
              >
                Clear Terminal
              </Button>
            </Box>

            <Box
              sx={{
                flex: 1,
                minHeight: 320,
                maxHeight: 460,
                overflowY: 'auto',
                p: 2,
                borderRadius: 1.5,
                bgcolor: themeMode === 'light' ? '#f8f9fa' : '#121212',
                border: themeMode === 'light' ? '1px solid #dadce0' : '1px solid #2e2a28',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {logs.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 6, color: themeMode === 'light' ? '#5f6368' : '#a8a29e' }}>
                  <Typography variant="body2">
                    No WebSocket events recorded yet. Connect to a channel and send frames.
                  </Typography>
                </Box>
              ) : (
                logs.map((log) => (
                  <Paper
                    key={log.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: themeMode === 'light' ? '#ffffff' : '#1e1b18',
                      borderColor: themeMode === 'light' ? '#dadce0' : '#2e2a28',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={log.direction}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: log.direction === 'IN' ? '#34a853' : '#1a73e8',
                            color: '#ffffff',
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: themeMode === 'light' ? '#202124' : '#f5f5f4',
                          }}
                        >
                          {log.event}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: themeMode === 'light' ? '#5f6368' : '#a8a29e' }}>
                        {log.timestamp}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1,
                        bgcolor: themeMode === 'light' ? '#f8f9fa' : '#121212',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: themeMode === 'light' ? '#1a73e8' : '#bcaaa4',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(log.payload, null, 2)}
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WSChannelTesterPage;
