const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

async function setupDatabase() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const match = envContent.match(/NEON_DATABASE_URL=(.*)/);
    const databaseUrl = match ? match[1].trim() : null;
    
    if (!databaseUrl) {
      console.error('NEON_DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const sql = neon(databaseUrl);
    console.log('Connected to database. Creating tables...');

    // 1. Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        firebase_uid VARCHAR(255) UNIQUE,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        is_active BOOLEAN DEFAULT true,
        wa_phone VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Created users table');

    // 2. Chat Events (Patrol Logs)
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255),
        body TEXT,
        media_url TEXT,
        media_type VARCHAR(50),
        timestamp_wa TIMESTAMP WITH TIME ZONE NOT NULL,
        is_deleted BOOLEAN DEFAULT false,
        is_edited BOOLEAN DEFAULT false,
        edit_of_id UUID REFERENCES events(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Created events table');

    // 3. Event History (For edits/deletes)
    await sql`
      CREATE TABLE IF NOT EXISTS event_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        changed_by VARCHAR(255),
        change_type VARCHAR(50) NOT NULL,
        old_body TEXT,
        old_media_url TEXT,
        timestamp_log TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Created event_history table');

    // 4. Health Logs
    await sql`
      CREATE TABLE IF NOT EXISTS health_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        service VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        ts TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Created health_log table');

    // 5. Audit Logs
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        ts TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Created audit_logs table');

    console.log('\nDatabase setup complete! You can now log into the frontend.');
    
  } catch (err) {
    console.error('\n*** Setup failed ***:');
    console.error(err.message || err);
  }
}

setupDatabase();
