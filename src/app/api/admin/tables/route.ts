import { NextRequest, NextResponse } from 'next/server';
import { query, createTable } from '@/lib/db';

export async function GET() {
  try {
    const tablesRes = await query('SELECT * FROM system_tables ORDER BY created_at DESC');
    const tables = tablesRes.rows;

    const fullTables = await Promise.all(
      tables.map(async (table: any) => {
        const columnsRes = await query(
          'SELECT column_name, column_type, is_nullable, references_table FROM system_columns WHERE table_id = $1',
          [table.id]
        );
        const rowsCountRes = await query(`SELECT COUNT(*) as count FROM "user_${table.table_name}"`).catch(() => ({ rows: [{ count: 0 }] }));
        const rowCount = parseInt(rowsCountRes.rows[0]?.count || 0, 10);
        return {
          ...table,
          columns: columnsRes.rows,
          rowCount,
        };
      })
    );

    return NextResponse.json({ tables: fullTables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, columns, idType, enablePagination, pageSize } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const safeName = name.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeName || safeName.length === 0) {
      return NextResponse.json({ error: 'Invalid characters in table name' }, { status: 400 });
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ error: 'Columns must be a non-empty array' }, { status: 400 });
    }

    const sanitizedColumns = columns.map((col: any) => {
      if (!col.name || typeof col.name !== 'string') {
        throw new Error('Column name is required');
      }
      const safeColName = col.name.replace(/[^a-zA-Z0-9_]/g, '');
      if (!safeColName) {
        throw new Error('Invalid column name');
      }
      const allowedTypes = ['text', 'integer', 'boolean', 'timestamp', 'relation'];
      const type = allowedTypes.includes(col.type) ? col.type : 'text';
      return {
        name: safeColName,
        type,
        nullable: col.nullable !== false,
        referencesTable: col.referencesTable || null,
      };
    });

    await createTable(sanitizedColumns.length > 0 ? safeName : '', sanitizedColumns, {
      idType: idType === 'uuid' ? 'uuid' : 'serial',
      enablePagination: !!enablePagination,
      pageSize: typeof pageSize === 'number' ? pageSize : 10,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
