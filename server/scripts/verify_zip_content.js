const AdmZip = require('adm-zip');
const path = require('path');

const zipPath = path.join(__dirname, '../server.zip');
const zip = new AdmZip(zipPath);
const zipEntries = zip.getEntries();

let found = false;
zipEntries.forEach(function (zipEntry) {
    if (zipEntry.entryName.startsWith('.ebextensions/')) {
        console.log('Found:', zipEntry.entryName);
        found = true;
    }
});

if (found) {
    console.log('✅ Verification Successful: .ebextensions folder is present in server.zip');
} else {
    console.error('❌ Verification Failed: .ebextensions folder is NOT present in server.zip');
    process.exit(1);
}
