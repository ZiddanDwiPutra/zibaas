'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

interface AddColumnDialogProps {
  tableId: number;
  existingTables?: { table_name: string }[];
  onColumnAdded: () => void;
}

export const AddColumnForm: React.FC<AddColumnDialogProps> = ({
  tableId,
  existingTables = [],
  onColumnAdded,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [nullable, setNullable] = useState(true);
  const [isUnique, setIsUnique] = useState(false);
  const [referencesTable, setReferencesTable] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) {
      setError('Column name is required');
      return;
    }

    if (cleanName === 'id' || cleanName === 'created_at') {
      setError(`Column '${cleanName}' is a reserved system primary/timestamp column.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/tables/${tableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          type,
          nullable,
          isUnique,
          referencesTable: type === 'relation' ? referencesTable : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add column');
      }

      setName('');
      setType('text');
      setNullable(true);
      setIsUnique(false);
      setReferencesTable('');
      setIsOpen(false);
      onColumnAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setIsOpen(true)}
        sx={{ textTransform: 'none' }}
      >
        Add Column
      </Button>
    );
  }

  return (
    <Paper
      variant="outlined"
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2.5,
        mb: 2.5,
        bgcolor: 'background.default',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Add New Column to Schema
        </Typography>
        <Button size="small" startIcon={<CloseIcon />} onClick={() => setIsOpen(false)} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 1.5 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextField
          label="Column Name"
          placeholder="e.g. status, bio, avatar_url"
          size="small"
          required
          value={name}
          onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          sx={{ minWidth: 200, flex: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Data Type</InputLabel>
          <Select
            label="Data Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <MenuItem value="text">Text / String</MenuItem>
            <MenuItem value="integer">Integer (Number)</MenuItem>
            <MenuItem value="boolean">Boolean (true/false)</MenuItem>
            <MenuItem value="timestamp">Timestamp (Date)</MenuItem>
            <MenuItem value="relation">Relation (FOREIGN KEY)</MenuItem>
          </Select>
        </FormControl>

        {type === 'relation' && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Target Table</InputLabel>
            <Select
              label="Target Table"
              value={referencesTable}
              onChange={(e) => setReferencesTable(e.target.value)}
              required
            >
              {existingTables.map((t) => (
                <MenuItem key={t.table_name} value={t.table_name}>
                  {t.table_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={nullable}
              onChange={(e) => setNullable(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Nullable (Optional)</Typography>}
          sx={{ mt: 0.5 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={isUnique}
              onChange={(e) => setIsUnique(e.target.checked)}
              size="small"
              color="warning"
            />
          }
          label={<Typography variant="body2" sx={{ fontWeight: isUnique ? 600 : 400 }}>Unique (No Duplicate)</Typography>}
          sx={{ mt: 0.5 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
          sx={{ textTransform: 'none' }}
        >
          {isSubmitting ? 'Adding Column...' : 'Save New Column'}
        </Button>
      </Box>
    </Paper>
  );
};
