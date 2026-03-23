const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

async function fixSchema() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const match = envContent.match(/NEON_DATABASE_URL=(.*)/);
    const databaseUrl = match ? match[1].trim() : null;
    
    if (!databaseUrl) {
      console.error('NEON_DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const sql = neon(databaseUrl);
    console.log('Connected to database. Fixing schema...');

    // 1. Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         TEXT UNIQUE NOT NULL,
        display_name  TEXT,
        firebase_uid  TEXT UNIQUE,
        role          TEXT NOT NULL CHECK (role IN ('admin','leader','member','stakeholder')),
        wa_phone      TEXT,
        created_at    TIMESTAMPTZ DEFAULT now(),
        updated_at    TIMESTAMPTZ DEFAULT now(),
        created_by    UUID,
        is_active     BOOLEAN DEFAULT TRUE
      );
    `;
    console.log('✅ Created users table');

    // 2. Create audit_log table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id),
        action     TEXT NOT NULL,
        detail     JSONB,
        ip_address TEXT,
        ts         TIMESTAMPTZ DEFAULT now()
      );
    `;
    console.log('✅ Created audit_log table');

    // 3. Add missing columns to events table
    await sql`
      ALTER TABLE events 
        ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_edited    BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS edit_of_id   UUID,
        ADD COLUMN IF NOT EXISTS delete_of_id UUID;
    `;
    console.log('✅ Added missing columns to events table');

    // 4. Create stakeholder_events view
    await sql`
      CREATE OR REPLACE VIEW stakeholder_events AS
        SELECT 
          id, sender_name, body, media_url, media_type, 
          timestamp_wa, timestamp_log
        FROM events
        WHERE event_type = 'message'
          AND is_deleted = FALSE
          AND id NOT IN (
            SELECT COALESCE(edit_of_id, delete_of_id)
            FROM events 
            WHERE edit_of_id IS NOT NULL 
               OR delete_of_id IS NOT NULL
          );
    `;
    console.log('✅ Created stakeholder_events view');

    // 5. Verify
    console.log('\nVerifying tables:');
    const result = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.table(result);

    console.log('\nSchema fix complete! You can now run the bootstrap insert for the admin user.');
    
  } catch (err) {
    console.error('\n*** Setup failed ***:');
    console.error(err.message || err);
  }
}

fixSchema();
