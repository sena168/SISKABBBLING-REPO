import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { HealthLog } from '@/lib/types';

// GET /api/health
// Returns latest health status of services (all roles allowed)
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user (optional - allow unauthenticated for basic health check?)
    // According to spec: all roles allowed, but still should be authenticated
    const authHeader = request.headers.get('Authorization');
    const user = await getAuthUser(authHeader);

    // If no auth, we could either return 401 or allow it. Let's require auth for consistency.
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Query latest health logs
    const sql = `
      SELECT service, status, ts
      FROM health_log
      ORDER BY ts DESC
      LIMIT 10
    `;

    const healthLogs = (await query(sql, [])) as HealthLog[];

    // Optionally, group by service to get latest status per service
    const latestByService: Record<string, HealthLog> = {};
    for (const log of healthLogs) {
      const service = log.service;
      if (
        !latestByService[service] ||
        new Date(log.ts) > new Date(latestByService[service].ts)
      ) {
        latestByService[service] = log;
      }
    }

    return NextResponse.json({
      health: Object.values(latestByService),
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
