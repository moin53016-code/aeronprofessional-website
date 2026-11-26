import 'server-only';

import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// GLOBAL PRISMA INSTANCE

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// CREATE DATABASE CLIENT

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is missing. Please configure your environment variables.'
    );
  }

  // NEON POSTGRESQL DRIVER ADAPTER

  const adapter = new PrismaNeon({
    connectionString,
  });

  // INITIALIZE PRISMA CLIENT

  return new PrismaClient({
    adapter,

    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
}

// REUSE EXISTING PRISMA CLIENT

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// PREVENT DUPLICATE CLIENTS DURING DEVELOPMENT

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// DEFAULT EXPORT

export default prisma;