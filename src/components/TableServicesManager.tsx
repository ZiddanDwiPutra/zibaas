'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ApiIcon from '@mui/icons-material/Api';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

export interface ServiceFilter {
  column: string;
  source: 'auth' | 'path' | 'query';
  param_name?: string;
  operator?: '=' | 'ILIKE' | '>' | '<';
}

export interface UpdateRule {
  allowed_fields?: string[];
  fixed_fields?: Record<string, any>;
}

export interface CustomService {
  id: number;
  table_id: number;
  service_name: string;
  method: 'GET' | 'PUT';
  description?: string;
  require_auth: boolean;
  filters: ServiceFilter[];
  update_rule?: UpdateRule;
}

interface TableServicesManagerProps {
  tableId: number;
  tableName: string;
  availableColumns: string[];
}

export const TableServicesManager: React.FC<TableServicesManagerProps> = ({
  tableId,
  tableName,
  availableColumns,
}) => {
  const [services, setServices] = useState<CustomService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New service form state
  const [serviceName, setServiceName] = useState('');
  const [method, setMethod] = useState<'GET' | 'PUT'>('GET');
  const [description, setDescription] = useState('');
  const [requireAuth, setRequireAuth] = useState(false);
  const [filters, setFilters] = useState<ServiceFilter[]>([]);

  // Update rule form state (if method === 'PUT')
  const [allowedUpdateFields, setAllowedUpdateFields] = useState<string[]>([]);
  const [fixedJsonInput, setFixedJsonInput] = useState('');

  const fetchServices = async () => {
    try {
      const res = await fetch(`/api/admin/services?table_id=${tableId}`);
      if (!res.ok) throw new Error('Failed to load custom services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [tableId]);

  const addFilter = () => {
    const defaultCol = availableColumns.length > 0 ? availableColumns[0] : 'id';
    setFilters(prev => [
      ...prev,
      {
        column: defaultCol,
        source: 'query',
        param_name: defaultCol,
        operator: '=',
      },
    ]);
  };

  const updateFilter = (index: number, field: keyof ServiceFilter, value: any) => {
    setFilters(prev =>
      prev.map((f, i) => {
        if (i !== index) return f;
        const updated = { ...f, [field]: value };
        if (field === 'column' && !f.param_name) {
          updated.param_name = value;
        }
        return updated;
      })
    );
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAllowedField = (col: string) => {
    setAllowedUpdateFields(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setMessage({ type: 'error', text: 'Service name is required' });
      return;
    }

    if (method === 'PUT' && filters.length === 0) {
      setMessage({ type: 'error', text: 'Update service requires at least 1 filter condition (WHERE) to identify target rows.' });
      return;
    }

    let fixedFieldsObj: Record<string, any> = {};
    if (method === 'PUT' && fixedJsonInput.trim()) {
      try {
        fixedFieldsObj = JSON.parse(fixedJsonInput);
      } catch {
        setMessage({ type: 'error', text: 'Fixed fields must be valid JSON object (e.g. {"status": "completed"})' });
        return;
      }
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          service_name: serviceName.trim().toLowerCase(),
          method,
          description: description.trim(),
          require_auth: requireAuth,
          filters,
          update_rule: method === 'PUT' ? {
            allowed_fields: allowedUpdateFields,
            fixed_fields: fixedFieldsObj,
          } : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create service');
      }

      setMessage({ type: 'success', text: `Service '${serviceName}' created successfully!` });
      setServiceName('');
      setMethod('GET');
      setDescription('');
      setRequireAuth(false);
      setFilters([]);
      setAllowedUpdateFields([]);
      setFixedJsonInput('');
      setIsCreating(false);
      fetchServices();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this custom service?')) return;
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      setServices(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Service removed successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const getEndpointExample = (srv: CustomService) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zibaas.netlify.app';
    const pathParams = srv.filters.filter(f => f.source === 'path').map(f => `:${f.param_name || f.column}`).join('/');
    const pathSuffix = pathParams ? `/${pathParams}` : '';
    const queryParams = srv.filters.filter(f => f.source === 'query').map(f => `${f.param_name || f.column}=value`).join('&');
    const querySuffix = queryParams ? `?${queryParams}` : '';
    return `${srv.method} ${origin}/api/v1/${tableName}/services/${srv.service_name}${pathSuffix}${querySuffix}`;
  };

  const copyEndpoint = (srv: CustomService) => {
    const urlOnly = getEndpointExample(srv).replace(/^[A-Z]+\s+/, '');
    navigator.clipboard.writeText(urlOnly);
    setCopiedId(srv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ApiIcon sx={{ color: 'primary.main', fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Custom API Services & Filtered Actions
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Buat endpoint API khusus untuk <strong>SELECT (GET)</strong> atau <strong>UPDATE (PUT)</strong> baris data dengan filter dan pembatasan payload kustom.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={isCreating ? undefined : <AddIcon />}
          onClick={() => setIsCreating(!isCreating)}
          sx={{ textTransform: 'none' }}
        >
          {isCreating ? 'Cancel' : 'New Service API'}
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {isCreating && (
        <Box
          component="form"
          onSubmit={handleCreateService}
          sx={{
            p: 2.5,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Create New Custom Service
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
              <InputLabel>HTTP Method</InputLabel>
              <Select
                label="HTTP Method"
                value={method}
                onChange={(e) => setMethod(e.target.value as 'GET' | 'PUT')}
              >
                <MenuItem value="GET">GET (Query / Read)</MenuItem>
                <MenuItem value="PUT">PUT (Update Fields)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Service Name (slug)"
              placeholder="e.g. update-profile, mark-complete"
              size="small"
              required
              fullWidth
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              helperText={`Endpoint: ${method} /api/v1/${tableName}/services/${serviceName || '{slug}'}`}
            />

            <TextField
              label="Description (optional)"
              placeholder="e.g. Mengupdate config pengguna yang sedang login"
              size="small"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={requireAuth}
                onChange={(e) => setRequireAuth(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                Require User Session JWT (<code>Authorization: Bearer &lt;token&gt;</code>)
              </Typography>
            }
          />

          {/* Filter section (WHERE) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                FILTER CONDITIONS (WHERE CLAUSE)
              </Typography>
              <Button size="small" variant="text" startIcon={<AddIcon />} onClick={addFilter} sx={{ textTransform: 'none' }}>
                Add Filter
              </Button>
            </Box>

            {filters.length === 0 ? (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Belum ada filter. Klik &quot;Add Filter&quot; untuk menyaring data berdasarkan Auth User ID, Path parameter, atau Query parameter.
              </Typography>
            ) : (
              filters.map((f, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Kolom Tabel</InputLabel>
                    <Select
                      label="Kolom Tabel"
                      value={f.column}
                      onChange={(e) => updateFilter(idx, 'column', e.target.value)}
                    >
                      <MenuItem value="id">id (Primary Key)</MenuItem>
                      {availableColumns.filter(c => c !== 'id').map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Operator</InputLabel>
                    <Select
                      label="Operator"
                      value={f.operator || '='}
                      onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
                    >
                      <MenuItem value="=">=</MenuItem>
                      <MenuItem value="ILIKE">LIKE (text)</MenuItem>
                      <MenuItem value=">">&gt;</MenuItem>
                      <MenuItem value="<">&lt;</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Sumber Filter</InputLabel>
                    <Select
                      label="Sumber Filter"
                      value={f.source}
                      onChange={(e) => updateFilter(idx, 'source', e.target.value as any)}
                    >
                      <MenuItem value="auth">🔐 Auth (User ID Session)</MenuItem>
                      <MenuItem value="path">🛣️ Path Parameter (/:id)</MenuItem>
                      <MenuItem value="query">🔎 Query Parameter (?key=val)</MenuItem>
                    </Select>
                  </FormControl>

                  {f.source !== 'auth' && (
                    <TextField
                      label={f.source === 'path' ? 'Path Variable Name' : 'Query Param Name'}
                      size="small"
                      value={f.param_name || ''}
                      onChange={(e) => updateFilter(idx, 'param_name', e.target.value)}
                      sx={{ minWidth: 160 }}
                    />
                  )}

                  <IconButton size="small" color="error" onClick={() => removeFilter(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))
            )}
          </Box>

          {/* UPDATE RULES (Only if method is PUT) */}
          {method === 'PUT' && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                ✏️ Update Action Rules & Allowed Payload Fields
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Pilih kolom mana saja yang diizinkan untuk diubah oleh klien dari JSON body, sehingga klien tidak bisa mengedit kolom sensitif lainnya.
              </Typography>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Centang Kolom yang Boleh Di-update dari Request Payload:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {availableColumns.filter(c => c !== 'id').map(col => {
                    const isChecked = allowedUpdateFields.includes(col);
                    return (
                      <FormControlLabel
                        key={col}
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleAllowedField(col)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{col}</Typography>}
                      />
                    );
                  })}
                </Box>
                {allowedUpdateFields.length === 0 && (
                  <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', mt: 0.5 }}>
                    * Jika tidak ada yang dicentang, semua kolom biasa (selain ID) boleh diubah dari body.
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Fixed Static Fields (Opsional - JSON):
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Nilai tetap yang selalu di-inject otomatis oleh server saat update (contoh: <code>{`{"status": "completed"}`}</code>).
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder='{"status": "completed"}'
                  value={fixedJsonInput}
                  onChange={(e) => setFixedJsonInput(e.target.value)}
                  sx={{ fontFamily: 'monospace' }}
                />
              </Box>
            </Paper>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <Button size="small" variant="text" onClick={() => setIsCreating(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
            >
              Simpan Service API
            </Button>
          </Box>
        </Box>
      )}

      {/* Services List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : services.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
          Belum ada custom service untuk tabel ini. Buat service kustom untuk mempermudah integrasi aplikasi Anda.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {services.map((srv) => (
            <Paper
              key={srv.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={srv.method}
                    color={srv.method === 'PUT' ? 'warning' : 'primary'}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {srv.service_name}
                  </Typography>
                  {srv.require_auth && (
                    <Chip label="Auth Required" color="warning" size="small" variant="outlined" />
                  )}
                  {srv.method === 'PUT' && (
                    <Chip label="Update Service" size="small" variant="outlined" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={copiedId === srv.id ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    onClick={() => copyEndpoint(srv)}
                    sx={{ textTransform: 'none', py: 0.25 }}
                  >
                    {copiedId === srv.id ? 'Copied URL' : 'Copy URL'}
                  </Button>
                  <IconButton size="small" color="error" onClick={() => handleDeleteService(srv.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {srv.description && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {srv.description}
                </Typography>
              )}

              {/* Filters preview */}
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>WHERE:</Typography>
                {srv.filters.map((f, i) => (
                  <Chip
                    key={i}
                    size="small"
                    variant="outlined"
                    label={`${f.column} ${f.operator || '='} [${f.source === 'auth' ? 'Auth User' : f.source + ':' + (f.param_name || f.column)}]`}
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>

              {/* Update rules preview */}
              {srv.method === 'PUT' && srv.update_rule && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mt: 0.25 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>SET:</Typography>
                  {srv.update_rule.allowed_fields && srv.update_rule.allowed_fields.length > 0 ? (
                    srv.update_rule.allowed_fields.map(f => (
                      <Chip key={f} size="small" color="info" variant="outlined" label={`Allow: ${f}`} sx={{ fontSize: '0.68rem', height: 20 }} />
                    ))
                  ) : (
                    <Chip size="small" variant="outlined" label="Allow all payload fields" sx={{ fontSize: '0.68rem', height: 20 }} />
                  )}
                  {srv.update_rule.fixed_fields && Object.keys(srv.update_rule.fixed_fields).length > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label={`Fixed: ${JSON.stringify(srv.update_rule.fixed_fields)}`}
                      sx={{ fontSize: '0.68rem', height: 20 }}
                    />
                  )}
                </Box>
              )}

              <Box
                sx={{
                  mt: 0.5,
                  p: 1,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                }}
              >
                {getEndpointExample(srv)}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};
