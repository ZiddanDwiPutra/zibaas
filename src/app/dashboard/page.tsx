'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';

interface Column {
  column_name: string;
  column_type: string;
  is_nullable: boolean;
}

interface TableData {
  id: number;
  table_name: string;
  created_at: string;
  columns: Column[];
  rowCount: number;
}

export default function DashboardPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (!res.ok) {
        throw new Error('Failed to fetch tables');
      }
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCopy = (path: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/api/v1/${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(path);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this table? This will drop the database table and all its data.')) {
      return;
    }
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/tables/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete table');
      }
      setTables(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            No-Code Engine API Gateway
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Model and expose instant relational REST endpoints.
          </Typography>
        </Box>
        <Link href="/dashboard/new" style={{ textDecoration: 'none' }}>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: 'primary.main', color: '#ffffff' }}>
            New Table
          </Button>
        </Link>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
                ACTIVE TABLES
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', mt: 1 }}>
                {tables.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
                SCHEMA COLUMNS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', mt: 1 }}>
                {tables.reduce((acc, t) => acc + (t.columns?.length || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
                AGGREGATE RECORDS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', mt: 1 }}>
                {tables.reduce((acc, t) => acc + (t.rowCount || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            System Tables
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : tables.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No database schemas are defined yet. Create your first table to get started.
            </Typography>
            <Link href="/dashboard/new" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<AddIcon />}>
                Create Table
              </Button>
            </Link>
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>Table Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>Columns</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>Records</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>API Path</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tables.map(table => (
                <TableRow key={table.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Link
                      href={`/dashboard/tables/${table.table_name}`}
                      style={{ textDecoration: 'none', fontWeight: 600 }}
                    >
                      <Box component="span" sx={{ color: 'primary.main' }}>
                        {table.table_name}
                      </Box>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 300 }}>
                      {table.columns.map((col, idx) => (
                        <Chip
                          key={idx}
                          label={`${col.column_name}: ${col.column_type}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem', height: 20 }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: 'text.primary' }}>{table.rowCount}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          p: '4px 8px',
                          bgcolor: (theme) => theme.palette.mode === 'light' ? '#f1f3f4' : '#2e2a28',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          color: (theme) => theme.palette.mode === 'light' ? '#b06000' : '#d7ccc8',
                        }}
                      >
                        /api/v1/{table.table_name}
                      </Box>
                      <Tooltip title="Copy Endpoint">
                        <IconButton size="small" onClick={() => handleCopy(table.table_name)}>
                          {copiedId === table.table_name ? (
                            <CheckIcon fontSize="inherit" sx={{ color: '#34a853' }} />
                          ) : (
                            <ContentCopyIcon fontSize="inherit" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Link href={`/dashboard/tables/${table.table_name}`} style={{ textDecoration: 'none' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<LaunchIcon sx={{ fontSize: '10px !important' }} />}
                        >
                          Data Browser
                        </Button>
                      </Link>
                      <Tooltip title="Delete Table">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(table.id)}
                          disabled={isDeleting === table.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
