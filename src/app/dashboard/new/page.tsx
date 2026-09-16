'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

interface ColumnInput {
  name: string;
  type: string;
  nullable: boolean;
  referencesTable?: string;
}

interface ExistingTable {
  table_name: string;
}

const NewTablePage = () => {
  const router = useRouter();
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnInput[]>([
    { name: 'title', type: 'text', nullable: true },
  ]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTables, setExistingTables] = useState<ExistingTable[]>([]);
  const [idType, setIdType] = useState<'serial' | 'uuid'>('serial');
  const [enablePagination, setEnablePagination] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetch('/api/admin/tables?simple=true')
      .then(res => res.json())
      .then(data => setExistingTables(data.tables || []))
      .catch(err => console.error(err));
  }, []);

  const addColumn = () => {
    setColumns(prev => [...prev, { name: '', type: 'text', nullable: true }]);
  };

  const removeColumn = (index: number) => {
    if (columns.length === 1) return;
    setColumns(prev => prev.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: keyof ColumnInput, value: any) => {
    setColumns(prev =>
      prev.map((col, i) => (i === index ? { ...col, [field]: value } : col))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }

    const emptyColName = columns.some(c => !c.name.trim());
    if (emptyColName) {
      setError('All columns must have a valid name');
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableName.trim(),
          idType,
          enablePagination,
          pageSize,
          columns: columns.map(c => ({
            name: c.name.trim(),
            type: c.type,
            nullable: c.nullable,
            referencesTable: c.type === 'relation' ? c.referencesTable : undefined,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to deploy schema');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 850, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <IconButton sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Link>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Create Table Schema
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Define custom columns and deploy instant serverless backend hooks.
          </Typography>
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          bgcolor: (t) => t.palette.mode === 'light' ? '#e8f0fe' : '#2e2a28',
          borderColor: 'primary.main',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: (t) => t.palette.mode === 'light' ? '#1a73e8' : '#bcaaa4', fontSize: '0.85rem' }}>
          <strong>Notice:</strong> System columns <code>id</code> (Auto-Incrementing Primary Key) and <code>created_at</code> (Timestamp) are added automatically to every table.
        </Typography>
      </Paper>

      {error && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderColor: '#f2b8b5',
            bgcolor: '#fce8e6',
            color: '#c5221f',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
              Table Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Table Name"
                placeholder="e.g. products, customers, logs"
                variant="outlined"
                size="small"
                value={tableName}
                onChange={e => setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                required
              />

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  alignItems: { xs: 'stretch', sm: 'center' },
                  flexWrap: 'wrap',
                }}
              >
                <FormControl size="small" sx={{ width: { xs: '100%', sm: 220 } }}>
                  <InputLabel id="id-type-label">ID Type</InputLabel>
                  <Select
                    labelId="id-type-label"
                    label="ID Type"
                    value={idType}
                    onChange={e => setIdType(e.target.value as 'serial' | 'uuid')}
                  >
                    <MenuItem value="serial">Auto-Increment (SERIAL)</MenuItem>
                    <MenuItem value="uuid">UUID (v4)</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={enablePagination}
                      onChange={e => setEnablePagination(e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Enable API Pagination</Typography>}
                  sx={{ m: 0 }}
                />

                {enablePagination && (
                  <TextField
                    type="number"
                    label="Page Size"
                    size="small"
                    value={pageSize}
                    onChange={e => setPageSize(Math.max(1, parseInt(e.target.value, 10) || 10))}
                    sx={{ width: { xs: '100%', sm: 120 } }}
                  />
                )}
              </Box>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Column Definitions
              </Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addColumn}>
                Add Column
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {columns.map((col, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Column Name"
                        placeholder="e.g. description, quantity"
                        size="small"
                        value={col.name}
                        onChange={e =>
                          updateColumn(idx, 'name', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                        }
                        required
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`col-type-${idx}`}>Data Type</InputLabel>
                        <Select
                          labelId={`col-type-${idx}`}
                          label="Data Type"
                          value={col.type}
                          onChange={e => updateColumn(idx, 'type', e.target.value)}
                        >
                          <MenuItem value="text">Text (VARCHAR)</MenuItem>
                          <MenuItem value="integer">Number (INTEGER)</MenuItem>
                          <MenuItem value="boolean">Boolean (BOOLEAN)</MenuItem>
                          <MenuItem value="timestamp">Timestamp (TIMESTAMP)</MenuItem>
                          <MenuItem value="relation">Relation (FOREIGN KEY)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {col.type === 'relation' && (
                      <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`target-table-${idx}`}>Target Table</InputLabel>
                          <Select
                            labelId={`target-table-${idx}`}
                            label="Target Table"
                            value={col.referencesTable || ''}
                            onChange={e => updateColumn(idx, 'referencesTable', e.target.value)}
                          >
                            <MenuItem value="" disabled>Select Target Table</MenuItem>
                            {existingTables.map(t => (
                              <MenuItem key={t.table_name} value={t.table_name}>
                                {t.table_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    <Grid size={{ xs: 12, sm: 'grow' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={col.nullable}
                              onChange={e => updateColumn(idx, 'nullable', e.target.checked)}
                              size="small"
                            />
                          }
                          label={<Typography variant="body2">Nullable</Typography>}
                          sx={{ m: 0 }}
                        />

                        <IconButton
                          color="error"
                          onClick={() => removeColumn(idx)}
                          disabled={columns.length === 1}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Paper>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              justifyContent: 'flex-end',
              gap: 2,
            }}
          >
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                color="inherit"
                sx={{ width: { xs: '100%', sm: 'auto' }, py: { xs: 1, sm: 0.75 } }}
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="contained"
              startIcon={<RocketLaunchIcon />}
              disabled={isDeploying}
              sx={{
                bgcolor: 'primary.main',
                color: '#ffffff',
                width: { xs: '100%', sm: 'auto' },
                py: { xs: 1, sm: 0.75 },
              }}
            >
              {isDeploying ? 'Deploying...' : 'Deploy API'}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default NewTablePage;
