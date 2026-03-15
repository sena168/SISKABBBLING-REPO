export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { execute } from '@/lib/db';

// DELETE /api/users/[id]
// Deactivate a user (admin/leader only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

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

    // Step 3: Prevent self-deactivation
    if (currentUser.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot deactivate yourself' },
        { status: 400 }
      );
    }

    // Step 4: Deactivate user (soft delete)
    const sql = `
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_active = true
    `;

    const result = await execute(sql, [userId]);

    if (result.rows === 0) {
      return NextResponse.json(
        { error: 'User not found or already inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deactivated successfully',
      userId,
    });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
