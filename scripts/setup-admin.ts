import 'dotenv/config';

import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

// DATABASE CONNECTION

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
});

// SAFE VALIDATION ERROR

class SetupError extends Error {}

// ADMIN ACCOUNT SETUP

async function main() {

  // REQUIRE EXPLICIT SETUP MODE

  const args = process.argv.slice(2);

  const mode = args[0];

  if (
    args.length !== 1 ||
    (
      mode !== '--create-owner' &&
      mode !== '--reset-owner'
    )
  ) {
    throw new SetupError(
      'Specify --create-owner or --reset-owner. Password arguments are not supported.'
    );
  }

  // READ CREDENTIALS FROM ENVIRONMENT ONLY

  const email = (
    process.env.ADMIN_EMAIL || ''
  )
    .trim()
    .toLowerCase();

  const password =
    process.env.ADMIN_PASSWORD || '';

  const name = (
    process.env.ADMIN_NAME || 'Admin'
  ).trim();

  // VALIDATE REQUIRED INPUT

  if (!email || !password || !name) {
    throw new SetupError(
      'ADMIN_EMAIL, ADMIN_PASSWORD and a valid admin name are required.'
    );
  }

  // VALIDATE EMAIL

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(email) ||
    email.length > 254
  ) {
    throw new SetupError(
      'Please provide a valid admin email address.'
    );
  }

  // VALIDATE PASSWORD LENGTH

  if (password.length < 15) {
    throw new SetupError(
      'Admin password must contain at least 15 characters.'
    );
  }

  // PREVENT BCRYPT PASSWORD TRUNCATION

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new SetupError(
      'Admin password must not exceed 72 UTF-8 bytes.'
    );
  }

  // VALIDATE ADMIN NAME

  if (name.length > 100) {
    throw new SetupError(
      'Admin name must not exceed 100 characters.'
    );
  }

  // HASH PASSWORD

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  // REMOVE PASSWORD FROM CURRENT PROCESS ENVIRONMENT

  delete process.env.ADMIN_PASSWORD;

  // ATOMIC OWNER ACCOUNT SETUP

  const result = await prisma.$transaction(
    async (tx) => {

      const existingUser = await tx.adminUser.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      // CREATE INITIAL OWNER ACCOUNT

      if (mode === '--create-owner') {

        if (existingUser) {
          throw new SetupError(
            'An account with this email already exists.'
          );
        }

        const ownerCount = await tx.adminUser.count({
          where: {
            role: 'OWNER',
          },
        });

        if (ownerCount > 0) {
          throw new SetupError(
            'An OWNER account already exists. Initial owner creation is disabled.'
          );
        }

        const user = await tx.adminUser.create({
          data: {
            email,
            passwordHash,
            name,
            role: 'OWNER',
            isActive: true,
          },

          select: {
            id: true,
            role: true,
          },
        });

        // RECORD OWNER ACCOUNT CREATION

        await tx.auditLog.create({
          data: {
            adminId: user.id,

            action: 'ADMIN_ACCOUNT_SETUP',

            entityType: 'AdminUser',

            entityId: user.id,

            details: {
              mode: 'OWNER_CREATED',
              role: user.role,
            },
          },
        });

        return {
          mode: 'OWNER_CREATED',
          sessionsRevoked: 0,
        };
      }

      // RESET EXISTING OWNER PASSWORD

      if (!existingUser) {
        throw new SetupError(
          'The specified OWNER account does not exist.'
        );
      }

      // PREVENT ACCIDENTAL PRIVILEGE ESCALATION

      if (existingUser.role !== 'OWNER') {
        throw new SetupError(
          'Password reset through this script is restricted to OWNER accounts.'
        );
      }

      // NEVER AUTOMATICALLY REACTIVATE DISABLED ACCOUNTS

      if (!existingUser.isActive) {
        throw new SetupError(
          'The OWNER account is inactive. Automatic reactivation is disabled.'
        );
      }

      // UPDATE PASSWORD ONLY

      const updated = await tx.adminUser.updateMany({
        where: {
          id: existingUser.id,
          role: 'OWNER',
          isActive: true,
        },

        data: {
          passwordHash,
        },
      });

      if (updated.count !== 1) {
        throw new SetupError(
          'Account status changed. Password reset cancelled.'
        );
      }

      // REVOKE ALL PREVIOUS SESSIONS

      const revokedSessions =
        await tx.adminSession.deleteMany({
          where: {
            userId: existingUser.id,
          },
        });

      // RECORD PASSWORD RESET

      await tx.auditLog.create({
        data: {
          adminId: existingUser.id,

          action: 'ADMIN_PASSWORD_CHANGED',

          entityType: 'AdminUser',

          entityId: existingUser.id,

          details: {
            mode: 'OWNER_PASSWORD_RESET',

            sessionsRevoked:
              revokedSessions.count,
          },
        },
      });

      return {
        mode: 'OWNER_PASSWORD_RESET',

        sessionsRevoked:
          revokedSessions.count,
      };
    },

    {
      isolationLevel: 'Serializable',
      maxWait: 10000,
      timeout: 30000,
    }
  );

  // SAFE SUCCESS OUTPUT

  console.log('========================================');
  console.log('AERON ADMIN ACCOUNT SECURITY');
  console.log('========================================');

  console.log(
    result.mode === 'OWNER_CREATED'
      ? 'Initial OWNER account created successfully.'
      : 'OWNER password reset successfully.'
  );

  console.log(
    `Previous sessions revoked: ${result.sessionsRevoked}`
  );

  console.log('Audit record saved successfully.');
}

// EXECUTE AND CLOSE DATABASE CONNECTION

main()
  .catch((error: unknown) => {

    delete process.env.ADMIN_PASSWORD;

    console.error(
      error instanceof SetupError
        ? error.message
        : 'Admin setup failed. Check database connectivity and configuration.'
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });