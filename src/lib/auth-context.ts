import { NextRequest } from 'next/server';
import { getSetting } from '@/lib/db';
import { verifySessionToken } from '@/lib/crypto';

export interface AuthContext {
  isAuthenticated: boolean;
  isVendorKey: boolean;
  isAdminSession: boolean;
  userId: string | null;
  userEmail: string | null;
  metadata: Record<string, any>;
}

export async function resolveAuthContext(request: NextRequest): Promise<AuthContext> {
  const result: AuthContext = {
    isAuthenticated: false,
    isVendorKey: false,
    isAdminSession: false,
    userId: null,
    userEmail: null,
    metadata: {},
  };

  // 1. Check admin cookie session (Dashboard usage)
  const sessionCookie = request.cookies.get('zibaas_session');
  if (sessionCookie?.value === 'true') {
    result.isAuthenticated = true;
    result.isAdminSession = true;
    return result;
  }

  const apiKeyHeader = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const envKey = process.env.ZIBAAS_API_KEY;
  const providedBearer = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // 2. Check if x-api-key or Bearer matches vendor API key
  if (apiKeyHeader && envKey && apiKeyHeader === envKey) {
    result.isVendorKey = true;
    result.isAuthenticated = true;
  } else if (providedBearer && envKey && providedBearer === envKey) {
    result.isVendorKey = true;
    result.isAuthenticated = true;
    return result;
  }

  // 3. Check User Session JWT (Signed with auth_secret_key)
  if (providedBearer) {
    const authSecretKey = await getSetting('auth_secret_key');
    if (authSecretKey) {
      const decoded = verifySessionToken(providedBearer, authSecretKey);
      if (decoded && decoded.user_id) {
        result.isAuthenticated = true;
        result.userId = String(decoded.user_id);
        result.userEmail = decoded.email || null;
        result.metadata = decoded.metadata || {};
        return result;
      }
    }
  }

  // If vendor key matched and no valid user JWT was returned, return vendor context
  if (result.isVendorKey) {
    return result;
  }

  // If no envKey configured at all, treat as vendor access in development
  if (!envKey && !providedBearer && !apiKeyHeader) {
    result.isAuthenticated = true;
    result.isVendorKey = true;
    return result;
  }

  return result;
}
