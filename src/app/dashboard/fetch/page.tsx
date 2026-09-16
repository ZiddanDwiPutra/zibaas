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
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const FetchPage = () => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseData, setResponseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/api/v1/`);
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponseStatus(null);
    setResponseHeaders({});
    setResponseData(null);

    try {
      const options: RequestInit = {
        method,
        headers: {},
      };

      if (method === 'POST' || method === 'PUT') {
        options.headers = {
          'Content-Type': 'application/json',
        };
        try {
          if (requestBody.trim()) {
            options.body = JSON.stringify(JSON.parse(requestBody));
          }
        } catch {
          throw new Error('Invalid JSON format in Request Body');
        }
      }

      const res = await fetch(url, options);
      setResponseStatus(res.status);

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setResponseHeaders(headersObj);

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        setResponseData(json);
      } else {
        const text = await res.text();
        setResponseData(text);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'info';
    if (status >= 400 && status < 500) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 1000, mx: 'auto', width: '100%' }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          API Tester Client
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Test and execute your generated API endpoints.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2, bgcolor: 'background.paper' }}>
        <form onSubmit={handleSend}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', sm: 'center' },
              }}
            >
              <FormControl sx={{ width: { xs: '100%', sm: 130 } }} size="small">
                <InputLabel id="method-select-label">Method</InputLabel>
                <Select
                  labelId="method-select-label"
                  value={method}
                  label="Method"
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="API Endpoint URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                sx={{ flex: 1 }}
              />

              <Button
                variant="contained"
                type="submit"
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                disabled={isLoading}
                sx={{
                  px: 3,
                  py: { xs: 1, sm: 0.75 },
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Send
              </Button>
            </Box>

            {(method === 'POST' || method === 'PUT') && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
                  Request Body (JSON)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder='{\n  "key": "value"\n}'
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    '& .MuiInputBase-input': { fontFamily: 'monospace' }
                  }}
                />
              </Box>
            )}
          </Box>
        </form>
      </Paper>

      {(responseStatus !== null || error || isLoading) && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Response
            </Typography>
            {responseStatus !== null && (
              <Chip
                label={`Status: ${responseStatus}`}
                color={getStatusColor(responseStatus)}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2, bgcolor: (t) => t.palette.mode === 'light' ? '#fce8e6' : '#2d1f1e', color: '#c5221f', borderRadius: 1.5 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                Error: {error}
              </Typography>
            </Box>
          )}

          {!isLoading && responseData !== null && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  RESPONSE BODY
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: (t) => t.palette.mode === 'light' ? '#202124' : '#121212',
                    color: (t) => t.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                    border: (t) => t.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                    borderRadius: 1.5,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '400px'
                  }}
                >
                  {typeof responseData === 'object'
                    ? JSON.stringify(responseData, null, 2)
                    : responseData}
                </Box>
              </Box>

              {Object.keys(responseHeaders).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    RESPONSE HEADERS
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      overflowX: 'auto',
                      maxHeight: '200px',
                      wordBreak: 'break-all'
                    }}
                  >
                    {Object.entries(responseHeaders).map(([key, val]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {val}
                      </div>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FetchPage;
