const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('=== VERIFYING GRAPHITE + CRIMSON UI STYLING ===');

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

    const userDataDir = path.join(__dirname, 'browser_profile_styled');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const browserProc = spawn(browserExe, [
        '--headless=new',
        '--remote-debugging-port=9226',
        `--user-data-dir=${userDataDir}`,
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        'http://127.0.0.1:5500/'
    ]);

    await new Promise(r => setTimeout(r, 2000));

    const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9226/json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
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

    console.log('[1] Loading http://127.0.0.1:5500/');
    await send('Page.navigate', { url: 'http://127.0.0.1:5500/' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Verify Login Screen Styles
    const loginStyleCheck = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const body = document.body;
                const authScreen = document.getElementById('authScreen');
                const authCard = document.querySelector('.auth-container-card');
                const submitBtn = document.getElementById('authSignInBtn');
                const confirmModal = document.getElementById('confirmActionModal');
                const regionModal = document.getElementById('regionDetailModal');
                const dashboardScreen = document.getElementById('dashboardScreen');

                const bodyStyle = window.getComputedStyle(body);
                const authScreenStyle = window.getComputedStyle(authScreen);
                const cardStyle = authCard ? window.getComputedStyle(authCard) : null;
                const btnStyle = submitBtn ? window.getComputedStyle(submitBtn) : null;
                const confirmStyle = confirmModal ? window.getComputedStyle(confirmModal) : null;
                const regionStyle = regionModal ? window.getComputedStyle(regionModal) : null;
                const dashStyle = dashboardScreen ? window.getComputedStyle(dashboardScreen) : null;

                return {
                    bodyBg: bodyStyle.backgroundColor,
                    authScreenBg: authScreenStyle.backgroundColor,
                    authCardBg: cardStyle ? cardStyle.backgroundColor : null,
                    authCardBorderRadius: cardStyle ? cardStyle.borderRadius : null,
                    submitBtnBg: btnStyle ? btnStyle.backgroundColor : null,
                    submitBtnColor: btnStyle ? btnStyle.color : null,
                    submitBtnPadding: btnStyle ? btnStyle.padding : null,
                    confirmModalVisible: confirmStyle ? (confirmStyle.display !== 'none' && confirmStyle.visibility !== 'hidden' && confirmStyle.opacity !== '0') : false,
                    regionModalVisible: regionStyle ? (regionStyle.display !== 'none' && regionStyle.visibility !== 'hidden' && regionStyle.opacity !== '0') : false,
                    dashboardVisibleInitially: dashStyle ? dashStyle.display !== 'none' : false
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Login Screen Computed Styles:', loginStyleCheck.result.value);

    // Screenshot Login Screen
    const loginShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'login_styled.png'), Buffer.from(loginShot.data, 'base64'));
    console.log('Saved screenshot: scratch/login_styled.png');

    // 2. Perform Login as ADMIN
    console.log('\n[2] Logging in as ADMIN...');
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
    await new Promise(r => setTimeout(r, 2500));

    // 3. Verify Authenticated Dashboard Screen Styles
    const dashStyleCheck = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const dashboardScreen = document.getElementById('dashboardScreen');
                const sidebar = document.querySelector('.sidebar');
                const topbar = document.querySelector('.topbar');
                const statCards = Array.from(document.querySelectorAll('.stat-card'));
                const firstCard = statCards[0];

                const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
                const topbarStyle = topbar ? window.getComputedStyle(topbar) : null;
                const cardStyle = firstCard ? window.getComputedStyle(firstCard) : null;

                return {
                    dashboardScreenDisplay: dashboardScreen ? window.getComputedStyle(dashboardScreen).display : null,
                    sidebarBg: sidebarStyle ? sidebarStyle.backgroundColor : null,
                    topbarBg: topbarStyle ? topbarStyle.backgroundColor : null,
                    statCardBg: cardStyle ? cardStyle.backgroundColor : null,
                    statCardBorder: cardStyle ? cardStyle.borderColor : null,
                    statCardRadius: cardStyle ? cardStyle.borderRadius : null,
                    statCardCount: statCards.length,
                    statCardValues: statCards.map(c => ({
                        label: c.querySelector('.stat-label')?.textContent?.trim(),
                        value: c.querySelector('.stat-value')?.textContent?.trim()
                    }))
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Dashboard Screen Computed Styles:', dashStyleCheck.result.value);

    // Screenshot Dashboard Screen
    const dashShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'dashboard_styled.png'), Buffer.from(dashShot.data, 'base64'));
    console.log('Saved screenshot: scratch/dashboard_styled.png');

    ws.close();
    browserProc.kill();
    console.log('\n=== UI RENDERING TEST COMPLETED SUCCESSFULLY! ===');
}

main().catch(console.error);

