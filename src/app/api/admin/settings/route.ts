import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';

export async function GET() {
  try {
    const corsAllowAll = await getSetting('cors_allow_all');
    const corsWhitelist = await getSetting('cors_whitelist');
    const authSecretKey = await getSetting('auth_secret_key');
    return NextResponse.json({
      cors_allow_all: corsAllowAll === 'true',
      cors_whitelist: corsWhitelist,
      auth_secret_key: authSecretKey || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cors_allow_all, cors_whitelist, auth_secret_key } = body;

    if (cors_allow_all !== undefined) {
      await setSetting('cors_allow_all', cors_allow_all ? 'true' : 'false');
    }
    if (cors_whitelist !== undefined) {
      await setSetting('cors_whitelist', cors_whitelist || '');
    }
    if (auth_secret_key !== undefined) {
      await setSetting('auth_secret_key', auth_secret_key.trim());
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
