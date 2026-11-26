import 'dotenv/config';

import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

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

// CLEANUP CONFIGURATION

const applyChanges = process.argv.includes('--apply');

const validArguments = process.argv
  .slice(2)
  .every((argument) => argument === '--apply');

const sessionHashPattern = '^[a-f0-9]{64}$';

interface CleanupCounts {
  expiredSessions: bigint;
  legacySessions: bigint;
  expiredRateLimits: bigint;
}

// ADMIN SECURITY CLEANUP

async function main() {

  if (!validArguments) {
    throw new Error('Unsupported cleanup argument.');
  }

  console.log('========================================');
  console.log('AERON ADMIN SECURITY CLEANUP');
  console.log('========================================');

  console.log(
    applyChanges
      ? 'Mode: APPLY CHANGES'
      : 'Mode: DRY RUN — no records will be deleted'
  );

  // DRY RUN: COUNT ELIGIBLE RECORDS

  if (!applyChanges) {

    const rows = await prisma.$queryRaw<CleanupCounts[]>`
      SELECT

        (
          SELECT COUNT(*)
          FROM "admin_sessions"
          WHERE "token" ~ ${sessionHashPattern}
          AND "expiresAt" <= (
            CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          )
        ) AS "expiredSessions",

        (
          SELECT COUNT(*)
          FROM "admin_sessions"
          WHERE "token" !~ ${sessionHashPattern}
        ) AS "legacySessions",

        (
          SELECT COUNT(*)
          FROM "admin_login_rate_limits"
          WHERE "expires_at" < (
            CURRENT_TIMESTAMP - INTERVAL '1 day'
          )
        ) AS "expiredRateLimits"
    `;

    const counts = rows[0];

    if (!counts) {
      throw new Error(
        'Unable to calculate cleanup records.'
      );
    }

    console.log(
      `Expired hashed sessions: ${counts.expiredSessions}`
    );

    console.log(
      `Legacy or malformed sessions: ${counts.legacySessions}`
    );

    console.log(
      `Expired rate-limit records: ${counts.expiredRateLimits}`
    );

    console.log('----------------------------------------');
    console.log('Dry run completed.');
    console.log('No database records were deleted.');
    console.log('Use --apply to execute cleanup.');

    return;
  }

  // ATOMIC DATABASE CLEANUP

  const result = await prisma.$transaction(
    async (tx) => {

      // DELETE LEGACY RAW TOKENS
      // AND MALFORMED SESSION HASHES

      const legacySessions = await tx.$executeRaw`
        DELETE FROM "admin_sessions"
        WHERE "token" !~ ${sessionHashPattern}
      `;

      // DELETE EXPIRED HASHED SESSIONS

      const expiredSessions = await tx.$executeRaw`
        DELETE FROM "admin_sessions"
        WHERE "token" ~ ${sessionHashPattern}
        AND "expiresAt" <= (
          CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        )
      `;

      // DELETE OLD RATE-LIMIT RECORDS
      // PRESERVE ALL CURRENT RATE LIMITS

      const expiredRateLimits = await tx.$executeRaw`
        DELETE FROM "admin_login_rate_limits"
        WHERE "expires_at" < (
          CURRENT_TIMESTAMP - INTERVAL '1 day'
        )
      `;

      return {
        legacySessions,
        expiredSessions,
        expiredRateLimits,
      };
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  // SAFE CLEANUP SUMMARY
  // NEVER PRINT SESSION TOKENS

  console.log(
    `Legacy sessions removed: ${result.legacySessions}`
  );

  console.log(
    `Expired sessions removed: ${result.expiredSessions}`
  );

  console.log(
    `Expired rate-limit records removed: ${result.expiredRateLimits}`
  );

  console.log('----------------------------------------');
  console.log('Security cleanup completed successfully.');
  console.log('Unexpired hashed session records preserved.');
  console.log('Current login rate limits preserved.');
}

// EXECUTE AND CLOSE DATABASE CONNECTION

main()
  .catch(() => {
    console.error(
      'Admin security cleanup failed. Check database connectivity and configuration.'
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });