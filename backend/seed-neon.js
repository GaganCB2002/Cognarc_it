const { Client } = require('pg');
const fs = require('fs');

async function seed() {
  try {
    const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_a2Bd7zunFQGS@ep-raspy-field-atf5mbs5.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
    await client.connect();
    console.log('Connected to Neon DB');
    
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
