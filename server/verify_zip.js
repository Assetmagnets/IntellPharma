const AdmZip = require('adm-zip');
const zip = new AdmZip('server.zip');
const entries = zip.getEntries();
const found = entries.some(entry => entry.entryName.includes('controllers/superAdmin.controller.js'));
if (found) {
    console.log("✅ controllers/superAdmin.controller.js FOUND in zip");
} else {
    console.log("❌ controllers/superAdmin.controller.js NOT FOUND in zip");
    entries.forEach(e => console.log(e.entryName));
}
