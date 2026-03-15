import {
  initializeApp,
  cert,
  getApps,
  ServiceAccount,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Get environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Validate that required env vars are present
if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    'Missing Firebase Admin SDK environment variables. Please check your .env.local file.'
  );
}

// Convert the private key string: replace literal \n with actual newlines
// This handles both cases: when pasted with \n escape sequences or actual newlines
const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

// Create service account credential object
const serviceAccount: ServiceAccount = {
  projectId,
  clientEmail,
  privateKey: formattedPrivateKey,
};

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// Get auth instance
const auth = getAuth();

// Verify Firebase ID token from Authorization header
export async function verifyToken(
  authHeader: string | null | undefined
): Promise<{ uid: string; email: string } | null> {
  if (!authHeader) {
    return null;
  }

  // Extract token from "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}
