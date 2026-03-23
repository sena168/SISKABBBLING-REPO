const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

async function checkAfterFix() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const match = envContent.match(/NEON_DATABASE_URL=(.*)/);
    const databaseUrl = match ? match[1].trim() : null;
    
    if (!databaseUrl) {
      console.error('NEON_DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const sql = neon(databaseUrl);
    
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log(result.map(r => r.table_name).join(', '));
    
  } catch (err) {
    console.error('\n*** Setup failed ***:');
    console.error(err.message || err);
  }
}

checkAfterFix();
