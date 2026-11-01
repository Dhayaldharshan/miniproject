const fs = require('fs');

function fixExtraBrace(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const isCRLF = content.includes('\r\n');
    const lines = content.split(/\r?\n/);
    
    // Look for renderAllocationTable ending
    const targetIdx = lines.findIndex((l, i) => 
        lines[i-1] && lines[i-1].includes("}).join('');") &&
        l.trim() === '}' &&
        lines[i+1] && lines[i+1].trim() === '}'
    );
    
    if (targetIdx !== -1) {
        console.log(`Found extra brace at line ${targetIdx + 2} in ${filePath}`);
        lines.splice(targetIdx + 1, 1); // remove the duplicate '    }'
        const newContent = lines.join(isCRLF ? '\r\n' : '\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Removed extra brace from ${filePath}`);
    } else {
        console.error(`Could not find duplicate closing braces in ${filePath}`);
    }
}

fixExtraBrace('frontend/app.js');
fixExtraBrace('app.js');

