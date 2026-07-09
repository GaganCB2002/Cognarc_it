process.env.DATABASE_URL='postgresql://postgres:password@localhost:5432/studytrack?schema=public';
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'user@studytrack.dev' } });
  if (user) {
    console.log('User email:', user.email);
    console.log('User name:', user.name);
    console.log('User role:', user.role);
    console.log('User isApproved:', user.isApproved);
    console.log('User password hash:', user.password ? user.password.substring(0, 20) + '...' : 'null');
    if (user.password) {
      const match = await bcrypt.compare('password123', user.password);
      console.log('Password match:', match);
    }
  } else {
    console.log('User not found');
  }
  await prisma.$disconnect();
}
main().catch(e => {
  console.error('Error:', e.message, e.stack);
  process.exit(1);
});
