require('dotenv').config();
const { checkAndSendNotifications } = require('./src/services/scheduler');

console.log('Triggering manual notification check...');
checkAndSendNotifications()
    .then(() => {
        console.log('Manual check complete.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Manual check failed:', err);
        process.exit(1);
    });
