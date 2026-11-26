import 'dotenv/config';

import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

// ==========================================
// DATABASE CONNECTION
// ==========================================

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is missing from environment variables.'
  );
}

const adapter = new PrismaNeon({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

// ==========================================
// ADMIN ACCOUNT SETUP
// ==========================================

async function main() {
  const email = (
    process.env.ADMIN_EMAIL ||
    process.argv[2] ||
    ''
  )
    .trim()
    .toLowerCase();

  const password =
    process.env.ADMIN_PASSWORD ||
    process.argv[3] ||
    '';

  const name = (
    process.env.ADMIN_NAME ||
    process.argv[4] ||
    'Admin'
  ).trim();

  // VALIDATE REQUIRED INPUT

  if (!email || !password || !name) {
    throw new Error(
      'ADMIN_EMAIL, ADMIN_PASSWORD and admin name are required.'
    );
  }

  // VALIDATE EMAIL

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || email.length > 254) {
    throw new Error('Please provide a valid admin email address.');
  }

  // VALIDATE PASSWORD LENGTH

  if (password.length < 15) {
    throw new Error(
      'Admin password must contain at least 15 characters.'
    );
  }

  // PREVENT BCRYPT PASSWORD TRUNCATION

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error(
      'Admin password must not exceed 72 UTF-8 bytes.'
    );
  }

  // VALIDATE ADMIN NAME

  if (name.length > 100) {
    throw new Error(
      'Admin name must not exceed 100 characters.'
    );
  }

  // HASH PASSWORD

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  // CREATE OR UPDATE OWNER ACCOUNT
  // REVOKE PREVIOUS SESSIONS AT THE SAME TIME

  const admin = await prisma.$transaction(
    async (tx) => {
      const user = await tx.adminUser.upsert({
        where: {
          email,
        },

        update: {
          passwordHash,
          name,
          role: 'OWNER',
          isActive: true,
        },

        create: {
          email,
          passwordHash,
          name,
          role: 'OWNER',
          isActive: true,
        },

        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      // INVALIDATE ALL EXISTING ADMIN SESSIONS

      await tx.adminSession.deleteMany({
        where: {
          userId: user.id,
        },
      });

      // RECORD ADMIN SETUP IN AUDIT LOG

      await tx.auditLog.create({
        data: {
          adminId: user.id,
          action: 'ADMIN_ACCOUNT_SETUP',
          entityType: 'AdminUser',
          entityId: user.id,
          details: {
            role: user.role,
            sessionsRevoked: true,
          },
        },
      });

      return user;
    }
  );

  console.log('Admin account configured successfully.');
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
  console.log('Previous sessions revoked.');
}

// ==========================================
// EXECUTE AND CLOSE DATABASE CONNECTION
// ==========================================

main()
  .catch((error: unknown) => {
    console.error(
      'Admin setup failed:',
      error instanceof Error
        ? error.message
        : 'Unexpected error'
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });