import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Required check since we're using neon-http which requires the URL at module initialization
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
