process.env.DATABASE_URL='postgresql://postgres:password@localhost:5432/studytrack?schema=public';
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
prisma.user.findUnique({ where: { email: 'user@studytrack.dev' } }).then(u => {
  console.log('User found:', u?.email, u?.name);
  prisma.$disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  console.error(e.stack);
  prisma.$disconnect();
});
