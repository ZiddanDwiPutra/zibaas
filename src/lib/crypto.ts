import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Ensures key is 32 bytes (for AES-256)
 */
function getDerivedKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Decrypts encrypted payload from client.
 * Expects { payload: base64, iv: base64, tag: base64 } or { payload: base64, iv: base64 } with concatenated tag.
 * Web Crypto API AES-GCM appends the 16-byte authentication tag directly to ciphertext.
 */
export function decryptClientPayload(
  encryptedData: { payload: string; iv: string; tag?: string },
  secretKey: string
): any {
  const key = getDerivedKey(secretKey);
  const ivBuffer = Buffer.from(encryptedData.iv, 'base64');
  const payloadBuffer = Buffer.from(encryptedData.payload, 'base64');

  let ciphertextBuffer: Buffer;
  let tagBuffer: Buffer;

  if (encryptedData.tag) {
    tagBuffer = Buffer.from(encryptedData.tag, 'base64');
    ciphertextBuffer = payloadBuffer;
  } else {
    // If tag is appended (standard WebCrypto ciphertext output format)
    if (payloadBuffer.length < 16) {
      throw new Error('Invalid ciphertext length');
    }
    ciphertextBuffer = payloadBuffer.subarray(0, payloadBuffer.length - 16);
    tagBuffer = payloadBuffer.subarray(payloadBuffer.length - 16);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(tagBuffer);

  let decrypted = decipher.update(ciphertextBuffer, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Server-side helper to encrypt payload (e.g. for testing or server-to-server)
 */
export function encryptServerPayload(data: object, secretKey: string) {
  const key = getDerivedKey(secretKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');

  return {
    payload: encrypted,
    iv: iv.toString('base64'),
    tag,
  };
}

/**
 * Signs a simple HMAC-SHA256 JWT-like session token for ZiBaaS
 */
export function signSessionToken(payload: object, secretKey: string, expiresInSeconds: number = 86400 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies a ZiBaaS session token and returns the decoded payload
 */
export function verifySessionToken(token: string, secretKey: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
