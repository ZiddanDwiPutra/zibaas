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
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface Column {
  column_name: string;
  column_type: string;
  is_nullable: boolean;
}

interface TableMeta {
  id: number;
  table_name: string;
  created_at: string;
  columns: Column[];
}

export default function TableBrowserPage({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) {
  const { tableName } = use(params);
  const [meta, setMeta] = useState<TableMeta | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Record<string, any>>({});

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const metaRes = await fetch('/api/admin/tables');
      if (!metaRes.ok) throw new Error('Failed to fetch table metadata');
      const metaData = await metaRes.json();
      const currentMeta = metaData.tables.find((t: any) => t.table_name === tableName);
      if (!currentMeta) throw new Error('Table metadata not found');
      setMeta(currentMeta);

      const rowsRes = await fetch(`/api/v1/${tableName}`);
      if (!rowsRes.ok) throw new Error('Failed to fetch table rows');
      const rowsData = await rowsRes.json();
      setRows(rowsData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to insert row');
      }
      const data = await res.json();
      setRows(prev => [data.data, ...prev]);
      setNewRowData({});
      setIsAdding(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartEdit = (row: any) => {
    setEditingId(row.id);
    setEditingData(row);
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update row');
      }
      const data = await res.json();
      setRows(prev => prev.map(r => (r.id === id ? data.data : r)));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRow = async (id: number) => {
    if (!confirm('Are you sure you want to delete this row?')) return;
    try {
      const res = await fetch(`/api/v1/${tableName}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete row');
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyCode = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const apiUrl = `${originUrl}/api/v1/${tableName}`;

  const curlGet = `curl -X GET "${apiUrl}"`;
  const curlGetId = `curl -X GET "${apiUrl}/1"`;
  const curlPost = `curl -X POST "${apiUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
    meta?.columns.reduce((acc, c) => ({ ...acc, [c.column_name]: c.column_type === 'integer' ? 42 : c.column_type === 'boolean' ? true : 'value' }), {}) || {}
  )}'`;
  const curlPut = `curl -X PUT "${apiUrl}/1" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
    meta?.columns.reduce((acc, c) => ({ ...acc, [c.column_name]: c.column_type === 'integer' ? 42 : c.column_type === 'boolean' ? true : 'new-value' }), {}) || {}
  )}'`;
  const curlDelete = `curl -X DELETE "${apiUrl}/1"`;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !meta) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography color="error">Error: {error || 'Table not found'}</Typography>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="outlined">Back to Dashboard</Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <IconButton sx={{ border: '1px solid #dadce0', borderRadius: 2 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Link>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {meta.table_name} Data Browser
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Browse and edit records dynamically inside the relational database table.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={isAdding ? <CloseIcon /> : <AddIcon />}
          onClick={() => setIsAdding(!isAdding)}
          sx={{ bgcolor: isAdding ? 'text.secondary' : 'primary.main', color: '#ffffff' }}
        >
          {isAdding ? 'Cancel' : 'Insert Row'}
        </Button>
      </Box>

      {isAdding && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}>
            New Record Data
          </Typography>
          <form onSubmit={handleAddRow}>
            <Grid container spacing={2}>
              {meta.columns.map(col => (
                <Grid size={{ xs: 12, sm: 6 }} key={col.column_name}>
                  {col.column_type === 'boolean' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        {col.column_name} (boolean)
                      </Typography>
                      <Select
                        size="small"
                        fullWidth
                        defaultValue="false"
                        onChange={e =>
                          setNewRowData(prev => ({ ...prev, [col.column_name]: e.target.value === 'true' }))
                        }
                      >
                        <option value="false">False</option>
                        <option value="true">True</option>
                      </Select>
                    </Box>
                  ) : (
                    <TextField
                      fullWidth
                      label={`${col.column_name} (${col.column_type})`}
                      placeholder={`Enter ${col.column_name}`}
                      size="small"
                      type={col.column_type === 'integer' ? 'number' : 'text'}
                      value={newRowData[col.column_name] || ''}
                      onChange={e =>
                        setNewRowData(prev => ({ ...prev, [col.column_name]: e.target.value }))
                      }
                    />
                  )}
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
              <Button size="small" variant="outlined" color="inherit" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button size="small" variant="contained" type="submit" sx={{ bgcolor: 'primary.main', color: '#ffffff' }}>
                Save Row
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5, w: 60 }}>ID</TableCell>
              {meta.columns.map(col => (
                <TableCell key={col.column_name} sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>
                  {col.column_name}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>Created At</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={meta.columns.length + 3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No records found in this table. Use the "Insert Row" button above or trigger a POST request.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const isEditing = editingId === row.id;
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                      {row.id}
                    </TableCell>
                    {meta.columns.map(col => {
                      const name = col.column_name;
                      return (
                        <TableCell key={name}>
                          {isEditing ? (
                            col.column_type === 'boolean' ? (
                              <Select
                                size="small"
                                value={String(editingData[name] ?? false)}
                                onChange={e =>
                                  setEditingData(prev => ({ ...prev, [name]: e.target.value === 'true' }))
                                }
                              >
                                <option value="false">False</option>
                                <option value="true">True</option>
                              </Select>
                            ) : (
                              <TextField
                                size="small"
                                type={col.column_type === 'integer' ? 'number' : 'text'}
                                value={editingData[name] ?? ''}
                                onChange={e =>
                                  setEditingData(prev => ({ ...prev, [name]: e.target.value }))
                                }
                                sx={{ maxW: 150 }}
                              />
                            )
                          ) : typeof row[name] === 'boolean' ? (
                            <Chip
                              label={String(row[name])}
                              size="small"
                              variant="outlined"
                              color={row[name] ? 'success' : 'default'}
                              sx={{ fontSize: '0.75rem', height: 20 }}
                            />
                          ) : (
                            row[name] ?? <span style={{ fontStyle: 'italic', color: 'text.secondary' }}>null</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Save">
                            <IconButton size="small" color="primary" onClick={() => handleSaveEdit(row.id)}>
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton size="small" color="inherit" onClick={() => setEditingId(null)}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Edit Row">
                            <IconButton size="small" onClick={() => handleStartEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Row">
                            <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
          API Integration Details
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                FETCH DATA (GET)
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={copiedSection === 'get' ? <CheckIcon sx={{ fontSize: 12 }} /> : <ContentCopyIcon sx={{ fontSize: 12 }} />}
                onClick={() => handleCopyCode(curlGet, 'get')}
              >
                Copy curl
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'light' ? '#202124' : '#121212',
                color: (theme) => theme.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (theme) => theme.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
              }}
            >
              {curlGet}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#5f6368' }}>
                FETCH DATA BY ID (GET)
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={copiedSection === 'getid' ? <CheckIcon sx={{ fontSize: 12 }} /> : <ContentCopyIcon sx={{ fontSize: 12 }} />}
                onClick={() => handleCopyCode(curlGetId, 'getid')}
              >
                Copy curl
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'light' ? '#202124' : '#121212',
                color: (theme) => theme.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (theme) => theme.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
              }}
            >
              {curlGetId}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#5f6368' }}>
                INSERT ROW (POST)
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={copiedSection === 'post' ? <CheckIcon sx={{ fontSize: 12 }} /> : <ContentCopyIcon sx={{ fontSize: 12 }} />}
                onClick={() => handleCopyCode(curlPost, 'post')}
              >
                Copy curl
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'light' ? '#202124' : '#121212',
                color: (theme) => theme.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (theme) => theme.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {curlPost}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#5f6368' }}>
                UPDATE ROW (PUT)
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={copiedSection === 'put' ? <CheckIcon sx={{ fontSize: 12 }} /> : <ContentCopyIcon sx={{ fontSize: 12 }} />}
                onClick={() => handleCopyCode(curlPut, 'put')}
              >
                Copy curl
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'light' ? '#202124' : '#121212',
                color: (theme) => theme.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (theme) => theme.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {curlPut}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#5f6368' }}>
                DELETE ROW (DELETE)
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={copiedSection === 'delete' ? <CheckIcon sx={{ fontSize: 12 }} /> : <ContentCopyIcon sx={{ fontSize: 12 }} />}
                onClick={() => handleCopyCode(curlDelete, 'delete')}
              >
                Copy curl
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'light' ? '#202124' : '#121212',
                color: (theme) => theme.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (theme) => theme.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
              }}
            >
              {curlDelete}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
