const bcrypt = require('bcryptjs');
const hash = '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXmxFkEVsjBK7Fh8nJ3v7xkBkXm5xKae';
bcrypt.compare('password123', hash).then(r => console.log('Match:', r)).catch(e => console.error(e));
