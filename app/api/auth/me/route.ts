export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/firebase-admin';
import { queryOne, execute } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const tokenData = await verifyToken(authHeader);

    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up user
    let userRow: any = await queryOne(
      'SELECT id, role, is_active FROM users WHERE firebase_uid = $1',
      [tokenData.uid]
    );

    // Bootstrap first admin automatically if it's the target email
    if (!userRow && tokenData.email === 'senaprasena@gmail.com') {
      const existingEmail: any = await queryOne(
        'SELECT id FROM users WHERE email = $1',
        [tokenData.email]
      );

      if (existingEmail) {
        // Update existing record with the Firebase UID
        await execute(
          'UPDATE users SET firebase_uid = $1, role = $2, is_active = $3 WHERE email = $4',
          [tokenData.uid, 'admin', true, tokenData.email]
        );
      } else {
        // Create brand new admin record
        await execute(
          'INSERT INTO users (email, display_name, role, is_active, firebase_uid) VALUES ($1, $2, $3, $4, $5)',
          [tokenData.email, 'Sena Prasena (Admin)', 'admin', true, tokenData.uid]
        );
      }

      // Refetch
      userRow = await queryOne(
        'SELECT id, role, is_active FROM users WHERE firebase_uid = $1',
        [tokenData.uid]
      );
    }

    if (!userRow) {
      // User authenticated in Firebase but not in our system
      // We return role 'pending' to trigger the pending flow on the frontend
      return NextResponse.json({ role: 'pending', email: tokenData.email, displayName: '' });
    }

    if (!userRow.is_active) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
    }

    return NextResponse.json({
      role: userRow.role,
      email: tokenData.email,
      displayName: userRow.display_name || '',
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
