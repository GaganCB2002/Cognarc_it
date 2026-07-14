import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: '../env.backend' });
const prisma = new PrismaClient();
prisma.$queryRawUnsafe('SELECT 1').then(console.log).catch(console.error).finally(() => prisma.$disconnect());
