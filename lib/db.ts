import { neon } from '@neondatabase/serverless';

// Initialize Neon connection using the connection string from environment
const databaseUrl = process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('NEON_DATABASE_URL environment variable is required');
}

// Create a neon client - it automatically handles connection pooling
const sql = neon(databaseUrl);

// Helper function to execute queries and return results
export async function query(
  sqlText: string,
  params?: readonly unknown[]
): Promise<unknown[]> {
  try {
    const result = await sql(sqlText, params as any);
    return result as unknown[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to execute a query and return a single row
export async function queryOne(
  sqlText: string,
  params?: readonly unknown[]
): Promise<unknown | null> {
  try {
    const result = await sql(sqlText, params as any);
    return (result[0] as unknown) || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to execute INSERT/UPDATE/DELETE and return affected row count
export async function execute(
  sqlText: string,
  params?: readonly unknown[]
): Promise<{ rows: number }> {
  try {
    const result = (await sql(sqlText, params as any)) as any[];
    // For INSERT/UPDATE/DELETE, neon returns an array with a command like "UPDATE 1"
    // We need to parse the row count from the command result
    if (result.length > 0 && typeof result[0] === 'string') {
      const match = String(result[0]).match(/(\d+)/);
      if (match) {
        return { rows: parseInt(match[1], 10) };
      }
    }
    return { rows: 0 };
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}

export { sql };
