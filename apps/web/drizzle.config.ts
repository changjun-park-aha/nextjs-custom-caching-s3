import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schemas/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});