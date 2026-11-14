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
  enable_auth?: boolean;
  user_id_column?: string | null;
  columns: Column[];
}

export default function TableRecordsPage({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) {
  const { tableName } = use(params);
  const [meta, setMeta] = useState<TableMeta | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<any>(null);
  const [editingData, setEditingData] = useState<Record<string, any>>({});

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
  }, [searchQuery, searchColumn, page, pageSize]);

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to insert row');
      }
      setNewRowData({});
      setIsAdding(false);
      fetchData();
    } catch (err: any) {
      alert(`Error inserting row: ${err.message}`);
    }
  };

  const handleEditClick = (row: any) => {
    setEditingId(row.id);
    setEditingData({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleSaveEdit = async (id: any) => {
    try {
      const res = await fetch(`/api/v1/${tableName}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update row');
      }
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(`Error updating row: ${err.message}`);
    }
  };

  const handleDeleteRow = async (id: any) => {
    if (!confirm('Are you sure you want to delete this row?')) return;
    try {
      const res = await fetch(`/api/v1/${tableName}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete row');
      }
      fetchData();
    } catch (err: any) {
      alert(`Error deleting row: ${err.message}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleSearchColumnChange = (e: SelectChangeEvent) => {
    setSearchColumn(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchColumn('all');
    setPage(1);
  };

  const handlePageSizeChange = (e: SelectChangeEvent) => {
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
        <Link href={`/dashboard/tables/${tableName}`} style={{ textDecoration: 'none' }}>
          <Button variant="outlined">Back to Table Details</Button>
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
          <Link href={`/dashboard/tables/${tableName}`} style={{ textDecoration: 'none' }}>
            <IconButton sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Link>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {meta.table_name} Records Browser
              </Typography>
              <Chip
                label={`${rows.length} Records`}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Browse, filter, insert, and modify table rows directly.
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
            py: { xs: 1, sm: 0.75 },
          }}
        >
          {isAdding ? 'Cancel' : 'Insert Row'}
        </Button>
      </Box>

      {isAdding && (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 2.5 }}>
            Insert New Record (Including Custom ID if needed)
          </Typography>
          <form onSubmit={handleAddRow}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="id (Optional - Auto generated if empty)"
                  placeholder="Leave empty or enter custom ID"
                  value={newRowData.id || ''}
                  onChange={e => setNewRowData({ ...newRowData, id: e.target.value })}
                />
              </Grid>

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
                        value={newRowData[col.column_name] !== undefined ? String(newRowData[col.column_name]) : ''}
                        onChange={e =>
                          setNewRowData({
                            ...newRowData,
                            [col.column_name]: e.target.value === 'true',
                          })
                        }
                        displayEmpty
                      >
                        <MenuItem value=""><em>null</em></MenuItem>
                        <MenuItem value="true">true</MenuItem>
                        <MenuItem value="false">false</MenuItem>
                      </Select>
                    </Box>
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      type={col.column_type === 'integer' ? 'number' : col.column_type === 'timestamp' ? 'datetime-local' : 'text'}
                      label={col.column_name}
                      value={newRowData[col.column_name] || ''}
                      onChange={e =>
                        setNewRowData({
                          ...newRowData,
                          [col.column_name]: e.target.value,
                        })
                      }
                      slotProps={{
                        inputLabel: col.column_type === 'timestamp' ? { shrink: true } : undefined,
                      }}
                    />
                  )}
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                  <Button variant="text" size="small" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="small" color="primary">
                    Save Record
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* Grid Table Container */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={searchColumn} onChange={handleSearchColumnChange}>
                <MenuItem value="all">All Columns</MenuItem>
                <MenuItem value="id">id</MenuItem>
                {meta.columns.map(col => (
                  <MenuItem key={col.column_name} value={col.column_name}>
                    {col.column_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search records..."
              value={searchQuery}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch} edge="end">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ width: { xs: '100%', sm: 260 } }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Rows per page:</Typography>
            <FormControl size="small">
              <Select value={String(pageSize)} onChange={handlePageSizeChange} sx={{ minWidth: 80 }}>
                <MenuItem value="5">5</MenuItem>
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="25">25</MenuItem>
                <MenuItem value="50">50</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {isTableLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1.5, width: 120 }}>ID (Editable)</TableCell>
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
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={meta.columns.length + 3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map(row => {
                    const isEditing = editingId === row.id;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              value={editingData.id || ''}
                              onChange={e => setEditingData({ ...editingData, id: e.target.value })}
                              sx={{ width: 110 }}
                            />
                          ) : (
                            row.id
                          )}
                        </TableCell>
                        {meta.columns.map(col => {
                          const name = col.column_name;
                          return (
                            <TableCell key={name}>
                              {isEditing ? (
                                col.column_type === 'boolean' ? (
                                  <Select
                                    size="small"
                                    value={editingData[name] !== undefined ? String(editingData[name]) : ''}
                                    onChange={e =>
                                      setEditingData({
                                        ...editingData,
                                        [name]: e.target.value === 'true',
                                      })
                                    }
                                  >
                                    <MenuItem value=""><em>null</em></MenuItem>
                                    <MenuItem value="true">true</MenuItem>
                                    <MenuItem value="false">false</MenuItem>
                                  </Select>
                                ) : (
                                  <TextField
                                    size="small"
                                    type={col.column_type === 'integer' ? 'number' : col.column_type === 'timestamp' ? 'datetime-local' : 'text'}
                                    value={editingData[name] !== undefined ? editingData[name] : ''}
                                    onChange={e =>
                                      setEditingData({
                                        ...editingData,
                                        [name]: e.target.value,
                                      })
                                    }
                                  />
                                )
                              ) : (
                                String(row[name] !== null && row[name] !== undefined ? row[name] : '-')
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          {new Date(row.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <IconButton size="small" color="primary" onClick={() => handleSaveEdit(row.id)}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={handleCancelEdit}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <IconButton size="small" onClick={() => handleEditClick(row)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
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
        )}

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Box>
      </Paper>
    </Box>
  );
}
