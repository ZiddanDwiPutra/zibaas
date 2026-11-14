'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SaveIcon from '@mui/icons-material/Save';
import { TableAuthConfig } from '@/components/TableAuthConfig';
import { EndpointPermissionsCard, AllowedEndpoints } from '@/components/EndpointPermissionsCard';

interface TableEditSettingsProps {
  tableId: number;
  tableName: string;
  initialEnableAuth: boolean;
  initialUserIdColumn: string;
  initialAllowedEndpoints?: AllowedEndpoints;
  availableColumns: string[];
  onSaved?: () => void;
}

export const TableEditSettings: React.FC<TableEditSettingsProps> = ({
  tableId,
  tableName,
  initialEnableAuth,
  initialUserIdColumn,
  initialAllowedEndpoints,
  availableColumns,
  onSaved,
}) => {
  const [enableAuth, setEnableAuth] = useState(initialEnableAuth);
  const allColumnsWithId = availableColumns.includes('id') ? availableColumns : ['id', ...availableColumns];
  const defaultOwnerCol = allColumnsWithId.includes(initialUserIdColumn)
    ? initialUserIdColumn
    : (allColumnsWithId.length > 0 ? allColumnsWithId[0] : 'id');
  const [userIdColumn, setUserIdColumn] = useState(defaultOwnerCol);
  const [allowedEndpoints, setAllowedEndpoints] = useState<AllowedEndpoints>(
    initialAllowedEndpoints || {
      allow_get_list: true,
      allow_get_id: true,
      allow_post: true,
      allow_put: true,
      allow_delete: true,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableAuth,
          userIdColumn: enableAuth ? userIdColumn : null,
          allowedEndpoints,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update table settings');
      }

      setStatus({ type: 'success', text: 'Table security and endpoint settings updated successfully!' });
      if (onSaved) onSaved();
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {status && (
        <Alert severity={status.type} sx={{ borderRadius: 2 }}>
          {status.text}
        </Alert>
      )}

      <TableAuthConfig
        enableAuth={enableAuth}
        onEnableAuthChange={setEnableAuth}
        userIdColumn={userIdColumn}
        onUserIdColumnChange={setUserIdColumn}
        availableColumns={availableColumns}
      />

      <EndpointPermissionsCard
        allowedEndpoints={allowedEndpoints}
        onChange={setAllowedEndpoints}
        tableName={tableName}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="small"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
          sx={{ px: 3, textTransform: 'none' }}
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>
    </Box>
  );
};
