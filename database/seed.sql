-- =============================================================================
-- StudyTrack - Seed Data
-- =============================================================================
-- This script populates the database with sample data for development
-- and testing purposes.
-- =============================================================================

-- =============================================================================
-- USERS (3 sample users)
-- =============================================================================
INSERT INTO "User" (id, email, name, password, role, provider)
VALUES
  ('u1000000-0000-0000-0000-000000000001', 'admin@studytrack.dev',  'Admin User',   '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXmxFkEVsjBK7Fh8nJ3v7xkBkXm5xKae', 'ADMIN',  'LOCAL'),
  ('u1000000-0000-0000-0000-000000000002', 'test@studytrack.dev',   'Test User',    '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXmxFkEVsjBK7Fh8nJ3v7xkBkXm5xKae', 'STUDENT', 'LOCAL'),
  ('u1000000-0000-0000-0000-000000000003', 'mentor@studytrack.dev', 'Mentor User',  '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXmxFkEVsjBK7Fh8nJ3v7xkBkXm5xKae', 'MENTOR',  'LOCAL');
-- Password for all users: "password123"

-- =============================================================================
-- PROFILES
-- =============================================================================
INSERT INTO "Profile" (userId, bio, targetRole, currentLevel, weeklyHours, careerGoals, skills, timezone)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'Aspiring full-stack developer passionate about system design.', 'Senior Full-Stack Engineer', 'Intermediate', 20, 'Master distributed systems and cloud architecture.', '["JavaScript","TypeScript","React","Node.js","PostgreSQL"]', 'UTC'),
  ('u1000000-0000-0000-0000-000000000003', 'Experienced engineer mentoring the next generation of devs.', 'Staff Engineer', 'Expert', 15, 'Help 100 developers reach senior level.', '["System Design","DevOps","Architecture","Mentoring"]', 'America/New_York');

-- =============================================================================
-- LEARNING STREAKS
-- =============================================================================
INSERT INTO "LearningStreak" (userId, currentStreak, longestStreak, lastActiveDate)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 14, 30, CURRENT_DATE),
  ('u1000000-0000-0000-0000-000000000003', 5, 60, CURRENT_DATE - INTERVAL '1 day');

-- =============================================================================
-- STUDY SESSIONS
-- =============================================================================
INSERT INTO "StudySession" (userId, topic, duration, type, notes, createdAt)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'System Design - Kafka',       3600, 'READING', 'Reviewed partitioning strategies.',                    CURRENT_TIMESTAMP - INTERVAL '2 hours'),
  ('u1000000-0000-0000-0000-000000000002', 'Dynamic Programming',          2700, 'CODING',  'Solved Knapsack and LCS problems.',                       CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('u1000000-0000-0000-0000-000000000002', 'Docker Multi-stage Builds',    1800, 'VIDEO',   'Watched tutorial on optimizing Docker images.',            CURRENT_TIMESTAMP - INTERVAL '3 days'),
  ('u1000000-0000-0000-0000-000000000002', 'React Server Components',      2400, 'GENERAL','Explored RSC architecture and streaming SSR.',              CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('u1000000-0000-0000-0000-000000000002', 'PostgreSQL Indexing',          1200, 'QUIZ',    'Tested knowledge on B-tree, Hash, and GIN indexes.',       CURRENT_TIMESTAMP - INTERVAL '1 week'),
  ('u1000000-0000-0000-0000-000000000003', 'Code Review Best Practices',   3600, 'GENERAL','Reviewed 5 PRs and documented feedback patterns.',          CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('u1000000-0000-0000-0000-000000000003', 'Microservices Communication',  5400, 'READING', 'Studied event-driven architectures and message brokers.',   CURRENT_TIMESTAMP - INTERVAL '3 days');

-- =============================================================================
-- TASKS
-- =============================================================================
INSERT INTO "Task" (userId, title, description, priority, status, dueDate, category, checklist)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'Review Kafka Partitioning Logic',  'Memory consolidation phase. Review the whitepaper and notes.',                        'CRITICAL', 'IN_PROGRESS', CURRENT_TIMESTAMP + INTERVAL '1 day',  'System Design',  '[{"done":true,"text":"Read whitepaper"},{"done":false,"text":"Take notes"},{"done":false,"text":"Practice quiz"}]'),
  ('u1000000-0000-0000-0000-000000000002', 'Complete Dynamic Programming Quiz','Knapsack and LCS variations.',                                                      'MEDIUM',   'TODO',        CURRENT_TIMESTAMP + INTERVAL '2 days', 'Algorithms',     '[{"done":false,"text":"Knapsack problem"},{"done":false,"text":"LCS problem"}]'),
  ('u1000000-0000-0000-0000-000000000002', 'Build Portfolio Project',          'Create a full-stack app with Next.js and Express.',                                    'HIGH',     'TODO',        CURRENT_TIMESTAMP + INTERVAL '7 days', 'Projects',       NULL),
  ('u1000000-0000-0000-0000-000000000002', 'Study OAuth 2.0 Flow',             'Understand authorization code flow, PKCE, and refresh tokens.',                          'LOW',      'DONE',        CURRENT_TIMESTAMP - INTERVAL '1 day', 'Security',       NULL),
  ('u1000000-0000-0000-0000-000000000003', 'Prepare Mentorship Session',       'Create slides for weekly mentoring session on system design.',                          'HIGH',     'IN_PROGRESS', CURRENT_TIMESTAMP + INTERVAL '5 hours', 'Mentoring',      NULL);

-- =============================================================================
-- NOTES
-- =============================================================================
INSERT INTO "Note" (userId, title, content, tags, isPinned)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'Kafka Partitioning Key Takeaways',
   '## Key Concepts\n- Partitions are the unit of parallelism in Kafka\n- Messages with same key go to same partition\n- Partition count affects consumer group scaling\n\n## Best Practices\n- Use meaningful keys for ordering guarantees\n- Monitor partition leader election\n- Set appropriate replication factor (3 for production)',
   ARRAY['kafka','system-design','distributed-systems'], TRUE),

  ('u1000000-0000-0000-0000-000000000002', 'Dynamic Programming Patterns',
   '## Common Patterns\n1. **Fibonacci-style** - Simple recursion + memoization\n2. **Knapsack** - 0/1 and unbounded variants\n3. **LCS/LIS** - String/sequence alignment\n4. **Matrix Chain** - Optimal parenthesization\n5. **Tree DP** - DFS-based DP on trees',
   ARRAY['algorithms','dp','competitive-programming'], FALSE),

  ('u1000000-0000-0000-0000-000000000002', 'Docker Optimization Tips',
   '- Use multi-stage builds to reduce image size\n- Leverage build cache by ordering layers wisely\n- Use .dockerignore to exclude unnecessary files\n- Prefer Alpine-based base images\n- Use distroless images for production',
   ARRAY['docker','devops','containers'], FALSE);

-- =============================================================================
-- COLLECTIONS
-- =============================================================================
INSERT INTO "Collection" (userId, name, description, color, icon)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'System Design',  'Resources for distributed systems and architecture',   '#FFCF70', 'Database'),
  ('u1000000-0000-0000-0000-000000000002', 'DevOps',         'CI/CD, Docker, Kubernetes, and cloud infrastructure', '#4ADE80', 'HardDrive'),
  ('u1000000-0000-0000-0000-000000000002', 'Java',           'Core Java, Spring Boot, and JVM internals',           '#60A5FA', 'FileCode');

-- =============================================================================
-- RESOURCES
-- =============================================================================
INSERT INTO "Resource" (userId, title, type, url, tags, collectionId, isFavorite)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'Designing Data-Intensive Applications', 'PDF',  NULL,                                          ARRAY['book','system-design','distributed-systems'], (SELECT id FROM "Collection" WHERE name='System Design' LIMIT 1), TRUE),
  ('u1000000-0000-0000-0000-000000000002', 'Kafka Documentation',                   'LINK', 'https://kafka.apache.org/documentation/',    ARRAY['documentation','kafka','streaming'],              (SELECT id FROM "Collection" WHERE name='System Design' LIMIT 1), TRUE),
  ('u1000000-0000-0000-0000-000000000002', 'Docker Deep Dive Video',                'LINK', 'https://youtube.com/watch?v=example',        ARRAY['video','docker','containers'],                    (SELECT id FROM "Collection" WHERE name='DevOps' LIMIT 1),    FALSE),
  ('u1000000-0000-0000-0000-000000000002', 'Spring Boot Guide',                     'LINK', 'https://spring.io/guides',                  ARRAY['java','spring','backend'],                        (SELECT id FROM "Collection" WHERE name='Java' LIMIT 1),     FALSE);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
INSERT INTO "Notification" (userId, title, body, type, isRead, actionUrl)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'Study Reminder',      'You haven''t logged a session today. Keep your streak alive!',                    'REMINDER',    FALSE, '/dashboard'),
  ('u1000000-0000-0000-0000-000000000002', '14-Day Streak!',      'Congratulations! You''ve maintained a 14-day learning streak.',                   'ACHIEVEMENT', TRUE,  '/dashboard/trends'),
  ('u1000000-0000-0000-0000-000000000002', 'New Mentorship Available', 'A senior engineer is available for 1:1 mentoring this week.',                    'MENTOR',      FALSE, '/dashboard/chat'),
  ('u1000000-0000-0000-0000-000000000003', 'New Mentee Assigned', 'A new student has been assigned to you for mentorship.',                           'SYSTEM',      FALSE, '/dashboard/mentoring');

-- =============================================================================
-- ACTIVITY LOGS
-- =============================================================================
INSERT INTO "ActivityLog" (userId, action, entity, entityId, metadata)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'SESSION_CREATED',  'StudySession', 's1000000-0000-0000-0000-000000000001', '{"topic":"System Design - Kafka","duration":3600}'),
  ('u1000000-0000-0000-0000-000000000002', 'TASK_CREATED',     'Task',         't1000000-0000-0000-0000-000000000001', '{"title":"Review Kafka Partitioning Logic"}'),
  ('u1000000-0000-0000-0000-000000000002', 'NOTE_CREATED',     'Note',         'n1000000-0000-0000-0000-000000000001', '{"title":"Kafka Partitioning Key Takeaways"}'),
  ('u1000000-0000-0000-0000-000000000002', 'RESOURCE_ADDED',   'Resource',     'r1000000-0000-0000-0000-000000000001', '{"title":"Designing Data-Intensive Applications"}'),
  ('u1000000-0000-0000-0000-000000000003', 'LOGIN_SUCCESS',    'Session',      's1000000-0000-0000-0000-000000000010', '{"provider":"LOCAL"}');

-- =============================================================================
-- BROWSER TELEMETRY
-- =============================================================================
INSERT INTO "BrowserTelemetry" (userId, url, title, domain, duration, category, timestamp)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', 'MDN JavaScript Guide',            'developer.mozilla.org',  1800, 'Documentation', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
  ('u1000000-0000-0000-0000-000000000002', 'https://github.com/username/project',                     'GitHub Repository',               'github.com',             900,  'Programming',   CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  ('u1000000-0000-0000-0000-000000000002', 'https://stackoverflow.com/questions/12345',              'Stack Overflow Question',         'stackoverflow.com',      300,  'Programming',   CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
  ('u1000000-0000-0000-0000-000000000002', 'https://chat.openai.com/',                                'ChatGPT',                         'chat.openai.com',        600,  'AI Tools',      CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
  ('u1000000-0000-0000-0000-000000000002', 'https://youtube.com/watch?v=example',                     'YouTube Tutorial',                'youtube.com',            1200, 'Social Media',  CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('u1000000-0000-0000-0000-000000000003', 'https://react.dev/learn',                                 'React Documentation',             'react.dev',              2400, 'Documentation', CURRENT_TIMESTAMP - INTERVAL '3 hours');

-- =============================================================================
-- DESKTOP TELEMETRY
-- =============================================================================
INSERT INTO "DesktopTelemetry" (userId, activeApp, windowTitle, processName, duration, isIdle, category, timestamp)
VALUES
  ('u1000000-0000-0000-0000-000000000002', 'Code',          'server.ts - backend',                  'Code',          3600, FALSE, 'IDE',      CURRENT_TIMESTAMP - INTERVAL '2 hours'),
  ('u1000000-0000-0000-0000-000000000002', 'WindowsTerminal','npm run dev',                          'WindowsTerminal',1800, FALSE, 'Terminal', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  ('u1000000-0000-0000-0000-000000000002', 'chrome',        'MDN JavaScript Guide - Google Chrome', 'chrome.exe',    900,  FALSE, 'Browser',  CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
  ('u1000000-0000-0000-0000-000000000002', 'Spotify',       'Lo-Fi Study Beats',                    'Spotify.exe',   300,  FALSE, 'General',  CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
  ('u1000000-0000-0000-0000-000000000003', 'Code - Insiders','index.ts - backend',                  'Code - Insiders',5400, FALSE, 'IDE',      CURRENT_TIMESTAMP - INTERVAL '1 day');

-- =============================================================================
-- END OF SEED DATA
-- =============================================================================
