import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", "..", "env.backend"), override: false });

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const hashedPassword = await bcrypt.hash("password123", 10);

    const admin = await prisma.user.upsert({
      where: { email: "admin@studytrack.dev" },
      update: {
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
        isApproved: true,
      },
      create: {
        email: "admin@studytrack.dev",
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
        isApproved: true,
      },
    });

    await prisma.profile.upsert({
      where: { userId: admin.id },
      update: {
        bio: "Platform administrator",
        targetRole: "Admin",
      },
      create: {
        userId: admin.id,
        bio: "Platform administrator",
        targetRole: "Admin",
      },
    });

    const testUser = await prisma.user.upsert({
      where: { email: "user@studytrack.dev" },
      update: {
        name: "Test User",
        password: hashedPassword,
        role: "STUDENT",
        isApproved: true,
      },
      create: {
        email: "user@studytrack.dev",
        name: "Test User",
        password: hashedPassword,
        role: "STUDENT",
        isApproved: true,
      },
    });

    await prisma.profile.upsert({
      where: { userId: testUser.id },
      update: {
        bio: "Test student account",
        targetRole: "Software Engineer",
        weeklyHours: 20,
      },
      create: {
        userId: testUser.id,
        bio: "Test student account",
        targetRole: "Software Engineer",
        weeklyHours: 20,
      },
    });

    console.log("Seed completed successfully.");
    console.log(`  Admin: admin@studytrack.dev`);
    console.log(`  User:  user@studytrack.dev`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
