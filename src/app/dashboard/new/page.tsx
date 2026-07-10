'use client';

import React, { useState } from 'react';
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
import IconButton from '@mui/material/IconButton';
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

export default function NewTablePage() {
  const router = useRouter();
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnInput[]>([
    { name: 'title', type: 'text', nullable: true },
  ]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTables, setExistingTables] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/admin/tables')
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <IconButton sx={{ border: '1px solid #dadce0', borderRadius: 2 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Link>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#202124' }}>
            Create Table Schema
          </Typography>
          <Typography variant="body2" sx={{ color: '#5f6368', mt: 0.5 }}>
            Define custom columns and deploy instant serverless backend hooks.
          </Typography>
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: '#e8f0fe',
          borderColor: '#1a73e8',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: '#1a73e8', fontSize: '0.85rem' }}>
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
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#202124', mb: 2 }}>
              Table Information
            </Typography>
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
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#202124' }}>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    bgcolor: '#f8f9fa',
                    border: '1px solid #dadce0',
                    borderRadius: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 200 }}>
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
                  </Box>

                  <Box sx={{ minWidth: 150 }}>
                    <Select
                      fullWidth
                      value={col.type}
                      onChange={e => updateColumn(idx, 'type', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="text">Text (VARCHAR)</MenuItem>
                      <MenuItem value="integer">Number (INTEGER)</MenuItem>
                      <MenuItem value="boolean">Boolean (BOOLEAN)</MenuItem>
                      <MenuItem value="timestamp">Timestamp (TIMESTAMP)</MenuItem>
                      <MenuItem value="relation">Relation (FOREIGN KEY)</MenuItem>
                    </Select>
                  </Box>

                  {col.type === 'relation' && (
                    <Box sx={{ minWidth: 150 }}>
                      <Select
                        fullWidth
                        value={col.referencesTable || ''}
                        onChange={e => updateColumn(idx, 'referencesTable', e.target.value)}
                        size="small"
                        displayEmpty
                      >
                        <MenuItem value="" disabled>Select Target Table</MenuItem>
                        {existingTables.map(t => (
                          <MenuItem key={t.table_name} value={t.table_name}>
                            {t.table_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={col.nullable}
                          onChange={e => updateColumn(idx, 'nullable', e.target.checked)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">Nullable</Typography>}
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
                </Box>
              ))}
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" color="inherit">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="contained"
              startIcon={<RocketLaunchIcon />}
              disabled={isDeploying}
              sx={{ bgcolor: '#1a73e8' }}
            >
              {isDeploying ? 'Deploying...' : 'Deploy API'}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}
