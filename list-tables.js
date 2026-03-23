const { neon } = require('@neondatabase/serverless');

async function test() {
  try {
    const databaseUrl = process.env.NEON_DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('NEON_DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const sql = neon(databaseUrl);
    
    console.log('Checking tables...');
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log('Tables found:', result.map(R => R.table_name));
    
  } catch (err) {
    console.error('Connection failed with error:');
    console.error(err);
  }
}

test();
