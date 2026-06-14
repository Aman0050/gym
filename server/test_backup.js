require('dotenv').config();
const { runBackup } = require('./services/backupService');

console.log('Running manual backup test...');
runBackup('MANUAL').then(() => {
  setTimeout(() => {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, 'backups');
    const files = fs.readdirSync(dir);
    if (files.length > 0) {
      console.log('\n✅ Backup files created:');
      files.forEach(f => {
        const size = fs.statSync(path.join(dir, f)).size;
        console.log(`  📄 ${f} (${(size/1024).toFixed(1)} KB)`);
      });
    } else {
      console.log('❌ No backup files found');
    }
    process.exit(0);
  }, 5000);
});
