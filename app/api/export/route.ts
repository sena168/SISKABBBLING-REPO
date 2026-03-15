export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/export
// Exports events in JSON or CSV format (admin/leader only)
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

    // Step 3: Parse query parameters
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const from = url.searchParams.get('from') || null;
    const to = url.searchParams.get('to') || null;

    // Step 4: Build query with filters
    const params: any[] = [];
    let sql = 'SELECT * FROM events WHERE 1=1';

    if (from) {
      sql += ` AND timestamp_wa >= $${params.length + 1}`;
      params.push(from);
    }
    if (to) {
      sql += ` AND timestamp_wa <= $${params.length + 1}`;
      params.push(to);
    }

    sql += ' ORDER BY timestamp_wa DESC';

    // Step 5: Execute query
    const events = await query(sql, params);

    // Step 6: Format response based on requested format
    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'id',
        'event_type',
        'sender_name',
        'body',
        'media_url',
        'media_type',
        'timestamp_wa',
        'is_deleted',
        'is_edited',
        'edit_of_id',
      ];
      const csvRows: string[] = [];
      csvRows.push(headers.join(','));

      for (const event of events as any[]) {
        const row = headers.map((header) => {
          const value = event[header as keyof typeof event] ?? '';
          // Escape quotes and wrap in quotes if contains comma or quote
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="events-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Default to JSON
      return NextResponse.json(
        {
          events,
          exported_at: new Date().toISOString(),
          count: events.length,
        },
        {
          status: 200,
          headers: {
            'Content-Disposition': `attachment; filename="events-export-${new Date().toISOString().split('T')[0]}.json"`,
          },
        }
      );
    }
  } catch (error) {
    console.error('Export GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
