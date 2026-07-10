import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';

export async function GET() {
  try {
    const corsAllowAll = await getSetting('cors_allow_all');
    const corsWhitelist = await getSetting('cors_whitelist');
    return NextResponse.json({
      cors_allow_all: corsAllowAll === 'true',
      cors_whitelist: corsWhitelist,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cors_allow_all, cors_whitelist } = body;

    await setSetting('cors_allow_all', cors_allow_all ? 'true' : 'false');
    await setSetting('cors_whitelist', cors_whitelist || '');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
