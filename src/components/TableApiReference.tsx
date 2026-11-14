'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CodeIcon from '@mui/icons-material/Code';
import TerminalIcon from '@mui/icons-material/Terminal';

interface Column {
  column_name: string;
  column_type: string;
  is_nullable: boolean;
  references_table?: string | null;
}

interface TableApiReferenceProps {
  tableName: string;
  enableAuth: boolean;
  userIdColumn?: string | null;
  columns: Column[];
  allowedEndpoints?: {
    allow_get_list: boolean;
    allow_get_id: boolean;
    allow_post: boolean;
    allow_put: boolean;
    allow_delete: boolean;
  };
}

export const TableApiReference: React.FC<TableApiReferenceProps> = ({
  tableName,
  enableAuth,
  userIdColumn,
  columns,
  allowedEndpoints = {
    allow_get_list: true,
    allow_get_id: true,
    allow_post: true,
    allow_put: true,
    allow_delete: true,
  },
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://zibaas.netlify.app';
  const apiUrl = `${originUrl}/api/v1/${tableName}`;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sample payloads
  const sampleBody = columns.reduce<Record<string, any>>((acc, col) => {
    if (col.column_type === 'integer') acc[col.column_name] = 100;
    else if (col.column_type === 'boolean') acc[col.column_name] = true;
    else if (col.column_type === 'timestamp') acc[col.column_name] = new Date().toISOString();
    else acc[col.column_name] = 'sample_value';
    return acc;
  }, { id: 'custom_id_optional' });

  // List of active endpoints
  const endpoints = [
    {
      key: 'get_list',
      method: 'GET',
      path: `/api/v1/${tableName}`,
      title: 'Get Records List (with search & pagination)',
      enabled: allowedEndpoints.allow_get_list,
      curl: `curl -X GET "${apiUrl}?page=1&limit=10&search=keyword" \\\n  -H "${enableAuth ? 'Authorization: Bearer <user_token>' : 'x-api-key: <vendor_key>'}"`,
      jsonDoc: {
        method: 'GET',
        endpoint: `${apiUrl}?page=1&limit=10&search=keyword`,
        auth: enableAuth ? 'Bearer JWT (User Session)' : 'x-api-key / Open',
        description: `Fetch paginated list of records from ${tableName}. Filtered by user_id if protected.`,
        parameters: {
          page: 'number (optional, default 1)',
          limit: 'number (optional, default 10)',
          search: 'string (optional fuzzy search)',
        },
      },
    },
    {
      key: 'get_id',
      method: 'GET',
      path: `/api/v1/${tableName}/:id`,
      title: 'Get Single Record by ID',
      enabled: allowedEndpoints.allow_get_id,
      curl: `curl -X GET "${apiUrl}/1" \\\n  -H "${enableAuth ? 'Authorization: Bearer <user_token>' : 'x-api-key: <vendor_key>'}"`,
      jsonDoc: {
        method: 'GET',
        endpoint: `${apiUrl}/:id`,
        auth: enableAuth ? 'Bearer JWT (User Session)' : 'x-api-key / Open',
        description: `Retrieve single row by ID from ${tableName}.`,
      },
    },
    {
      key: 'post',
      method: 'POST',
      path: `/api/v1/${tableName}`,
      title: 'Insert Record (Supports Custom ID)',
      enabled: allowedEndpoints.allow_post,
      curl: `curl -X POST "${apiUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "${enableAuth ? 'Authorization: Bearer <user_token>' : 'x-api-key: <vendor_key>'}" \\\n  -d '${JSON.stringify(sampleBody, null, 2)}'`,
      jsonDoc: {
        method: 'POST',
        endpoint: apiUrl,
        auth: enableAuth ? 'Bearer JWT (User Session)' : 'x-api-key / Open',
        description: `Insert a new record into ${tableName}. Custom ID can be provided or auto-generated.`,
        body: sampleBody,
      },
    },
    {
      key: 'put',
      method: 'PUT',
      path: `/api/v1/${tableName}/:id`,
      title: 'Update Record by ID',
      enabled: allowedEndpoints.allow_put,
      curl: `curl -X PUT "${apiUrl}/1" \\\n  -H "Content-Type: application/json" \\\n  -H "${enableAuth ? 'Authorization: Bearer <user_token>' : 'x-api-key: <vendor_key>'}" \\\n  -d '${JSON.stringify({ ...sampleBody, id: undefined }, null, 2)}'`,
      jsonDoc: {
        method: 'PUT',
        endpoint: `${apiUrl}/:id`,
        auth: enableAuth ? 'Bearer JWT (User Session)' : 'x-api-key / Open',
        description: `Update existing record by ID in ${tableName}.`,
        body: sampleBody,
      },
    },
    {
      key: 'delete',
      method: 'DELETE',
      path: `/api/v1/${tableName}/:id`,
      title: 'Delete Record by ID',
      enabled: allowedEndpoints.allow_delete,
      curl: `curl -X DELETE "${apiUrl}/1" \\\n  -H "${enableAuth ? 'Authorization: Bearer <user_token>' : 'x-api-key: <vendor_key>'}"`,
      jsonDoc: {
        method: 'DELETE',
        endpoint: `${apiUrl}/:id`,
        auth: enableAuth ? 'Bearer JWT (User Session)' : 'x-api-key / Open',
        description: `Permanently delete a record by ID from ${tableName}.`,
      },
    },
  ];

  const activeEndpoints = endpoints.filter((ep) => ep.enabled);

  // Full AI Integration Documentation JSON
  const aiIntegrationSchema = {
    table_name: tableName,
    base_url: apiUrl,
    access_mode: enableAuth ? 'Protected (Requires User JWT)' : 'Open',
    owner_column: enableAuth ? (userIdColumn || 'id') : null,
    schema: [
      { name: 'id', type: 'primary_key', editable: true },
      ...columns.map(c => ({
        name: c.column_name,
        type: c.column_type,
        nullable: c.is_nullable,
        references: c.references_table || null,
      })),
      { name: 'created_at', type: 'timestamp', editable: false },
    ],
    available_endpoints: activeEndpoints.map(ep => ep.jsonDoc),
  };

  const handleCopyAiJson = () => {
    copyText(JSON.stringify(aiIntegrationSchema, null, 2), 'ai-json');
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TerminalIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Active REST API References ({activeEndpoints.length} Enabled)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Daftar seluruh endpoint aktif yang siap di-request oleh aplikasi atau AI agent kamu.
          </Typography>
        </Box>

        {/* Copy for AI Integration */}
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={copiedKey === 'ai-json' ? <CheckIcon fontSize="small" /> : <CodeIcon fontSize="small" />}
          onClick={handleCopyAiJson}
          sx={{ textTransform: 'none', py: 0.75, px: 2 }}
        >
          {copiedKey === 'ai-json' ? 'Copied AI JSON!' : 'Copy Schema as JSON (for AI)'}
        </Button>
      </Box>

      {activeEndpoints.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 2 }}>
          Semua default REST endpoint telah dinonaktifkan di menu Access Settings. Hanya Custom API Services yang dapat diakses.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeEndpoints.map((ep) => (
            <Paper
              key={ep.key}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={ep.method}
                    size="small"
                    color={ep.method === 'GET' ? 'primary' : ep.method === 'POST' ? 'success' : ep.method === 'PUT' ? 'warning' : 'error'}
                    sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                  />
                  <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {ep.path}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
                    — {ep.title}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={copiedKey === `${ep.key}-curl` ? <CheckIcon sx={{ fontSize: 13 }} /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
                    onClick={() => copyText(ep.curl, `${ep.key}-curl`)}
                    sx={{ textTransform: 'none', py: 0.25, fontSize: '0.75rem' }}
                  >
                    {copiedKey === `${ep.key}-curl` ? 'Copied curl' : 'Copy curl'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={copiedKey === `${ep.key}-json` ? <CheckIcon sx={{ fontSize: 13 }} /> : <CodeIcon sx={{ fontSize: 13 }} />}
                    onClick={() => copyText(JSON.stringify(ep.jsonDoc, null, 2), `${ep.key}-json`)}
                    sx={{ textTransform: 'none', py: 0.25, fontSize: '0.75rem' }}
                  >
                    {copiedKey === `${ep.key}-json` ? 'Copied JSON' : 'Copy JSON'}
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  bgcolor: (t) => t.palette.mode === 'light' ? '#202124' : '#121212',
                  color: (t) => t.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {ep.curl}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};
