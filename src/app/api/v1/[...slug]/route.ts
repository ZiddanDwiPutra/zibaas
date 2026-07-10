import { NextRequest, NextResponse } from 'next/server';
import { query, insertRow, updateRow, deleteRow } from '@/lib/db';

function verifyApiKey(request: NextRequest): boolean {
  const session = request.cookies.get('zibaas_session');
  if (session?.value === 'true') {
    return true;
  }

  const apiKeyHeader = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const providedKey = apiKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

  const envKey = process.env.ZIBAAS_API_KEY;
  if (!envKey) {
    return true;
  }
  return providedKey === envKey;
}

async function getTableMeta(tableName: string) {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const tableCheck = await query(
    'SELECT id FROM system_tables WHERE table_name = $1',
    [safeName]
  );
  if (tableCheck.rows.length === 0) {
    return null;
  }
  const tableId = tableCheck.rows[0].id;
  const colsCheck = await query(
    'SELECT column_name, column_type, is_nullable FROM system_columns WHERE table_id = $1',
    [tableId]
  );
  return {
    id: tableId,
    name: safeName,
    columns: colsCheck.rows,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }

    const tableName = slug[0];
    const meta = await getTableMeta(tableName);
    if (!meta) {
      return NextResponse.json({ error: `Table '${tableName}' not found` }, { status: 404 });
    }

    const prefixedTable = `user_${meta.name}`;

    if (slug.length === 1) {
      const result = await query(`SELECT * FROM "${prefixedTable}" ORDER BY created_at DESC`);
      return NextResponse.json({ data: result.rows });
    }

    if (slug.length === 2) {
      const id = parseInt(slug[1], 10);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
      }
      const result = await query(`SELECT * FROM "${prefixedTable}" WHERE id = $1`, [id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      return NextResponse.json({ data: result.rows[0] });
    }

    return NextResponse.json({ error: 'Invalid route path' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }

    const tableName = slug[0];
    const meta = await getTableMeta(tableName);
    if (!meta) {
      return NextResponse.json({ error: `Table '${tableName}' not found` }, { status: 404 });
    }

    if (slug.length !== 1) {
      return NextResponse.json({ error: 'Invalid endpoint for creation' }, { status: 400 });
    }

    const body = await request.json();
    const result = await insertRow(meta.name, body);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length < 2) {
      return NextResponse.json({ error: 'Invalid endpoint for update' }, { status: 400 });
    }

    const tableName = slug[0];
    const id = parseInt(slug[1], 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
    }

    const meta = await getTableMeta(tableName);
    if (!meta) {
      return NextResponse.json({ error: `Table '${tableName}' not found` }, { status: 404 });
    }

    const body = await request.json();
    const result = await updateRow(meta.name, id, body);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length < 2) {
      return NextResponse.json({ error: 'Invalid endpoint for delete' }, { status: 400 });
    }

    const tableName = slug[0];
    const id = parseInt(slug[1], 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
    }

    const meta = await getTableMeta(tableName);
    if (!meta) {
      return NextResponse.json({ error: `Table '${tableName}' not found` }, { status: 404 });
    }

    await deleteRow(meta.name, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
