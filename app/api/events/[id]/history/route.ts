import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { EventHistory } from '@/lib/types';

// GET /api/events/[id]/history
// Returns edit/delete history for a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Step 1: Authenticate user
    const authHeader = request.headers.get('Authorization');
    const user = await getAuthUser(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Check role permissions (admin, leader, member only)
    if (!requireRole(user, 'admin', 'leader', 'member')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    // Step 3: Query history
    // Assuming events table has edit_of_id and delete_of_id columns
    const sql = `
      SELECT 
        id,
        event_id,
        changed_by,
        change_type,
        old_body,
        old_media_url,
        timestamp_log
      FROM events
      WHERE edit_of_id = $1 OR delete_of_id = $1
      ORDER BY timestamp_log ASC
    `;

    const history = (await query(sql, [eventId])) as EventHistory[];

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Event history GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
