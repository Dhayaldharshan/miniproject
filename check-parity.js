const fs = require('fs');
const crypto = require('crypto');

const files = ['index.html', 'style.css', 'app.js', 'api.js'];

files.forEach(f => {
    const rootPath = f;
    const frontPath = 'frontend/' + f;
    const rootBuf = fs.readFileSync(rootPath);
    const frontBuf = fs.readFileSync(frontPath);
    const rootHash = crypto.createHash('sha256').update(rootBuf).digest('hex');
    const frontHash = crypto.createHash('sha256').update(frontBuf).digest('hex');
    const match = rootHash === frontHash;
    console.log(`${f.padEnd(12)}: ${match ? 'MATCH' : 'MISMATCH'} (root: ${rootHash.substring(0,8)} | front: ${frontHash.substring(0,8)})`);
    if (!match) {
        fs.copyFileSync(frontPath, rootPath);
        console.log(`  -> Synced frontend/${f} to ${rootPath}`);
    }
});

