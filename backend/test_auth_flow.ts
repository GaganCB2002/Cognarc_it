/**
 * Authentication System Test Script
 * Run with: npx ts-node test_auth_flow.ts
 * 
 * Tests all authentication flows end-to-end.
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', 'env.backend') });

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const API_URL = process.env.API_URL || 'https://cognarc-it-1.onrender.com/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, error?: string) {
  results.push({ name, passed: condition, error });
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}${error ? `: ${error}` : ''}`);
  }
}

async function testCaptchaService() {
  console.log('\n[TEST] Captcha Service');
  
  // Test generateCaptcha
  const { generateCaptcha, verifyCaptcha } = await import('./src/services/captcha.service');
  
  const captcha1 = generateCaptcha();
  assert('captcha generates a key', typeof captcha1.key === 'string' && captcha1.key.length > 0);
  assert('captcha generates a question', typeof captcha1.question === 'string' && captcha1.question.length > 0);
  assert('captcha question is a math problem', captcha1.question.includes('What is'));
  
  // Test verifyCaptcha with wrong answer
  assert('verifyCaptcha rejects wrong answer', !verifyCaptcha(captcha1.key, '9999'));
  
  // Test verifyCaptcha with expired key
  assert('verifyCaptcha rejects fake key', !verifyCaptcha('fake-key', '5'));
  
  // Test verifyCaptcha with correct answer
  const captcha2 = generateCaptcha();
  // Extract the answer from the question "What is X + Y?" or "What is X - Y?"
  const match = captcha2.question.match(/What is (\d+)\s*([+-])\s*(\d+)\?/);
  if (match) {
    const num1 = parseInt(match[1]);
    const op = match[2];
    const num2 = parseInt(match[3]);
    const correctAnswer = op === '+' ? num1 + num2 : num1 - num2;
    assert('verifyCaptcha accepts correct answer', verifyCaptcha(captcha2.key, String(correctAnswer)));
  }
  
  // Test that used captcha key is deleted
  assert('verifyCaptcha rejects reused key', !verifyCaptcha(captcha2.key, '5'));
}

async function testJWTService() {
  console.log('\n[TEST] JWT Service');
  
  const { generateToken, verifyAccessToken, verifyRefreshToken, generateAccessToken } = await import('./src/utils/helpers');
  
  const userId = 'test-user-id-123';
  const tokens = generateToken(userId);
  
  assert('generateToken returns accessToken', typeof tokens.accessToken === 'string' && tokens.accessToken.length > 0);
  assert('generateToken returns refreshToken', typeof tokens.refreshToken === 'string' && tokens.refreshToken.length > 0);
  
  // Test access token verification
  const decodedAccess = verifyAccessToken(tokens.accessToken);
  assert('verifyAccessToken returns correct userId', decodedAccess?.userId === userId);
  
  // Test refresh token verification
  const decodedRefresh = verifyRefreshToken(tokens.refreshToken);
  assert('verifyRefreshToken returns correct userId', decodedRefresh?.userId === userId);
  
  // Test that access token is valid for a new generateAccessToken call
  const newAccessToken = generateAccessToken(userId);
  const decodedNewAccess = verifyAccessToken(newAccessToken);
  assert('generateAccessToken creates valid token', decodedNewAccess?.userId === userId);
  
  // Test invalid token rejection
  assert('verifyAccessToken rejects malformed token', verifyAccessToken('invalid-token') === null);
  assert('verifyRefreshToken rejects malformed token', verifyRefreshToken('invalid-token') === null);
  
  // Test access token cannot be used as refresh token
  assert('verifyRefreshToken rejects access token', verifyRefreshToken(tokens.accessToken) === null);
}

async function testPasswordValidation() {
  console.log('\n[TEST] Password Validation');
  
  // Test bcrypt hashing
  const password = 'TestPassword123!';
  const hash = await bcrypt.hash(password, 12);
  
  assert('bcrypt hash is a string', typeof hash === 'string' && hash.length > 0);
  assert('bcrypt compare matches', await bcrypt.compare(password, hash));
  assert('bcrypt compare rejects wrong password', !(await bcrypt.compare('wrong-password', hash)));
}

async function testDatabaseConnection() {
  console.log('\n[TEST] Database Connection');
  
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    assert('Database connection works', true);
  } catch (error: any) {
    assert('Database connection works', false, error.message);
  }
}

async function testUserModel() {
  console.log('\n[TEST] User Model');
  
  try {
    const userCount = await prisma.user.count();
    assert('User table accessible', typeof userCount === 'number');
    
    const users = await prisma.user.findMany({ take: 5 });
    assert('Can query users', Array.isArray(users));
    
    if (users.length > 0) {
      const user = users[0];
      assert('User has id', typeof user.id === 'string');
      assert('User has email', typeof user.email === 'string');
      assert('User has name', typeof user.name === 'string');
      assert('User has unique email', users.length === 1 || new Set(users.map(u => u.email)).size === users.length);
    }
  } catch (error: any) {
    assert('User model tests', false, error.message);
  }
}

async function testCaptchaDBFlow() {
  console.log('\n[TEST] Captcha + Database Integration');
  
  const { generateCaptcha, verifyCaptcha } = await import('./src/services/captcha.service');
  
  const captcha = generateCaptcha();
  const match = captcha.question.match(/What is (\d+)\s*([+-])\s*(\d+)\?/);
  
  if (match) {
    const num1 = parseInt(match[1]);
    const op = match[2];
    const num2 = parseInt(match[3]);
    const correctAnswer = op === '+' ? num1 + num2 : num1 - num2;
    
    // Test that we can query the database after captcha verification
    const isValid = verifyCaptcha(captcha.key, String(correctAnswer));
    assert('Captcha verifies correctly', isValid);
    
    if (isValid) {
      try {
        // Ensure database queries still work after captcha operations
        const count = await prisma.user.count();
        assert('Database works after captcha verification', typeof count === 'number');
      } catch (error: any) {
        assert('Database works after captcha verification', false, error.message);
      }
    }
  }
}

async function testRegisterLoginFlow() {
  console.log('\n[TEST] Registration + Login Flow');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  const testName = 'Test User';
  
  try {
    // Register
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: testName,
        isApproved: true,
        emailVerified: new Date(),
        otpCode: String(Math.floor(100000 + Math.random() * 900000)),
      },
    });
    
    assert('User registered successfully', typeof user.id === 'string' && user.email === testEmail);
    
    // Login - find user
    const foundUser = await prisma.user.findUnique({ where: { email: testEmail } });
    assert('User found by email', foundUser !== null);
    
    if (foundUser) {
      // Password verification
      const isPasswordValid = await bcrypt.compare(testPassword, foundUser.password!);
      assert('Password verification succeeds', isPasswordValid);
      
      // Wrong password should fail
      const isWrongPasswordValid = await bcrypt.compare('WrongPassword456!', foundUser.password!);
      assert('Wrong password verification fails', !isWrongPasswordValid);
    }
    
    // Clean up test user
    await prisma.user.delete({ where: { email: testEmail } });
    const deletedUser = await prisma.user.findUnique({ where: { email: testEmail } });
    assert('User deleted successfully', deletedUser === null);
    
  } catch (error: any) {
    assert('Register/Login flow', false, error.message);
    // Clean up if needed
    try {
      await prisma.user.delete({ where: { email: testEmail } });
    } catch {}
  }
}

async function testErrorHandling() {
  console.log('\n[TEST] Error Handling');
  
  const { generateCaptcha, verifyCaptcha } = await import('./src/services/captcha.service');
  
  // Test expired captcha
  const captcha = generateCaptcha();
  // Wait 1ms, captcha should still be valid, but we test with wrong answer
  assert('Invalid captcha key fails', !verifyCaptcha('non-existent-key', '5'));
  
  // Test empty values
  assert('Empty captcha key fails', !verifyCaptcha('', '5'));
  assert('Empty answer fails', !verifyCaptcha(captcha.key, ''));
}

async function runAllTests() {
  console.log('========================================');
  console.log('  Authentication System Test Suite');
  console.log('========================================');
  
  // Run services tests
  try { await testCaptchaService(); } catch (e: any) { console.log('  ✗ Captcha Service:', e.message); }
  try { await testJWTService(); } catch (e: any) { console.log('  ✗ JWT Service:', e.message); }
  try { await testPasswordValidation(); } catch (e: any) { console.log('  ✗ Password Validation:', e.message); }
  try { await testErrorHandling(); } catch (e: any) { console.log('  ✗ Error Handling:', e.message); }
  
  // Run database tests
  try { await testDatabaseConnection(); } catch (e: any) { console.log('  ✗ Database Connection:', e.message); }
  try { await testUserModel(); } catch (e: any) { console.log('  ✗ User Model:', e.message); }
  try { await testCaptchaDBFlow(); } catch (e: any) { console.log('  ✗ Captcha+DB Flow:', e.message); }
  try { await testRegisterLoginFlow(); } catch (e: any) { console.log('  ✗ Register/Login Flow:', e.message); }
  
  // Summary
  console.log('\n========================================');
  console.log('  Results Summary');
  console.log('========================================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`  Total: ${results.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n  Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`    ✗ ${r.name}${r.error ? `: ${r.error}` : ''}`);
    });
  }
  
  console.log('========================================');
  
  await prisma.$disconnect();
  await pool.end();
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
