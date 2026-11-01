const fs = require('fs');

function fix(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(
        /navigateTo\(activeHash === 'signin' \|\| activeHash === 'signup' \|\| activeHash === 'public-report' \? 'dashboard' : activeHash\);\r?\n\s*\}\r?\n\s*\}\r?\n\s*\/\*\*/,
        "navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);\n        }\n    }\n\n    /**"
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed extra brace in ${filePath}`);
}

fix('frontend/app.js');
fix('app.js');

