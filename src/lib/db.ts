import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createDb(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    // Use Turso libSQL adapter for cloud deployment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client');

    const clientConfig: { url: string; authToken?: string } = { url: tursoUrl };
    if (process.env.TURSO_AUTH_TOKEN) {
      clientConfig.authToken = process.env.TURSO_AUTH_TOKEN;
    }

    const client = createClient(clientConfig);

    const adapter = new PrismaLibSQL(client);
    return new PrismaClient({ adapter });
  }

  // Local development: use SQLite file
  return new PrismaClient();
}

export const db =
  globalForPrisma.prisma ??
  createDb()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db