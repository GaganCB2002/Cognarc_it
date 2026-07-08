require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'test@test.com' } });
    if (user) {
      console.log('User found:', user.email, '| isApproved:', user.isApproved, '| role:', user.role);
    } else {
      console.log('User not found - creating test user...');
      try {
        const newUser = await prisma.user.create({
          data: { email: 'test@test.com', password: '$2a$12$test', name: 'Test User' }
        });
        console.log('Created:', newUser.id);
      } catch (createErr) {
        console.error('Create error:', createErr.message);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
