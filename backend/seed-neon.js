const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function seed() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL not set in environment');
      process.exit(1);
    }
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to database');
    
    const tables = [
      'User', 'Profile', 'LearningStreak', 'StudySession', 'Task', 'Note', 
      'Collection', 'Resource', 'Notification', 'ActivityLog', 'BrowserTelemetry', 
      'DesktopTelemetry', 'Document'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;`);
      } catch (e) {}
    }

    let sql = fs.readFileSync('../database/seed.sql', 'utf8');
    
    sql = sql.replace(/\(([^)]+)\)\s*VALUES/gi, (match, columns) => {
      const quoted = columns.split(',').map(c => `"${c.trim()}"`).join(', ');
      return `(${quoted}) VALUES`;
    });

    await client.query(sql);
    console.log('Seed successful');
    await client.end();
  } catch (err) {
    console.error('Seed error:', err);
  }
}
seed();
