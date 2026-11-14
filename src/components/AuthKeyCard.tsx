'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoRenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface AuthKeyCardProps {
  authSecretKey: string;
  onKeyChange: (newKey: string) => void;
}

export const AuthKeyCard: React.FC<AuthKeyCardProps> = ({ authSecretKey, onKeyChange }) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!authSecretKey) return;
    try {
      await navigator.clipboard.writeText(authSecretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleGenerateNewKey = () => {
    // Generate secure 32-byte hex string
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    onKeyChange(hex);
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          Client Auth & Encryption Key
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This 32-byte secret key is shared between ZiBaaS and your frontend/client app. 
          It is used to encrypt login payloads (AES-256-GCM) and sign valid session JWTs.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          label="Secret Encryption Key (Shared with Client App)"
          variant="outlined"
          size="small"
          fullWidth
          type={showKey ? 'text' : 'password'}
          value={authSecretKey}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="Klik 'Generate Key' jika belum ada"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showKey ? 'Hide key' : 'Show key'}>
                    <IconButton onClick={() => setShowKey(!showKey)} edge="end" size="small">
                      {showKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                    <IconButton onClick={handleCopy} disabled={!authSecretKey} edge="end" size="small" sx={{ ml: 0.5 }}>
                      {copied ? <CheckCircleIcon color="success" fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Simpan key ini di file environment aplikasi kamu (misal <code>ZIBAAS_AUTH_KEY</code>).
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoRenewIcon />}
            onClick={handleGenerateNewKey}
            sx={{ textTransform: 'none' }}
          >
            Generate Key Baru
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
