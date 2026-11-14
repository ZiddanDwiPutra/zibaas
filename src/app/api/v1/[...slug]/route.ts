import { NextRequest, NextResponse } from 'next/server';
import { query, insertRow, updateRow, deleteRow, getSetting } from '@/lib/db';
import { resolveAuthContext, AuthContext } from '@/lib/auth-context';
import { formatBadRequestError } from '@/lib/error-utils';

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

async function getTableMeta(tableName: string) {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const tableCheck = await query(
    'SELECT id, id_type, enable_pagination, page_size, enable_auth, user_id_column, allowed_endpoints FROM system_tables WHERE table_name = $1',
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
  let allowedEndpoints = {
    allow_get_list: true,
    allow_get_id: true,
    allow_post: true,
    allow_put: true,
    allow_delete: true,
  };
  if (table.allowed_endpoints) {
    try {
      allowedEndpoints = typeof table.allowed_endpoints === 'string'
        ? JSON.parse(table.allowed_endpoints)
        : table.allowed_endpoints;
    } catch {
      // fallback
    }
  }

  return {
    id: table.id,
    name: safeName,
    id_type: table.id_type || 'serial',
    enable_pagination: table.enable_pagination || false,
    page_size: table.page_size || 10,
    enable_auth: table.enable_auth || false,
    user_id_column: table.user_id_column || null,
    allowed_endpoints: allowedEndpoints,
    columns: colsCheck.rows,
  };
}

async function findCustomService(tableId: number, serviceName: string, method: string) {
  const res = await query(
    'SELECT id, table_id, service_name, method, description, require_auth, filters, update_rule FROM system_services WHERE table_id = $1 AND service_name = $2 AND method = $3',
    [tableId, serviceName.toLowerCase(), method.toUpperCase()]
  );
  if (res.rows.length === 0) return null;
  const item = res.rows[0];
  return {
    ...item,
    filters: typeof item.filters === 'string' ? JSON.parse(item.filters) : item.filters || [],
    update_rule: typeof item.update_rule === 'string' ? JSON.parse(item.update_rule) : item.update_rule || {},
  };
}

/**
 * Handle custom service requests (e.g. /api/v1/my_table/services/active_user or /api/v1/my_table/s/custom_name/:pathVal)
 */
async function handleCustomService(
  request: NextRequest,
  meta: any,
  serviceName: string,
  pathValues: string[],
  method: string,
  authCtx: AuthContext
) {
  const service = await findCustomService(meta.id, serviceName, method);
  if (!service) {
    return await jsonResponse(
      request,
      { error: `Custom service '${serviceName}' for method ${method} not found on table '${meta.name}'` },
      { status: 404 }
    );
  }

  // Auth requirement
  if (service.require_auth && !authCtx.userId && !authCtx.isAdminSession) {
    return await jsonResponse(
      request,
      { error: 'Service requires an active User Session Token (Authorization: Bearer <token>)' },
      { status: 401 }
    );
  }

  const prefixedTable = `user_${meta.name}`;
  const conditions: string[] = [];
  const queryParams: any[] = [];
  const searchParams = request.nextUrl.searchParams;

  let pathIdx = 0;
  for (const filter of service.filters) {
    const col = filter.column;
    const op = filter.operator || '=';

    if (filter.source === 'auth') {
      if (!authCtx.userId) {
        return await jsonResponse(request, { error: 'Service requires an active user session token' }, { status: 401 });
      }
      queryParams.push(authCtx.userId);
      conditions.push(`"${col}" ${op} $${queryParams.length}`);
    } else if (filter.source === 'path') {
      const val = pathValues[pathIdx++];
      if (val === undefined) {
        return await jsonResponse(
          request,
          { error: `Missing required path parameter for '${filter.param_name || col}'` },
          { status: 400 }
        );
      }
      queryParams.push(val);
      conditions.push(`"${col}" ${op} $${queryParams.length}`);
    } else if (filter.source === 'query') {
      const paramKey = filter.param_name || col;
      const val = searchParams.get(paramKey);
      if (val !== null) {
        if (op === 'ILIKE') {
          queryParams.push(`%${val}%`);
        } else {
          queryParams.push(val);
        }
        conditions.push(`"${col}" ${op} $${queryParams.length}`);
      }
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (method === 'GET') {
    const rows = await query(`SELECT * FROM "${prefixedTable}" ${whereClause} ORDER BY created_at DESC`, queryParams);
    return await jsonResponse(request, {
      service: service.service_name,
      total: rows.rows.length,
      data: rows.rows,
    });
  }

  if (method === 'PUT' || method === 'PATCH') {
    if (!whereClause) {
      return await jsonResponse(request, { error: 'Update service must have at least one filter condition to prevent full-table updates' }, { status: 400 });
    }

    let payload: Record<string, any> = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const updateRule = service.update_rule || {};
    const allowedFields: string[] = Array.isArray(updateRule.allowed_fields) ? updateRule.allowed_fields : [];
    const fixedFields: Record<string, any> = updateRule.fixed_fields || {};

    const fieldsToUpdate: Record<string, any> = {};

    // 1. Extract allowed fields from client payload
    if (allowedFields.length > 0) {
      for (const field of allowedFields) {
        if (payload[field] !== undefined) {
          fieldsToUpdate[field] = payload[field];
        }
      }
    } else {
      // If no allowed_fields specified, allow all valid table columns except primary id and user_id_column
      for (const key of Object.keys(payload)) {
        if (key !== 'id' && key !== meta.user_id_column && meta.columns.some((c: any) => c.column_name === key)) {
          fieldsToUpdate[key] = payload[key];
        }
      }
    }

    // 2. Apply fixed static fields (overrides client payload)
    for (const [key, val] of Object.entries(fixedFields)) {
      fieldsToUpdate[key] = val;
    }

    const updateKeys = Object.keys(fieldsToUpdate);
    if (updateKeys.length === 0) {
      return await jsonResponse(request, { error: 'No valid fields provided for update' }, { status: 400 });
    }

    // Build UPDATE query
    // e.g. UPDATE "user_tasks" SET "status" = $1 WHERE "id" = $2 AND "user_id" = $3
    const setClauses: string[] = [];
    const updateParams: any[] = [];

    updateKeys.forEach((key) => {
      updateParams.push(fieldsToUpdate[key]);
      setClauses.push(`"${key}" = $${updateParams.length}`);
    });

    // Re-index WHERE parameters after SET parameters
    const whereParamsOffset = updateParams.length;
    let offsetWhereClause = whereClause;
    for (let i = queryParams.length; i >= 1; i--) {
      offsetWhereClause = offsetWhereClause.replace(
        new RegExp(`\\$${i}\\b`, 'g'),
        `$${i + whereParamsOffset}`
      );
    }

    const allParams = [...updateParams, ...queryParams];
    const updateQueryStr = `UPDATE "${prefixedTable}" SET ${setClauses.join(', ')} ${offsetWhereClause} RETURNING *`;
    
    const updateRes = await query(updateQueryStr, allParams);
    if (updateRes.rows.length === 0) {
      return await jsonResponse(request, { error: 'Record not found or access denied for update' }, { status: 404 });
    }

    return await jsonResponse(request, {
      success: true,
      service: service.service_name,
      updated_count: updateRes.rows.length,
      data: updateRes.rows.length === 1 ? updateRes.rows[0] : updateRes.rows,
    });
  }

  return await jsonResponse(request, { error: 'Service method execution not supported yet' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const authCtx = await resolveAuthContext(request);
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return await jsonResponse(request, { error: 'Table name is required' }, { status: 400 });
  }

  const tableName = slug[0];
  const meta = await getTableMeta(tableName);
  if (!meta) {
    return await jsonResponse(request, { error: `Table '${tableName}' not found` }, { status: 404 });
  }

  // Check if this is a custom service route:
  // e.g. /api/v1/:tableName/services/:serviceName/... or /api/v1/:tableName/s/:serviceName/...
  if (slug.length >= 3 && (slug[1] === 'services' || slug[1] === 's')) {
    const serviceName = slug[2];
    const pathValues = slug.slice(3);
    return await handleCustomService(request, meta, serviceName, pathValues, 'GET', authCtx);
  }

  // Check table-level auth protection
  if (meta.enable_auth) {
    // Protected table strictly requires a valid User Session JWT (or ZiBaaS Admin UI session)
    if (!authCtx.userId && !authCtx.isAdminSession) {
      return await jsonResponse(
        request,
        { error: 'Protected table: Valid User Session Token (Authorization: Bearer <token>) required. Vendor API Key is not allowed for protected tables.' },
        { status: 401 }
      );
    }
  } else {
    // Open table - if API key check is strictly desired when envKey exists
    if (!authCtx.isAuthenticated) {
      return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const prefixedTable = `user_${meta.name}`;

    if (slug.length === 1) {
      if (!meta.allowed_endpoints?.allow_get_list && !authCtx.isAdminSession) {
        return await jsonResponse(
          request,
          { error: `Endpoint 'GET /api/v1/${meta.name}' (Get List) has been disabled for this table.` },
          { status: 403 }
        );
      }

      const searchParams = request.nextUrl.searchParams;
      const searchVal = searchParams.get('search');
      const textColumns = meta.columns.filter((c: any) => c.column_type === 'text').map((c: any) => c.column_name);

      const conditions: string[] = [];
      const queryParams: any[] = [];

      // Auto RLS: Filter by user_id if table is protected and user_id_column is set (and not admin dashboard)
      if (meta.enable_auth && meta.user_id_column && authCtx.userId && !authCtx.isAdminSession) {
        queryParams.push(authCtx.userId);
        conditions.push(`"${meta.user_id_column}" = $${queryParams.length}`);
      }

      if (searchVal && textColumns.length > 0) {
        queryParams.push(`%${searchVal}%`);
        const searchConditions = textColumns.map((col: string) => `"${col}" ILIKE $${queryParams.length}`).join(' OR ');
        conditions.push(`(${searchConditions})`);
      }

      meta.columns.forEach((col: any) => {
        const val = searchParams.get(col.column_name);
        if (val && val !== 'all') {
          queryParams.push(val);
          conditions.push(`"${col.column_name}" = $${queryParams.length}`);
        }
      });

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
            total_pages: Math.ceil(total / limit) || 1,
          },
        });
      }

      const result = await query(
        `SELECT * FROM "${prefixedTable}" ${whereClause} ORDER BY created_at DESC`,
        queryParams
      );
      return await jsonResponse(request, { data: result.rows });
    }

    if (slug.length === 2) {
      if (!meta.allowed_endpoints?.allow_get_id && !authCtx.isAdminSession) {
        return await jsonResponse(
          request,
          { error: `Endpoint 'GET /api/v1/${meta.name}/:id' has been disabled for this table.` },
          { status: 403 }
        );
      }

      const idRaw = slug[1];
      let id: any = idRaw;
      if (meta.id_type === 'serial') {
        id = parseInt(idRaw, 10);
        if (isNaN(id)) {
          return await jsonResponse(request, { error: 'Invalid record ID' }, { status: 400 });
        }
      }

      const conditions = ['id = $1'];
      const queryParams: any[] = [id];

      // Auto RLS for single item fetch
      if (meta.enable_auth && meta.user_id_column && authCtx.userId && !authCtx.isAdminSession) {
        queryParams.push(authCtx.userId);
        conditions.push(`"${meta.user_id_column}" = $${queryParams.length}`);
      }

      const result = await query(`SELECT * FROM "${prefixedTable}" WHERE ${conditions.join(' AND ')}`, queryParams);
      if (result.rows.length === 0) {
        return await jsonResponse(request, { error: 'Record not found or access denied' }, { status: 404 });
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
  const authCtx = await resolveAuthContext(request);
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return await jsonResponse(request, { error: 'Table name is required' }, { status: 400 });
  }

  const tableName = slug[0];
  const meta = await getTableMeta(tableName);
  if (!meta) {
    return await jsonResponse(request, { error: `Table '${tableName}' not found` }, { status: 404 });
  }

  if (meta.enable_auth) {
    if (!authCtx.userId && !authCtx.isAdminSession) {
      return await jsonResponse(
        request,
        { error: 'Protected table: Valid User Session Token (Authorization: Bearer <token>) required. Vendor API Key is not allowed for protected tables.' },
        { status: 401 }
      );
    }
  } else if (!authCtx.isAuthenticated) {
    return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (slug.length !== 1) {
      return await jsonResponse(request, { error: 'Invalid endpoint for creation' }, { status: 400 });
    }

    if (!meta.allowed_endpoints?.allow_post && !authCtx.isAdminSession) {
      return await jsonResponse(
        request,
        { error: `Endpoint 'POST /api/v1/${meta.name}' (Create) has been disabled for this table.` },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Auto RLS: Inject session user_id into owner column
    if (meta.enable_auth && meta.user_id_column && authCtx.userId) {
      body[meta.user_id_column] = authCtx.userId;
    }

    const result = await insertRow(meta.name, body);
    return await jsonResponse(request, { success: true, data: result }, { status: 201 });
  } catch (error: any) {
    const formatted = formatBadRequestError(error);
    return await jsonResponse(request, { error: formatted }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const authCtx = await resolveAuthContext(request);
  const { slug } = await params;

  if (!slug || slug.length < 2) {
    return await jsonResponse(request, { error: 'Invalid endpoint for update' }, { status: 400 });
  }

  const tableName = slug[0];
  const meta = await getTableMeta(tableName);
  if (!meta) {
    return await jsonResponse(request, { error: `Table '${tableName}' not found` }, { status: 404 });
  }

  // Check if this is a custom service route for update:
  // e.g. PUT /api/v1/:tableName/services/:serviceName/... or /api/v1/:tableName/s/:serviceName/...
  if (slug.length >= 3 && (slug[1] === 'services' || slug[1] === 's')) {
    const serviceName = slug[2];
    const pathValues = slug.slice(3);
    return await handleCustomService(request, meta, serviceName, pathValues, 'PUT', authCtx);
  }

  const idRaw = slug[1];

  if (meta.enable_auth) {
    if (!authCtx.userId && !authCtx.isAdminSession) {
      return await jsonResponse(
        request,
        { error: 'Protected table: Valid User Session Token (Authorization: Bearer <token>) required. Vendor API Key is not allowed for protected tables.' },
        { status: 401 }
      );
    }
  } else if (!authCtx.isAuthenticated) {
    return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!meta.allowed_endpoints?.allow_put && !authCtx.isAdminSession) {
      return await jsonResponse(
        request,
        { error: `Endpoint 'PUT /api/v1/${meta.name}/:id' (Update) has been disabled for this table.` },
        { status: 403 }
      );
    }

    let id: any = idRaw;
    if (meta.id_type === 'serial') {
      id = parseInt(idRaw, 10);
      if (isNaN(id)) {
        return await jsonResponse(request, { error: 'Invalid record ID' }, { status: 400 });
      }
    }

    // Check ownership if RLS is enabled
    if (meta.enable_auth && meta.user_id_column && authCtx.userId && !authCtx.isAdminSession) {
      const ownerCheck = await query(
        `SELECT id FROM "user_${meta.name}" WHERE id = $1 AND "${meta.user_id_column}" = $2`,
        [id, authCtx.userId]
      );
      if (ownerCheck.rows.length === 0) {
        return await jsonResponse(request, { error: 'Forbidden: You do not own this record' }, { status: 403 });
      }
    }

    const body = await request.json();
    // Prevent changing user_id_column if table is protected and user_id_column is set
    // BUT allow changing 'id' even if user_id_column === 'id' when user is in admin session (dashboard)
    if (meta.user_id_column && meta.user_id_column !== 'id') {
      delete body[meta.user_id_column];
    } else if (meta.user_id_column === 'id' && !authCtx.isAdminSession) {
      delete body.id;
    }

    const result = await updateRow(meta.name, id, body);
    return await jsonResponse(request, { success: true, data: result });
  } catch (error: any) {
    const formatted = formatBadRequestError(error);
    return await jsonResponse(request, { error: formatted }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const authCtx = await resolveAuthContext(request);
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

  if (meta.enable_auth) {
    if (!authCtx.userId && !authCtx.isAdminSession) {
      return await jsonResponse(
        request,
        { error: 'Protected table: Valid User Session Token (Authorization: Bearer <token>) required. Vendor API Key is not allowed for protected tables.' },
        { status: 401 }
      );
    }
  } else if (!authCtx.isAuthenticated) {
    return await jsonResponse(request, { error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!meta.allowed_endpoints?.allow_delete && !authCtx.isAdminSession) {
      return await jsonResponse(
        request,
        { error: `Endpoint 'DELETE /api/v1/${meta.name}/:id' (Delete) has been disabled for this table.` },
        { status: 403 }
      );
    }

    let id: any = idRaw;
    if (meta.id_type === 'serial') {
      id = parseInt(idRaw, 10);
      if (isNaN(id)) {
        return await jsonResponse(request, { error: 'Invalid record ID' }, { status: 400 });
      }
    }

    // Check ownership if RLS is enabled
    if (meta.enable_auth && meta.user_id_column && authCtx.userId && !authCtx.isAdminSession) {
      const ownerCheck = await query(
        `SELECT id FROM "user_${meta.name}" WHERE id = $1 AND "${meta.user_id_column}" = $2`,
        [id, authCtx.userId]
      );
      if (ownerCheck.rows.length === 0) {
        return await jsonResponse(request, { error: 'Forbidden: You do not own this record' }, { status: 403 });
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
