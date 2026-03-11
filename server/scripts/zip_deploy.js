const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

async function createZip() {
    try {
        const zip = new AdmZip();
        const rootDir = path.join(__dirname, '..');
        const outputFile = path.join(rootDir, 'server.zip');

        console.log('📦 Starting zip creation...');

        // 1. Add key files from root
        const keyFiles = ['server.js', 'package.json', 'package-lock.json', '.env.example'];
        for (const file of keyFiles) {
            const filePath = path.join(rootDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`   + Adding file: ${file}`);
                zip.addLocalFile(filePath);
            }
        }

        // 2. Add folders (recursive)
        const folders = ['src', 'public', 'prisma', '.ebextensions'];
        for (const folder of folders) {
            const folderPath = path.join(rootDir, folder);
            if (fs.existsSync(folderPath)) {
                console.log(`   + Adding folder: ${folder}`);
                // adm-zip automatically handles recursion and path separators
                zip.addLocalFolder(folderPath, folder);
            }
        }

        // 3. Write zip file
        console.log(`💾 Writing to ${outputFile}...`);
        zip.writeZip(outputFile);
        console.log('✅ server.zip created successfully!');

    } catch (error) {
        console.error('❌ Error creating zip:', error);
        process.exit(1);
    }
}

createZip();
