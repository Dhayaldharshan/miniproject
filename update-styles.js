const fs = require('fs');

function updateCss(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Update .public-mode-banner
    const oldBanner = `.public-mode-banner {
    display: none;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: var(--radius-md);
    color: #334155;
    font-size: 13px;
    line-height: 1.5;
}`;

    const newBanner = `.public-mode-banner {
    display: none;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: #1C1E26;
    border: 1px solid #323644;
    border-left: 4px solid #DC3545;
    border-radius: var(--radius-md);
    color: #E2E8F0;
    font-size: 13px;
    line-height: 1.5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    margin-bottom: 20px;
}`;

    if (content.includes('.public-mode-banner {')) {
        content = content.replace(/\.public-mode-banner\s*\{[^}]+\}/, newBanner);
        console.log(`Updated banner in ${filePath}`);
    }

    // Update .dashboard-screen.role-admin -> .dashboard-screen
    // Specifically in the GRAPHITE + CRIMSON design system section
    const themeMarker = 'GRAPHITE + CRIMSON ADMIN DESIGN SYSTEM';
    const markerIndex = content.indexOf(themeMarker);
    if (markerIndex !== -1) {
        const pre = content.substring(0, markerIndex);
        let post = content.substring(markerIndex);
        post = post.replace(/\.dashboard-screen\.role-admin/g, '.dashboard-screen');
        content = pre + post;
        console.log(`Updated .dashboard-screen selectors in ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

updateCss('frontend/style.css');
updateCss('style.css');
console.log('Styles successfully updated!');

