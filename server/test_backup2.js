require('dotenv').config();
const { runBackup } = require('./services/backupService');
console.log('Running...');
runBackup('MANUAL').then(() => {
  console.log('Done.');
  process.exit(0);
});
