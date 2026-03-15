import { verifyToken } from './firebase-admin';
import { queryOne } from './db';
import { AuthUser, Role } from './types';

// Get the user's auth information from Firebase token and database
export async function getAuthUser(
  authHeader: string | null | undefined
): Promise<AuthUser | null> {
  // Step 1: Verify Firebase token
  const tokenData = await verifyToken(authHeader);
  if (!tokenData) {
    return null;
  }

  // Step 2: Look up user in database by firebase_uid
  const userRow = await queryOne(
    'SELECT id, role, is_active FROM users WHERE firebase_uid = $1',
    [tokenData.uid]
  );

  if (!userRow) {
    return null;
  }

  // Check if user is active
  if (!(userRow as any).is_active) {
    return null;
  }

  // Step 3: Build AuthUser object
  const user = userRow as any;
  return {
    uid: tokenData.uid,
    email: tokenData.email,
    displayName: null, // We could fetch this from users table if needed
    role: user.role as Role,
    userId: user.id,
  };
}

// Check if user has one of the required roles
export function requireRole(
  user: AuthUser | null,
  ...allowedRoles: Role[]
): boolean {
  if (!user) {
    return false;
  }
  return allowedRoles.includes(user.role);
}

// Create an HTTP response for unauthorized access
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Create an HTTP response for forbidden access
export function forbiddenResponse(message: string = 'Forbidden'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
