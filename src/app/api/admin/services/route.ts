import { NextRequest, NextResponse } from 'next/server';
import { getServicesByTableId, createService, deleteService, query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableIdParam = searchParams.get('table_id');
    const tableNameParam = searchParams.get('table_name');

    let tableId: number | null = null;
    if (tableIdParam) {
      tableId = parseInt(tableIdParam, 10);
    } else if (tableNameParam) {
      const res = await query('SELECT id FROM system_tables WHERE table_name = $1', [tableNameParam]);
      if (res.rows.length > 0) {
        tableId = res.rows[0].id;
      }
    }

    if (!tableId) {
      return NextResponse.json({ error: 'table_id or table_name is required' }, { status: 400 });
    }

    const services = await getServicesByTableId(tableId);
    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table_id, service_name, method, description, require_auth, filters, update_rule } = body;

    const tableId = parseInt(table_id, 10);
    if (isNaN(tableId)) {
      return NextResponse.json({ error: 'Valid table_id is required' }, { status: 400 });
    }

    if (!service_name || typeof service_name !== 'string') {
      return NextResponse.json({ error: 'service_name is required' }, { status: 400 });
    }

    const created = await createService(tableId, {
      service_name: service_name.trim(),
      method: method || 'GET',
      description: description || '',
      require_auth: !!require_auth,
      filters: Array.isArray(filters) ? filters : [],
      update_rule: update_rule || {},
    });

    return NextResponse.json({ success: true, service: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    const serviceId = parseInt(idParam || '', 10);

    if (isNaN(serviceId)) {
      return NextResponse.json({ error: 'Valid service id is required' }, { status: 400 });
    }

    await deleteService(serviceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
