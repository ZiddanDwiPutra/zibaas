import { NextRequest, NextResponse } from 'next/server';
import { query, dropTable, updateTableConfig, addColumnToTable } from '@/lib/db';
import { formatBadRequestError } from '@/lib/error-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tableId = parseInt(id, 10);
    if (isNaN(tableId)) {
      return NextResponse.json({ error: 'Invalid table ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, type, nullable, isUnique, is_unique, referencesTable } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Column name is required' }, { status: 400 });
    }

    await addColumnToTable(tableId, {
      name: name.trim(),
      type: type || 'text',
      nullable: nullable !== false,
      isUnique: !!(isUnique || is_unique),
      referencesTable: referencesTable || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    const formatted = formatBadRequestError(error);
    return NextResponse.json({ error: formatted }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tableId = parseInt(id, 10);
    if (isNaN(tableId)) {
      return NextResponse.json({ error: 'Invalid table ID' }, { status: 400 });
    }

    const body = await request.json();
    const { idType, enablePagination, pageSize, enableAuth, userIdColumn, allowedEndpoints } = body;

    await updateTableConfig(tableId, {
      idType,
      enablePagination,
      pageSize,
      enableAuth,
      userIdColumn,
      allowedEndpoints,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const formatted = formatBadRequestError(error);
    return NextResponse.json({ error: formatted }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tableId = parseInt(id, 10);
    if (isNaN(tableId)) {
      return NextResponse.json({ error: 'Invalid table ID' }, { status: 400 });
    }

    const tableRes = await query('SELECT table_name FROM system_tables WHERE id = $1', [tableId]);
    if (tableRes.rows.length === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const tableName = tableRes.rows[0].table_name;
    await dropTable(tableId, tableName);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
