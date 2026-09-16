'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
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
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

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

const TableBrowserPage = ({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) => {
  const { tableName } = use(params);
  const [meta, setMeta] = useState<TableMeta | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Record<string, any>>({});

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [searchColumn, setSearchColumn] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const metaRes = await fetch(`/api/admin/tables?name=${encodeURIComponent(tableName)}`);
      if (!metaRes.ok) throw new Error('Failed to fetch table metadata');
      const metaData = await metaRes.json();
      if (!metaData.table) throw new Error('Table metadata not found');
      setMeta(metaData.table);

      const rowsRes = await fetch(`/api/v1/${tableName}`);
      if (!rowsRes.ok) throw new Error('Failed to fetch table rows');
      const rowsData = await rowsRes.json();
      setRows(rowsData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  useEffect(() => {
    setIsTableLoading(true);
    const timer = setTimeout(() => {
      setIsTableLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [page, pageSize, searchQuery, searchColumn]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTableLoading(true);
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleSearchColumnChange = (e: SelectChangeEvent<string>) => {
    setIsTableLoading(true);
    setSearchColumn(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setIsTableLoading(true);
    setSearchQuery('');
    setPage(1);
  };

  const handlePageSizeChange = (e: SelectChangeEvent<number>) => {
    setIsTableLoading(true);
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, val: number) => {
    setIsTableLoading(true);
    setPage(val);
  };

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row => {
      if (searchColumn === 'all') {
        return Object.entries(row).some(([, val]) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      }
      const val = row[searchColumn];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(query);
    });
  }, [rows, searchQuery, searchColumn]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

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
      <Box sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography color="error">Error: {error || 'Table not found'}</Typography>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="outlined">Back to Dashboard</Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%' }}>
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
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
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
          sx={{
            bgcolor: isAdding ? 'text.secondary' : 'primary.main',
            color: '#ffffff',
            width: { xs: '100%', sm: 'auto' },
            py: { xs: 1, sm: 0.75 },
          }}
        >
          {isAdding ? 'Cancel' : 'Insert Row'}
        </Button>
      </Box>

      {isAdding && (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 2.5 }}>
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
                        <MenuItem value="false">False</MenuItem>
                        <MenuItem value="true">True</MenuItem>
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                justifyContent: 'flex-end',
                gap: 1.5,
                mt: 3,
              }}
            >
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setIsAdding(false)}
                sx={{ width: { xs: '100%', sm: 'auto' }, py: { xs: 1, sm: 0.75 } }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                type="submit"
                sx={{
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  width: { xs: '100%', sm: 'auto' },
                  py: { xs: 1, sm: 0.75 },
                }}
              >
                Save Row
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Table Records
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Showing {filteredRows.length} of {rows.length} {rows.length === 1 ? 'record' : 'records'}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1.5,
            }}
          >
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
              <Select
                value={searchColumn}
                onChange={handleSearchColumnChange}
                size="small"
                sx={{ height: 40, fontSize: '0.85rem' }}
              >
                <MenuItem value="all">All Columns</MenuItem>
                <MenuItem value="id">ID</MenuItem>
                {meta.columns.map(col => (
                  <MenuItem key={col.column_name} value={col.column_name}>
                    {col.column_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder={`Search by ${searchColumn === 'all' ? 'any column' : searchColumn}...`}
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: { xs: '100%', sm: 240 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch} sx={{ p: 0.5 }}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          </Box>
        </Box>

        {isTableLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8, minHeight: 250 }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
            <Box sx={{ minWidth: 650, overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5, width: 70 }}>ID</TableCell>
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
                        No records found in this table. Use the &quot;Insert Row&quot; button above or trigger a POST request.
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={meta.columns.length + 3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                          No records match &quot;{searchQuery}&quot; in {searchColumn === 'all' ? 'any column' : searchColumn}
                        </Typography>
                        <Button size="small" variant="outlined" onClick={handleClearSearch}>
                          Clear Search
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map(row => {
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
                                      sx={{ minWidth: 100 }}
                                    >
                                      <MenuItem value="false">False</MenuItem>
                                      <MenuItem value="true">True</MenuItem>
                                    </Select>
                                  ) : (
                                    <TextField
                                      size="small"
                                      type={col.column_type === 'integer' ? 'number' : 'text'}
                                      value={editingData[name] ?? ''}
                                      onChange={e =>
                                        setEditingData(prev => ({ ...prev, [name]: e.target.value }))
                                      }
                                      sx={{ minWidth: 120 }}
                                    />
                                  )
                                ) : typeof row[name] === 'boolean' ? (
                                  <Chip
                                    label={String(row[name])}
                                    size="small"
                                    variant="outlined"
                                    color={row[name] ? 'success' : 'default'}
                                    sx={{ fontSize: '0.75rem', height: 22 }}
                                  />
                                ) : (
                                  row[name] ?? <span style={{ fontStyle: 'italic', color: 'text.secondary' }}>null</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
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
            </Box>
          </TableContainer>
        )}

        {rows.length > 0 && filteredRows.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                Show:
              </Typography>
              <FormControl size="small">
                <Select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  size="small"
                  sx={{ height: 34, fontSize: '0.85rem' }}
                >
                  <MenuItem value={10}>10 / page</MenuItem>
                  <MenuItem value={20}>20 / page</MenuItem>
                  <MenuItem value={30}>30 / page</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="medium"
              />
            )}
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
          API Integration Details
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
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
                bgcolor: (t) => t.palette.mode === 'light' ? '#202124' : '#121212',
                color: (t) => t.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (t) => t.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1.5,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
                wordBreak: 'break-all',
              }}
            >
              {curlGet}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                bgcolor: (t) => t.palette.mode === 'light' ? '#202124' : '#121212',
                color: (t) => t.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (t) => t.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1.5,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
                wordBreak: 'break-all',
              }}
            >
              {curlGetId}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                bgcolor: (t) => t.palette.mode === 'light' ? '#202124' : '#121212',
                color: (t) => t.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (t) => t.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1.5,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {curlPost}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                bgcolor: (t) => t.palette.mode === 'light' ? '#202124' : '#121212',
                color: (t) => t.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (t) => t.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1.5,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {curlPut}
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                bgcolor: (t) => t.palette.mode === 'light' ? '#202124' : '#121212',
                color: (t) => t.palette.mode === 'light' ? '#a8c7fa' : '#bcaaa4',
                border: (t) => t.palette.mode === 'light' ? 'none' : '1px solid #2e2a28',
                borderRadius: 1.5,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflowX: 'auto',
                wordBreak: 'break-all',
              }}
            >
              {curlDelete}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TableBrowserPage;
