'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';

const SettingsPage = () => {
  const [corsAllowAll, setCorsAllowAll] = useState(true);
  const [corsWhitelist, setCorsWhitelist] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load settings');
        return res.json();
      })
      .then((data) => {
        setCorsAllowAll(data.cors_allow_all !== false);
        setCorsWhitelist(data.cors_whitelist || '');
      })
      .catch((err) => {
        setMessage({ type: 'error', text: err.message });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cors_allow_all: corsAllowAll,
          cors_whitelist: corsWhitelist,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SecurityIcon sx={{ color: 'primary.main', fontSize: { xs: 28, sm: 32 } }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            API Gateway Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure CORS policies, security whitelists, and gateway integrations
          </Typography>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            Cross-Origin Resource Sharing (CORS)
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Determine which external web applications are permitted to call your API Gateway endpoints.
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={corsAllowAll}
              onChange={(e) => setCorsAllowAll(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Allow All Origins (Access-Control-Allow-Origin: *)</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Recommended for development and public sandbox environments.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', mt: 1, m: 0 }}
        />

        {!corsAllowAll && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Allowed Origin Whitelist
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Specify the allowed origins one per line or separated by commas (e.g. <code>https://myapp.com</code>, <code>http://localhost:3000</code>).
            </Typography>
            <TextField
              multiline
              rows={4}
              placeholder="https://myapp.com&#10;http://localhost:3000"
              variant="outlined"
              size="small"
              value={corsWhitelist}
              onChange={(e) => setCorsWhitelist(e.target.value)}
              fullWidth
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
            sx={{ width: { xs: '100%', sm: 'auto' }, py: { xs: 1, sm: 0.75 } }}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
