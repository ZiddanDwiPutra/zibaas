'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import TableChartIcon from '@mui/icons-material/TableChart';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

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

interface TableStats {
  activeTables: number;
  schemaColumns: number;
  aggregateRecords: number;
}

interface StatCardProps {
  label: string;
  count: number;
}

const StatCard = ({ label, count }: StatCardProps) => {
  const isOverLimit = count >= 100;
  const displayValue = isOverLimit ? '99+' : count;

  return (
    <Tooltip title={`Total: ${count.toLocaleString()}`} arrow enterTouchDelay={50}>
      <Card variant="outlined" sx={{ height: '100%', cursor: 'default' }}>
        <CardContent sx={{ p: { xs: 1.25, sm: 2.5 }, '&:last-child': { pb: { xs: 1.25, sm: 2.5 } } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontSize: { xs: '0.62rem', sm: '0.75rem' },
              lineHeight: 1.2,
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
              mt: { xs: 0.5, sm: 1 },
              fontSize: { xs: '1.2rem', sm: '1.75rem', md: '2.125rem' },
            }}
          >
            {displayValue}
          </Typography>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

interface TableCardProps {
  table: TableData;
  copiedId: string | null;
  isDeleting: number | null;
  onCopy: (path: string) => void;
  onDelete: (id: number) => void;
}

const TableCard = ({
  table,
  copiedId,
  isDeleting,
  onCopy,
  onDelete,
}: TableCardProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <TableChartIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Link
              href={`/dashboard/tables/${table.table_name}`}
              style={{ textDecoration: 'none', minWidth: 0 }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  wordBreak: 'break-word',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {table.table_name}
              </Typography>
            </Link>
          </Box>
          <Chip
            label={`${table.rowCount} records`}
            size="small"
            variant="filled"
            color="default"
            sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.75 }}>
            COLUMNS ({table.columns.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {table.columns.map((col, idx) => (
              <Chip
                key={idx}
                label={`${col.column_name}: ${col.column_type}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.72rem', height: 22 }}
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
            API PATH
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              bgcolor: (t) => t.palette.mode === 'light' ? '#f1f3f4' : '#2e2a28',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.75,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: (t) => t.palette.mode === 'light' ? '#b06000' : '#d7ccc8',
                wordBreak: 'break-all',
              }}
            >
              /api/v1/{table.table_name}
            </Typography>
            <Tooltip title="Copy Endpoint">
              <IconButton size="small" onClick={() => onCopy(table.table_name)} sx={{ p: 0.5 }}>
                {copiedId === table.table_name ? (
                  <CheckIcon fontSize="small" sx={{ color: '#34a853' }} />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>

      <Box>
        <Divider />
        <CardActions sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/dashboard/tables/${table.table_name}`} style={{ textDecoration: 'none' }}>
            <Button
              variant="outlined"
              size="small"
              endIcon={<LaunchIcon sx={{ fontSize: '12px !important' }} />}
            >
              Data Browser
            </Button>
          </Link>
          <Tooltip title="Delete Table">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(table.id)}
              disabled={isDeleting === table.id}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Box>
    </Card>
  );
};

const DashboardPage = () => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [stats, setStats] = useState<TableStats>({ activeTables: 0, schemaColumns: 0, aggregateRecords: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchTables = useCallback(async (currentPage: number, currentLimit: number, currentSearch: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(currentLimit),
      });
      if (currentSearch.trim()) {
        params.set('search', currentSearch.trim());
      }
      const res = await fetch(`/api/admin/tables?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch tables');
      }
      const data = await res.json();
      setTables(data.tables || []);
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTables(page, pageSize, searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [page, pageSize, searchQuery, fetchTables]);

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
      fetchTables(page, pageSize, searchQuery);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setIsLoading(true);
    setSearchQuery('');
    setPage(1);
  };

  const handlePageSizeChange = (e: SelectChangeEvent<number>) => {
    setIsLoading(true);
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, val: number) => {
    setIsLoading(true);
    setPage(val);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            No-Code Engine API Gateway
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Model and expose instant relational REST endpoints.
          </Typography>
        </Box>
        <Link href="/dashboard/new" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: 'primary.main',
              color: '#ffffff',
              width: { xs: '100%', sm: 'auto' },
              py: { xs: 1, sm: 0.75 },
            }}
          >
            New Table
          </Button>
        </Link>
      </Box>

      <Grid container spacing={{ xs: 1, sm: 2.5, md: 3 }}>
        <Grid size={{ xs: 4, sm: 4 }}>
          <StatCard label="Active Tables" count={stats.activeTables} />
        </Grid>

        <Grid size={{ xs: 4, sm: 4 }}>
          <StatCard label="Schema Columns" count={stats.schemaColumns} />
        </Grid>

        <Grid size={{ xs: 4, sm: 4 }}>
          <StatCard label="Aggregate Records" count={stats.aggregateRecords} />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              System Tables
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Showing {tables.length} of {totalCount} {totalCount === 1 ? 'table' : 'tables'}
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Search tables or columns..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ width: { xs: '100%', sm: 280 } }}
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

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8, minHeight: 220 }}>
            <CircularProgress size={36} />
          </Box>
        ) : error ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        ) : stats.activeTables === 0 ? (
          <Paper variant="outlined" sx={{ p: { xs: 4, sm: 8 }, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No database schemas are defined yet. Create your first table to get started.
            </Typography>
            <Link href="/dashboard/new" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" startIcon={<AddIcon />}>
                Create Table
              </Button>
            </Link>
          </Paper>
        ) : tables.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              No tables found matching &quot;{searchQuery}&quot;
            </Typography>
            <Button size="small" variant="outlined" onClick={handleClearSearch}>
              Clear Search
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2.5}>
              {tables.map(table => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={table.id}>
                  <TableCard
                    table={table}
                    copiedId={copiedId}
                    isDeleting={isDeleting}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                  />
                </Grid>
              ))}
            </Grid>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mt: 2,
                pt: 1,
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
          </>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;
