import { NextRequest, NextResponse } from 'next/server';
import { query, dropTable } from '@/lib/db';

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
