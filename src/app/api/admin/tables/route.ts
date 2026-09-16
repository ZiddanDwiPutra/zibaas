import { NextRequest, NextResponse } from 'next/server';
import { query, createTable } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nameParam = searchParams.get('name');
    const simpleParam = searchParams.get('simple');

    if (nameParam) {
      const safeName = nameParam.replace(/[^a-zA-Z0-9_]/g, '');
      const tableRes = await query(
        'SELECT * FROM system_tables WHERE table_name = $1 LIMIT 1',
        [safeName]
      );
      if (tableRes.rows.length === 0) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      const table = tableRes.rows[0];
      const columnsRes = await query(
        'SELECT column_name, column_type, is_nullable, references_table FROM system_columns WHERE table_id = $1',
        [table.id]
      );
      const rowsCountRes = await query(`SELECT COUNT(*) as count FROM "user_${table.table_name}"`).catch(() => ({ rows: [{ count: 0 }] }));
      const rowCount = parseInt(rowsCountRes.rows[0]?.count || 0, 10);
      return NextResponse.json({
        table: {
          ...table,
          columns: columnsRes.rows,
          rowCount,
        },
      });
    }

    if (simpleParam === 'true') {
      const tablesRes = await query('SELECT id, table_name FROM system_tables ORDER BY table_name ASC');
      return NextResponse.json({ tables: tablesRes.rows });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams: any[] = [];

    if (search) {
      whereClause = 'WHERE st.table_name ILIKE $1 OR EXISTS (SELECT 1 FROM system_columns sc WHERE sc.table_id = st.id AND (sc.column_name ILIKE $1 OR sc.column_type ILIKE $1))';
      queryParams.push(`%${search}%`);
    }

    const totalRes = await query(
      `SELECT COUNT(*) as count FROM system_tables st ${whereClause}`,
      queryParams
    );
    const total = parseInt(totalRes.rows[0]?.count || 0, 10);

    const limitPlaceholder = `$${queryParams.length + 1}`;
    const offsetPlaceholder = `$${queryParams.length + 2}`;
    const paginatedParams = [...queryParams, limit, offset];

    const tablesRes = await query(
      `SELECT st.* FROM system_tables st ${whereClause} ORDER BY st.created_at DESC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      paginatedParams
    );
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

    const totalTablesRes = await query('SELECT COUNT(*) as count FROM system_tables');
    const totalColumnsRes = await query('SELECT COUNT(*) as count FROM system_columns');
    const activeTables = parseInt(totalTablesRes.rows[0]?.count || 0, 10);
    const schemaColumns = parseInt(totalColumnsRes.rows[0]?.count || 0, 10);

    const allTableNamesRes = await query('SELECT table_name FROM system_tables');
    const rowCounts = await Promise.all(
      allTableNamesRes.rows.map(async (t: any) => {
        const cRes = await query(`SELECT COUNT(*) as count FROM "user_${t.table_name}"`).catch(() => ({ rows: [{ count: 0 }] }));
        return parseInt(cRes.rows[0]?.count || 0, 10);
      })
    );
    const aggregateRecords = rowCounts.reduce((acc, c) => acc + c, 0);

    return NextResponse.json({
      tables: fullTables,
      stats: {
        activeTables,
        schemaColumns,
        aggregateRecords,
      },
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    });
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
