const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('--- Starting Automated Live Browser Test on ResQ-Allocate Dashboard ---');

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

    console.log(`Using browser: ${browserExe}`);

    const userDataDir = path.join(__dirname, 'browser_profile');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const browserProc = spawn(browserExe, [
        '--headless=new',
        '--remote-debugging-port=9222',
        `--user-data-dir=${userDataDir}`,
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        'http://127.0.0.1:5500/frontend/'
    ]);

    // Give browser 2 seconds to start listening on 9222
    await new Promise(r => setTimeout(r, 2000));

    // Get websocket debugger URL
    const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
            const cb = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            if (msg.error) cb.reject(msg.error);
            else cb.resolve(msg.result);
        }
    });

    await new Promise((resolve, reject) => {
        ws.addEventListener('open', resolve);
        ws.addEventListener('error', reject);
    });

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const msgId = id++;
            callbacks.set(msgId, { resolve, reject });
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('[1] Navigating to http://127.0.0.1:5500/frontend/');
    await send('Page.navigate', { url: 'http://127.0.0.1:5500/frontend/' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('[2] Authenticating as ADMIN via login form in the page...');
    await send('Runtime.evaluate', {
        expression: `
            (async () => {
                document.getElementById('authSignInEmail').value = 'admin@crisis-sync.gov';
                document.getElementById('authSignInPassword').value = 'Admin@123';
                document.getElementById('authSignInForm').dispatchEvent(new Event('submit', { cancelable: true }));
            })()
        `,
        awaitPromise: true
    });

    // Wait for auth & dashboard load
    await new Promise(r => setTimeout(r, 3000));

    // Test 1: Desktop Viewport (1280 x 800)
    console.log('\n[3] Testing DESKTOP Viewport (1280x800)...');
    await send('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false
    });
    await new Promise(r => setTimeout(r, 500));

    const desktopCheck = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const dashboard = document.getElementById('view-dashboard');
                const statsGrid = dashboard ? dashboard.querySelector('.stats-grid') : null;
                const statCards = statsGrid ? Array.from(statsGrid.querySelectorAll('.stat-card')) : [];
                
                // Priority Incidents and Operations Control check
                const priorityTable = document.getElementById('dashRecentRegionsTable');
                const priorityHeading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Priority Incidents'));
                const opsControl = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Operations Control'));

                // Card metrics
                const cardData = statCards.map(c => {
                    const rect = c.getBoundingClientRect();
                    return {
                        label: c.querySelector('.stat-label')?.textContent?.trim(),
                        value: c.querySelector('.stat-value')?.textContent?.trim(),
                        subtext: c.querySelector('.stat-subtext')?.textContent?.trim(),
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    };
                });

                // Top aligned in one row if all card tops are identical
                const allSameRow = cardData.length === 4 && cardData.every(c => c.top === cardData[0].top);

                // Check other direct children of view-dashboard
                const dashboardChildren = Array.from(dashboard.children).map(c => ({
                    tag: c.tagName,
                    class: c.className
                }));

                return {
                    dashboardVisible: dashboard && window.getComputedStyle(dashboard).display !== 'none',
                    cardCount: statCards.length,
                    cardData,
                    allSameRow,
                    priorityTablePresent: !!priorityTable,
                    priorityHeadingPresent: !!priorityHeading,
                    opsControlPresent: !!opsControl,
                    dashboardChildrenCount: dashboardChildren.length,
                    dashboardChildren
                };
            })()
        `,
        returnByValue: true
    });

    console.log('Desktop Results:', JSON.stringify(desktopCheck.result.value, null, 2));

    // Capture desktop screenshot
    const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'dashboard_desktop.png'), Buffer.from(shotDesktop.data, 'base64'));
    console.log('Saved screenshot: scratch/dashboard_desktop.png');

    // Test 2: Tablet Viewport (768 x 1024)
    console.log('\n[4] Testing TABLET Viewport (768x1024)...');
    await send('Emulation.setDeviceMetricsOverride', {
        width: 768,
        height: 1024,
        deviceScaleFactor: 1,
        mobile: true
    });
    await new Promise(r => setTimeout(r, 500));

    const tabletCheck = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const cards = Array.from(document.querySelectorAll('#view-dashboard .stat-card'));
                const cardPositions = cards.map(c => {
                    const rect = c.getBoundingClientRect();
                    return {
                        label: c.querySelector('.stat-label')?.textContent?.trim(),
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width)
                    };
                });
                // Group by top position
                const rows = {};
                cardPositions.forEach(c => {
                    rows[c.top] = (rows[c.top] || 0) + 1;
                });
                return {
                    cardCount: cards.length,
                    cardPositions,
                    rowCount: Object.keys(rows).length,
                    cardsPerRow: Object.values(rows)
                };
            })()
        `,
        returnByValue: true
    });

    console.log('Tablet Results:', JSON.stringify(tabletCheck.result.value, null, 2));

    const shotTablet = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'dashboard_tablet.png'), Buffer.from(shotTablet.data, 'base64'));
    console.log('Saved screenshot: scratch/dashboard_tablet.png');

    // Test 3: Mobile Viewport (375 x 667)
    console.log('\n[5] Testing MOBILE Viewport (375x667)...');
    await send('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 667,
        deviceScaleFactor: 1,
        mobile: true
    });
    await new Promise(r => setTimeout(r, 500));

    const mobileCheck = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const cards = Array.from(document.querySelectorAll('#view-dashboard .stat-card'));
                const cardPositions = cards.map(c => {
                    const rect = c.getBoundingClientRect();
                    return {
                        label: c.querySelector('.stat-label')?.textContent?.trim(),
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width)
                    };
                });
                const rows = {};
                cardPositions.forEach(c => {
                    rows[c.top] = (rows[c.top] || 0) + 1;
                });
                return {
                    cardCount: cards.length,
                    cardPositions,
                    rowCount: Object.keys(rows).length,
                    cardsPerRow: Object.values(rows)
                };
            })()
        `,
        returnByValue: true
    });

    console.log('Mobile Results:', JSON.stringify(mobileCheck.result.value, null, 2));

    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'dashboard_mobile.png'), Buffer.from(shotMobile.data, 'base64'));
    console.log('Saved screenshot: scratch/dashboard_mobile.png');

    // Clean up
    ws.close();
    browserProc.kill();
    console.log('\n--- All Live Browser Tests Completed Successfully! ---');
}

main().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
