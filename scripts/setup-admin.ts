import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const name = process.env.ADMIN_NAME || process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('Usage: tsx scripts/setup-admin.ts <email> <password> [name]');
    console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name, role: 'OWNER', isActive: true },
    create: { email, passwordHash, name, role: 'OWNER', isActive: true },
  });

  console.log(`✓ Admin account ready: ${admin.email} (${admin.role})`);
  process.exit(0);
}

main().catch(console.error).finally(() => prisma.$disconnect());
