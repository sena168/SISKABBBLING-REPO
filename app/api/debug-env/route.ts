export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.NEON_DATABASE_URL || '';
  
  // Safely mask the password and return the structure of the connection string
  // postgresql://user:password@host/database
  let safeUrl = 'Not set';
  let hasSpaces = false;
  let hasQuotes = false;
  let hasNewlines = false;
  
  if (dbUrl) {
    hasSpaces = dbUrl.includes(' ');
    hasQuotes = dbUrl.includes('"') || dbUrl.includes("'");
    hasNewlines = dbUrl.includes('\n') || dbUrl.includes('\r');
    
    try {
      // Try to parse it to see what the driver sees
      const url = new URL(dbUrl);
      safeUrl = `${url.protocol}//${url.username}:***@${url.host}${url.pathname}${url.search}`;
    } catch (e) {
      safeUrl = `Invalid URL format. Starts with: ${dbUrl.substring(0, 15)}... Ends with: ...${dbUrl.substring(dbUrl.length - 15)}`;
    }
  }

  return NextResponse.json({
    neonUrlConfigured: !!dbUrl,
    safeUrlStructure: safeUrl,
    length: dbUrl.length,
    containsSpaces: hasSpaces,
    containsQuotes: hasQuotes,
    containsNewlines: hasNewlines,
    firebaseKeyConfigured: !!process.env.FIREBASE_PRIVATE_KEY,
    firebaseKeyLength: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
    firebaseKeyHasQuotes: process.env.FIREBASE_PRIVATE_KEY ? (process.env.FIREBASE_PRIVATE_KEY.startsWith('"') || process.env.FIREBASE_PRIVATE_KEY.endsWith('"')) : false
  });
}
