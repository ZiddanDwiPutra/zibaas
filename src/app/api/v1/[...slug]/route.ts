import { NextRequest, NextResponse } from 'next/server';
import { query, insertRow, updateRow, deleteRow, getSetting } from '@/lib/db';

async function getCorsHeaders(request: NextRequest) {
  const allowAll = await getSetting('cors_allow_all');
  const whitelistRaw = await getSetting('cors_whitelist');

  if (allowAll === 'true' || allowAll === '') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    };
  }

  const origin = request.headers.get('origin') || '';
  const whitelist = whitelistRaw
    .split(/[\n,]/)
    .map(o => o.trim())
    .filter(o => o.length > 0);

  const isAllowed = whitelist.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  };
}

async function jsonResponse(request: NextRequest, body: any, init?: ResponseInit) {
  const corsHeaders = await getCorsHeaders(request);
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...init?.headers,
      ...corsHeaders,
    },
  });
}

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
    'SELECT id, id_type, enable_pagination, page_size FROM system_tables WHERE table_name = $1',
    [safeName]
  );
  if (tableCheck.rows.length === 0) {
    return null;
  }
  const table = tableCheck.rows[0];
  const colsCheck = await query(
    'SELECT column_name, column_type, is_nullable FROM system_columns WHERE table_id = $1',
    [table.id]
  );
  return {
    id: table.id,
    name: safeName,
    id_type: table.id_type || 'serial',
    enable_pagination: table.enable_pagination || false,
    page_size: table.page_size || 10,
    columns: colsCheck.rows,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return await jsonResponse(request, { error: 'Table name is required' }, { status: 400 });
    }

    const tableName = slug[0];
    const meta = await getTableMeta(tableName);
    if (!meta) {
      return await jsonResponse(request, { error: `Table '${tableName}' not found` }, { status: 404 });
    }

    const prefixedTable = `user_${meta.name}`;

    if (slug.length === 1) {
      const searchParams = request.nextUrl.searchParams;
      const searchVal = searchParams.get('search');
      const textColumns = meta.columns.filter((c: any) => c.column_type === 'text').map((c: any) => c.column_name);

      let whereClause = '';
      const queryParams: any[] = [];

      if (searchVal && textColumns.length > 0) {
        const conditions = textColumns.map((col: string) => `"${col}" ILIKE $1`).join(' OR ');
        whereClause = `WHERE ${conditions}`;
        queryParams.push(`%${searchVal}%`);
      }

      if (meta.enable_pagination) {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || String(meta.page_size), 10);
        const offset = (page - 1) * limit;

        const countRes = await query(
          `SELECT COUNT(*) as count FROM "${prefixedTable}" ${whereClause}`,
          queryParams
        );
        const total = parseInt(countRes.rows[0]?.count || 0, 10);

        const limitPlaceholder = `$${queryParams.length + 1}`;
        const offsetPlaceholder = `$${queryParams.length + 2}`;
        queryParams.push(limit);
        queryParams.push(offset);

        const result = await query(
          `SELECT * FROM "${prefixedTable}" ${whereClause} ORDER BY created_at DESC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
          queryParams
        );

        return await jsonResponse(request, {
          data: result.rows,
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
          }
        });
      }

      const result = await query(
        `SELECT * FROM "${prefixedTable}" ${whereClause} ORDER BY created_at DESC`,
        queryParams
      );
      return await jsonResponse(request, { data: result.rows });
    }

    if (slug.length === 2) {
      const idRaw = slug[1];
      let id: any = idRaw;
      if (meta.id_type === 'serial') {
        id = parseInt(idRaw, 10);
        if (isNaN(id)) {
          return await jsonResponse(request, { error: 'Invalid record ID' }, { status: 400 });
        }
      }
      const result = await query(`SELECT * FROM "${prefixedTable}" WHERE id = $1`, [id]);
      if (result.rows.length === 0) {
        return await jsonResponse(request, { error: 'Record not found' }, { status: 404 });
      }
      return await jsonResponse(request, { data: result.rows[0] });
    }

    return await jsonResponse(request, { error: 'Invalid route path' }, { status: 400 });
  } catch (error: any) {
    return await jsonResponse(request, { error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length === 0) {
      return await jsonResponse(request, { error: 'Table name is required' }, { status: 400 });
    }

    const tableName = slug[0];
    const meta = await getTableMeta(tableName);
    if (!meta) {
      return await jsonResponse(request, { error: `Table '${tableName}' not found` }, { status: 404 });
    }

    if (slug.length !== 1) {
      return await jsonResponse(request, { error: 'Invalid endpoint for creation' }, { status: 400 });
    }

    const body = await request.json();
    const result = await insertRow(meta.name, body);

    return await jsonResponse(request, { success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return await jsonResponse(request, { error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length < 2) {
      return await jsonResponse(request, { error: 'Invalid endpoint for update' }, { status: 400 });
    }

    const tableName = slug[0];
    const idRaw = slug[1];

    const meta = await getTableMeta(tableName);
    if (!meta) {
      return await jsonResponse(request, { error: `Table '${tableName}' not found` }, { status: 404 });
    }

    let id: any = idRaw;
    if (meta.id_type === 'serial') {
      id = parseInt(idRaw, 10);
      if (isNaN(id)) {
        return await jsonResponse(request, { error: 'Invalid record ID' }, { status: 400 });
      }
    }

    const body = await request.json();
    const result = await updateRow(meta.name, id, body);

    return await jsonResponse(request, { success: true, data: result });
  } catch (error: any) {
    return await jsonResponse(request, { error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (!verifyApiKey(request)) {
    return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    if (!slug || slug.length < 2) {
      return await jsonResponse(request, { error: 'Invalid endpoint for delete' }, { status: 400 });
    }

    const tableName = slug[0];
    const idRaw = slug[1];

    const meta = await getTableMeta(tableName);
    if (!meta) {
      return await jsonResponse(request, { error: `Table '${tableName}' not found` }, { status: 404 });
    }

    let id: any = idRaw;
    if (meta.id_type === 'serial') {
      id = parseInt(idRaw, 10);
      if (isNaN(id)) {
        return await jsonResponse(request, { error: 'Invalid record ID' }, { status: 400 });
      }
    }

    await deleteRow(meta.name, id);

    return await jsonResponse(request, { success: true });
  } catch (error: any) {
    return await jsonResponse(request, { error: error.message }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = await getCorsHeaders(request);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
