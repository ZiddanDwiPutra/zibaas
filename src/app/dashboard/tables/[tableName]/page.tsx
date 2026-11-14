'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import StorageIcon from '@mui/icons-material/Storage';
import KeyIcon from '@mui/icons-material/Key';
import { TableEditSettings } from '@/components/TableEditSettings';
import { TableServicesManager } from '@/components/TableServicesManager';
import { TableApiReference } from '@/components/TableApiReference';
import { AddColumnForm } from '@/components/AddColumnForm';

interface Column {
  column_name: string;
  column_type: string;
  is_nullable: boolean;
  is_unique?: boolean;
  references_table?: string | null;
}

interface TableMeta {
  id: number;
  table_name: string;
  id_type?: 'serial' | 'uuid';
  enable_pagination?: boolean;
  page_size?: number;
  created_at: string;
  enable_auth?: boolean;
  user_id_column?: string | null;
  rowCount?: number;
  allowed_endpoints?: {
    allow_get_list: boolean;
    allow_get_id: boolean;
    allow_post: boolean;
    allow_put: boolean;
    allow_delete: boolean;
  };
  columns: Column[];
}

export default function TableDetailsPage({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) {
  const { tableName } = use(params);
  const [meta, setMeta] = useState<TableMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [existingTables, setExistingTables] = useState<{ table_name: string }[]>([]);

  const fetchMeta = async () => {
    try {
      const res = await fetch(`/api/admin/tables?name=${encodeURIComponent(tableName)}`);
      if (!res.ok) throw new Error('Failed to fetch table metadata');
      const data = await res.json();
      if (!data.table) throw new Error('Table metadata not found');
      setMeta(data.table);

      // Fetch simple tables list for foreign key relations
      const tablesRes = await fetch('/api/admin/tables?simple=true');
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setExistingTables(tablesData.tables || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, [tableName]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !meta) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography color="error">Error: {error || 'Table not found'}</Typography>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="outlined">Back to Dashboard</Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%' }}>
      {/* Header bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <IconButton sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Link>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {meta.table_name}
              </Typography>
              <Chip
                label={meta.enable_auth ? 'Protected (Auth Required)' : 'Open (Public)'}
                color={meta.enable_auth ? 'warning' : 'default'}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`ID: ${meta.id_type || 'serial'}`}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Table Schema, Security Configurations, and Custom API Services.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setShowSettings(!showSettings)}
            sx={{ py: { xs: 1, sm: 0.75 }, textTransform: 'none' }}
          >
            {showSettings ? 'Hide Settings' : 'Access & Security Settings'}
          </Button>

          <Link href={`/dashboard/records/${tableName}`} style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<StorageIcon />}
              sx={{ py: { xs: 1, sm: 0.75 }, textTransform: 'none' }}
            >
              Browse Table Records ({meta.rowCount ?? 0} rows)
            </Button>
          </Link>
        </Box>
      </Box>

      {/* Settings section */}
      {showSettings && (
        <TableEditSettings
          tableId={meta.id}
          tableName={meta.table_name}
          initialEnableAuth={!!meta.enable_auth}
          initialUserIdColumn={meta.user_id_column || ''}
          initialAllowedEndpoints={meta.allowed_endpoints}
          availableColumns={meta.columns.map(c => c.column_name)}
          onSaved={fetchMeta}
        />
      )}

      {/* Columns Schema Paper */}
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Columns & Schema Definition
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {meta.columns.length + 2} total fields
            </Typography>
          </Box>
          <AddColumnForm
            tableId={meta.id}
            existingTables={existingTables}
            onColumnAdded={fetchMeta}
          />
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Column Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Data Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Attributes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reference / Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <KeyIcon sx={{ fontSize: 16, color: 'primary.main' }} /> id
                  </Box>
                </TableCell>
                <TableCell><Chip label={meta.id_type === 'uuid' ? 'UUID' : 'SERIAL / INT'} size="small" /></TableCell>
                <TableCell><Chip label="PRIMARY KEY (Editable)" color="primary" size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Unique identifier (Auto or Custom ID payload)</TableCell>
              </TableRow>

              {meta.columns.map((col) => (
                <TableRow key={col.column_name} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {col.column_name}
                  </TableCell>
                  <TableCell>
                    <Chip label={col.column_type.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {col.is_nullable ? (
                        <Chip label="Nullable" size="small" variant="outlined" />
                      ) : (
                        <Chip label="Required" size="small" color="error" variant="outlined" />
                      )}
                      {col.is_unique && (
                        <Chip label="UNIQUE" size="small" color="warning" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                    {col.references_table ? `Foreign Key -> ${col.references_table}` : '-'}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>created_at</TableCell>
                <TableCell><Chip label="TIMESTAMP" size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label="Auto Generated" size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>CURRENT_TIMESTAMP</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Custom API Services */}
      <TableServicesManager
        tableId={meta.id}
        tableName={meta.table_name}
        availableColumns={meta.columns.map(c => c.column_name)}
      />

      {/* Active API References & AI JSON Export */}
      <TableApiReference
        tableName={meta.table_name}
        enableAuth={!!meta.enable_auth}
        userIdColumn={meta.user_id_column}
        columns={meta.columns}
        allowedEndpoints={meta.allowed_endpoints}
      />
    </Box>
  );
}
