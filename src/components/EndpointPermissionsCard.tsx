'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

export interface AllowedEndpoints {
  allow_get_list: boolean;
  allow_get_id: boolean;
  allow_post: boolean;
  allow_put: boolean;
  allow_delete: boolean;
}

interface EndpointPermissionsCardProps {
  allowedEndpoints: AllowedEndpoints;
  onChange: (updated: AllowedEndpoints) => void;
  tableName?: string;
}

export const EndpointPermissionsCard: React.FC<EndpointPermissionsCardProps> = ({
  allowedEndpoints,
  onChange,
  tableName = '{table}',
}) => {
  const togglePermission = (key: keyof AllowedEndpoints) => {
    onChange({
      ...allowedEndpoints,
      [key]: !allowedEndpoints[key],
    });
  };

  const endpointList = [
    {
      key: 'allow_get_list' as keyof AllowedEndpoints,
      label: `GET /api/v1/${tableName}`,
      desc: 'Get List (Mengambil semua data tabel / pagination). Matikan jika ingin hanya bisa diakses via Custom Service.',
      method: 'GET',
    },
    {
      key: 'allow_get_id' as keyof AllowedEndpoints,
      label: `GET /api/v1/${tableName}/:id`,
      desc: 'Get Single (Mengambil satu baris data berdasarkan ID).',
      method: 'GET',
    },
    {
      key: 'allow_post' as keyof AllowedEndpoints,
      label: `POST /api/v1/${tableName}`,
      desc: 'Insert Record (Menyimpan baris data baru).',
      method: 'POST',
    },
    {
      key: 'allow_put' as keyof AllowedEndpoints,
      label: `PUT /api/v1/${tableName}/:id`,
      desc: 'Update Record (Memperbarui data berdasarkan ID).',
      method: 'PUT',
    },
    {
      key: 'allow_delete' as keyof AllowedEndpoints,
      label: `DELETE /api/v1/${tableName}/:id`,
      desc: 'Delete Record (Menghapus data berdasarkan ID).',
      method: 'DELETE',
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ToggleOnIcon sx={{ color: 'primary.main', fontSize: 24 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Default REST Endpoint Toggles
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        Atur endpoint CRUD mana saja yang diaktifkan untuk tabel ini. Jika sebuah method dinonaktifkan, request ke endpoint tersebut akan ditolak (403 Forbidden).
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {endpointList.map((ep) => {
          const isEnabled = allowedEndpoints[ep.key];
          return (
            <Box
              key={ep.key}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                opacity: isEnabled ? 1 : 0.6,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isEnabled}
                    onChange={() => togglePermission(ep.key)}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={ep.method}
                        size="small"
                        color={ep.method === 'GET' ? 'primary' : ep.method === 'POST' ? 'success' : ep.method === 'PUT' ? 'warning' : 'error'}
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {ep.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                      {ep.desc}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start' }}
              />
              <Chip
                label={isEnabled ? 'Enabled' : 'Disabled'}
                size="small"
                color={isEnabled ? 'success' : 'default'}
                variant="outlined"
                sx={{ ml: 1, mt: 0.5 }}
              />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};
