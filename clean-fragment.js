const fs = require('fs');

function cleanFileLines(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const isCRLF = content.includes('\r\n');
    const lines = content.split(/\r?\n/);
    
    // Find index of '    })">'
    const targetIdx = lines.findIndex(l => l.includes('    })">'));
    if (targetIdx !== -1) {
        console.log(`Found targetIdx at ${targetIdx} in ${filePath}`);
        // Find next '    // --- Regions Data ---'
        const nextIdx = lines.findIndex((l, i) => i > targetIdx && l.includes('    // --- Regions Data ---'));
        console.log(`Found nextIdx at ${nextIdx} in ${filePath}`);
        
        // Between targetIdx and nextIdx, replace lines with just '    }'
        lines.splice(targetIdx, nextIdx - targetIdx, '    }', '');
        const newContent = lines.join(isCRLF ? '\r\n' : '\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Successfully cleaned ${filePath}`);
    } else {
        console.error(`Could not find targetIdx in ${filePath}`);
    }
}

cleanFileLines('frontend/app.js');
cleanFileLines('app.js');
