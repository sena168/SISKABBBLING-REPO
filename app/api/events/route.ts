import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { ChatEvent } from '@/lib/types';

// GET /api/events
// Returns paginated list of events with optional filters
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const authHeader = request.headers.get('Authorization');
    const user = await getAuthUser(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const from = url.searchParams.get('from') || null;
    const to = url.searchParams.get('to') || null;
    const type = url.searchParams.get('type') || null;
    const sender = url.searchParams.get('sender') || null;

    const offset = (page - 1) * limit;

    // Step 3: Build query based on role
    let sql: string;
    let params: any[] = [];

    if (user.role === 'stakeholder') {
      // Stakeholders only see final messages (no edits/deletes)
      // Assuming there's a view called stakeholder_events that already filters
      sql = `
        SELECT * FROM stakeholder_events
        WHERE 1=1
      `;
    } else {
      // Admin, leader, member see all events including edits/deletes
      sql = `
        SELECT * FROM events
        WHERE 1=1
      `;
    }

    // Apply filters
    if (from) {
      sql += ` AND timestamp_wa >= $${params.length + 1}`;
      params.push(from);
    }
    if (to) {
      sql += ` AND timestamp_wa <= $${params.length + 1}`;
      params.push(to);
    }
    if (type) {
      sql += ` AND event_type = $${params.length + 1}`;
      params.push(type);
    }
    if (sender) {
      sql += ` AND sender_name ILIKE $${params.length + 1}`;
      params.push(`%${sender}%`);
    }

    // Add ordering and pagination
    sql += ` ORDER BY timestamp_wa DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    // Step 4: Execute query
    const events = (await query(sql, params)) as ChatEvent[];

    // Step 5: Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total FROM (
        ${sql.split('ORDER BY')[0]}
      ) as count_query
    `;
    const countResult = await queryOne(countSql, params.slice(0, -2));
    const total = (countResult as any)?.total || 0;

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Events GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
