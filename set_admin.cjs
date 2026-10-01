const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'data', 'users.json');
if (fs.existsSync(usersFile)) {
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  users.forEach(u => {
    u.role = 'admin'; // Make all existing users admin for testing
  });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  console.log('Set existing users to admin.');
}
