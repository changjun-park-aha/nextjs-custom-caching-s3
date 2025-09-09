import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schemas';

// Create the connection
const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });

// Connection helper
export async function closeConnection() {
  await queryClient.end();
}