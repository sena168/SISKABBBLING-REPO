import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { execute } from '@/lib/db';

// POST /api/admin/backup
// Triggers backup workflow via n8n webhook (admin only)
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const authHeader = request.headers.get('Authorization');
    const user = await getAuthUser(authHeader);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Check role permissions (admin only)
    if (!requireRole(user, 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    // Step 3: Get n8n webhook URL from environment
    const webhookUrl = process.env.N8N_BACKUP_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Backup webhook not configured' },
        { status: 503 }
      );
    }

    // Step 4: Trigger n8n webhook
    // We'll use fetch to call the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        triggered_by: user.email,
        triggered_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(
        'n8n webhook failed:',
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: 'Backup trigger failed', details: response.statusText },
        { status: 500 }
      );
    }

    // Step 5: Log the backup trigger in audit_log
    await execute(
      `INSERT INTO audit_log (user_id, action, details, ts) VALUES ($1, $2, $3, NOW())`,
      [user.userId, 'backup', 'Manual backup triggered via admin API']
    );

    return NextResponse.json({
      message: 'Backup triggered successfully',
      webhook_response: response.status,
    });
  } catch (error) {
    console.error('Admin backup POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
