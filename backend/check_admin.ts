import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkAndResetAdmin() {
  const email = 'admin@studytrack.dev';
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    console.log("Admin exists, resetting password to password123");
    const hashedPassword = await bcrypt.hash('password123', 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: 'ADMIN', isApproved: true }
    });
    console.log("Password reset successfully.");
  } else {
    console.log("Admin does not exist, creating it...");
    const hashedPassword = await bcrypt.hash('password123', 12);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        isApproved: true,
        emailVerified: new Date(),
      }
    });
    console.log("Admin created with password password123");
  }
}

checkAndResetAdmin().catch(console.error).finally(() => prisma.$disconnect());
