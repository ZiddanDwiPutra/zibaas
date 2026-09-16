'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid credentials');
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8f9fa',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card variant="outlined" sx={{ maxWidth: 440, width: '100%', borderRadius: 2, p: { xs: 1, sm: 2 }, bgcolor: '#ffffff' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, textAlign: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#e8f0fe',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a73e8',
              }}
            >
              <CloudQueueIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#202124', mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Sign in
            </Typography>
            <Typography variant="body2" sx={{ color: '#5f6368' }}>
              to continue to Zibaas Console
            </Typography>
          </Box>

          {error && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderColor: '#f2b8b5',
                bgcolor: '#fce8e6',
                color: '#c5221f',
                borderRadius: 1.5,
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                {error}
              </Typography>
            </Paper>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Username"
                placeholder="Enter admin username"
                size="small"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                placeholder="Enter password"
                size="small"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={isLoading}
                sx={{ bgcolor: '#1a73e8', py: 1.2, mt: 1, fontWeight: 600 }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
