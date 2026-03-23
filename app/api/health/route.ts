export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/health
// Returns latest health status of services (all roles allowed)
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const authHeader = request.headers.get('Authorization');
    const user = await getAuthUser(authHeader);

    // If no auth, return 401
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Query latest health log row for WAHA
    const sql = `
      SELECT service, status, latency_ms, note, checked_at
      FROM health_log
      WHERE service = 'waha'
      ORDER BY checked_at DESC
      LIMIT 1
    `;

    const healthLogs = (await query(sql, [])) as {
      service: string;
      status: string;
      latency_ms: number;
      note: string;
      checked_at: Date;
    }[];

    // Handle case where no rows exist
    if (healthLogs.length === 0) {
      return NextResponse.json({
        status: 'ok' as const,
        lastChecked: null,
        message: 'System operational',
      });
    }

    const latestLog = healthLogs[0];
    const status = latestLog.status as 'ok' | 'down';

    return NextResponse.json({
      status,
      lastChecked: latestLog.checked_at,
      message:
        status === 'ok'
          ? 'System operational'
          : 'WAHA offline — patrol logging may be affected',
    });
  } catch (error) {
    console.error('Health GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
