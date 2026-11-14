'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import Chip from '@mui/material/Chip';

interface TableAuthConfigProps {
  enableAuth: boolean;
  onEnableAuthChange: (enabled: boolean) => void;
  userIdColumn: string;
  onUserIdColumnChange: (column: string) => void;
  availableColumns: string[];
}

export const TableAuthConfig: React.FC<TableAuthConfigProps> = ({
  enableAuth,
  onEnableAuthChange,
  userIdColumn,
  onUserIdColumnChange,
  availableColumns,
}) => {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {enableAuth ? (
            <LockIcon sx={{ color: 'warning.main', fontSize: 20 }} />
          ) : (
            <LockOpenIcon sx={{ color: 'success.main', fontSize: 20 }} />
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Table Access & Authentication Mode
          </Typography>
        </Box>
        <Chip
          label={enableAuth ? 'Protected (Auth Required)' : 'Open (Public / Vendor Key)'}
          color={enableAuth ? 'warning' : 'default'}
          size="small"
          variant="outlined"
        />
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        Tentukan apakah data dalam tabel ini dapat diakses secara publik atau memerlukan User Session JWT (Row-Level Security).
      </Typography>

      <RadioGroup
        row
        value={enableAuth ? 'protected' : 'open'}
        onChange={(e) => onEnableAuthChange(e.target.value === 'protected')}
        sx={{ mb: enableAuth ? 2.5 : 0 }}
      >
        <FormControlLabel
          value="open"
          control={<Radio size="small" />}
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Open (Public)</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Bebas diakses tanpa token user (hanya butuh x-api-key jika diaktifkan).
              </Typography>
            </Box>
          }
          sx={{ mr: { xs: 0, sm: 4 }, mb: { xs: 1.5, sm: 0 }, alignItems: 'flex-start' }}
        />
        <FormControlLabel
          value="protected"
          control={<Radio size="small" />}
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Protected (User Session)</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Wajib Authorization: Bearer &lt;token&gt; dan disaring otomatis berdasarkan User ID.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start' }}
        />
      </RadioGroup>

      {enableAuth && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
            User ID Column (Kolom Pemilik Data)
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Pilih kolom di tabel ini yang menyimpan ID pengguna (contoh: <code>user_id</code> atau <code>author_id</code>). 
            Data yang diambil atau diinput akan otomatis disesuaikan dengan ID pemilik di token session.
          </Typography>

          <FormControl size="small" sx={{ maxWidth: 300, mt: 0.5 }}>
            <InputLabel id="user-id-column-label">Pilih Kolom Pemilik</InputLabel>
            <Select
              labelId="user-id-column-label"
              label="Pilih Kolom Pemilik"
              value={userIdColumn || ''}
              onChange={(e) => onUserIdColumnChange(e.target.value)}
            >
              <MenuItem value="id">id (Primary Key)</MenuItem>
              {availableColumns
                .filter((colName) => colName !== 'id')
                .map((colName) => (
                  <MenuItem key={colName} value={colName}>
                    {colName}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </Paper>
  );
};
