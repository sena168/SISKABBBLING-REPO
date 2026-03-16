const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

async function test() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const match = envContent.match(/NEON_DATABASE_URL=(.*)/);
    const databaseUrl = match ? match[1].trim() : null;
    
    console.log('Testing connection to:', databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':***@') : 'undefined');
    
    if (!databaseUrl) {
      console.error('NEON_DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const sql = neon(databaseUrl);
    
    console.log('Attempting simple query...');
    const result = await sql`SELECT NOW()`;
    console.log('Success! Connected at:', result[0].now);
    
  } catch (err) {
    console.error('\n*** Connection failed with error ***:');
    console.error(err.message || err);
  }
}

test();
