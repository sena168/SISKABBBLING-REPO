import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { User } from '@/lib/types';

// GET /api/users
// List all users (admin/leader only)
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const authHeader = request.headers.get('Authorization');
    const user = await getAuthUser(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Check role permissions (admin, leader only)
    if (!requireRole(user, 'admin', 'leader')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    // Step 3: Query all users
    const sql = `
      SELECT 
        id, email, display_name, firebase_uid, role, 
        is_active, wa_phone, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    const users = (await query(sql, [])) as User[];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users
// Create a new user (admin/leader only)
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const authHeader = request.headers.get('Authorization');
    const currentUser = await getAuthUser(authHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Check role permissions (admin, leader only)
    if (!requireRole(currentUser, 'admin', 'leader')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    // Step 3: Parse request body
    const body = await request.json();
    const { email, displayName, role, waPhone } = body as {
      email: string;
      displayName?: string;
      role: 'admin' | 'leader' | 'member' | 'stakeholder';
      waPhone?: string;
    };

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role' },
        { status: 400 }
      );
    }

    // Step 4: Insert new user
    // Note: firebase_uid will be set later when the user first logs in with Firebase
    const sql = `
      INSERT INTO users (email, display_name, role, wa_phone, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING id, email, display_name, firebase_uid, role, is_active, wa_phone, created_at, updated_at
    `;

    const result = await query(sql, [
      email,
      displayName || null,
      role,
      waPhone || null,
    ]);
    const newUser = result[0] as User;

    return NextResponse.json(
      { user: newUser, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
