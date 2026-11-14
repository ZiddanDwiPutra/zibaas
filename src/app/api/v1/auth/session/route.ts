import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import { decryptClientPayload, signSessionToken } from '@/lib/crypto';

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

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = await getCorsHeaders(request);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = await getCorsHeaders(request);

  try {
    const authKey = await getSetting('auth_secret_key');
    if (!authKey) {
      return NextResponse.json(
        { error: 'Client Auth Key has not been configured in ZiBaaS Settings.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { payload, iv, tag } = body;

    if (!payload || !iv) {
      return NextResponse.json(
        { error: 'Invalid request. Missing encrypted payload or iv.' },
        { status: 400, headers: corsHeaders }
      );
    }

    let decrypted: any;
    try {
      decrypted = decryptClientPayload({ payload, iv, tag }, authKey);
    } catch {
      return NextResponse.json(
        { error: 'Decryption failed. Invalid key, corrupted payload, or authentication tag mismatch.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Anti-replay check: ensure timestamp is within 5 minutes
    if (decrypted.timestamp) {
      const now = Date.now();
      const diff = Math.abs(now - Number(decrypted.timestamp));
      if (diff > 5 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Request expired. Anti-replay verification failed.' },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    if (!decrypted.user_id) {
      return NextResponse.json(
        { error: 'Decrypted payload must contain user_id.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate ZiBaaS session token containing user_id and metadata
    const token = signSessionToken(
      {
        user_id: decrypted.user_id,
        email: decrypted.email || null,
        metadata: decrypted.metadata || {},
      },
      authKey,
      7 * 24 * 3600 // 7 days expiration
    );

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          user_id: decrypted.user_id,
          email: decrypted.email || null,
          metadata: decrypted.metadata || {},
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
