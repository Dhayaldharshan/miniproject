const fs = require('fs');

const fullShowDashboard = `    function showDashboardScreen(user) {
        if (elements.authScreen) elements.authScreen.style.display = 'none';
        if (elements.dashboardScreen) elements.dashboardScreen.style.display = 'flex';

        // Update Identity in Topbar and Sidebar
        const displayName = user.fullName || user.email.split('@')[0];
        const initials = displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'OP';

        if (elements.topbarUserName) elements.topbarUserName.textContent = displayName;
        if (elements.topbarUserAvatar) elements.topbarUserAvatar.textContent = initials;
        if (elements.sidebarUserSessionName) elements.sidebarUserSessionName.textContent = displayName;
        if (elements.sidebarUserSessionRole) elements.sidebarUserSessionRole.textContent = \`\${user.role} Clearance\`;

        if (elements.topbarRoleBadge) {
            elements.topbarRoleBadge.textContent = user.role;
            elements.topbarRoleBadge.className = \`role-badge \${user.role.toLowerCase()}\`;
        }

        // Apply Role Clearance to Dashboard Container
        elements.dashboardScreen.classList.remove('role-admin', 'role-coordinator', 'role-public');
        elements.dashboardScreen.classList.add(\`role-\${user.role.toLowerCase()}\`);

        if (user.role === 'PUBLIC') {
            document.title = 'ResQ-Allocate | Public Incident Report';
            navigateTo('public-report');
        } else {
            document.title = 'ResQ-Allocate | Emergency Command & Control Center';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        }
    }`;

function fix(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(
        /function showDashboardScreen\(user\) \{[\s\S]*?navigateTo\(activeHash === 'signin' \|\| activeHash === 'signup' \|\| activeHash === 'public-report' \? 'dashboard' : activeHash\);\s*\}/,
        fullShowDashboard
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed showDashboardScreen in ${filePath}`);
}

fix('frontend/app.js');
fix('app.js');

