import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function test() {
  try {
    const databaseUrl = process.env.NEON_DATABASE_URL;
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
    console.error('Connection failed with error:');
    console.error(err);
  }
}

test();
