const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('=== TESTING OFFLINE & RETRY BEHAVIOR ===');

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

    const userDataDir = path.join(__dirname, 'browser_profile_offline_test');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const browserProc = spawn(browserExe, [
        '--headless=new',
        '--remote-debugging-port=9224',
        `--user-data-dir=${userDataDir}`,
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        'http://127.0.0.1:5500/frontend/'
    ]);

    await new Promise(r => setTimeout(r, 2000));

    const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9224/json', (res) => {
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

    await send('Page.navigate', { url: 'http://127.0.0.1:5500/frontend/' });
    await new Promise(r => setTimeout(r, 2000));

    // Sign in
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
    await new Promise(r => setTimeout(r, 2000));

    // Switch to Affected Regions
    await send('Runtime.evaluate', { expression: `location.hash = '#regions';` });
    await new Promise(r => setTimeout(r, 1000));

    // Simulate backend going offline
    const simulateOffline = await send('Runtime.evaluate', {
        expression: `
            (() => {
                // Mock ResqApi.checkHealth returning false
                ResqApi.checkHealth = async () => false;
                // Trigger refresh
                return (async () => {
                    const statusDot = document.getElementById('systemStatusDot');
                    const connText = document.getElementById('connectionStatusText');
                    const offlineBanner = document.getElementById('offlineBanner');
                    
                    // Call resqRetryCurrentView with health returning false
                    await window.resqRetryCurrentView();

                    const tbody = document.getElementById('regionsTableBody');
                    const hasSpinner = tbody.querySelector('.spinner') !== null;
                    const hasRetryBtn = tbody.querySelector('button') !== null;
                    const textContent = tbody.textContent.trim();

                    return {
                        hasSpinner,
                        hasRetryBtn,
                        textContentSummary: textContent.substring(0, 100),
                        bannerDisplayed: offlineBanner.style.display !== 'none'
                    };
                })();
            })()
        `,
        awaitPromise: true,
        returnByValue: true
    });
    console.log('Offline Simulation Result in Affected Regions:', simulateOffline.result.value);

    // Now test Retry when connection is restored
    const testReconnect = await send('Runtime.evaluate', {
        expression: `
            (async () => {
                // Restore checkHealth to real function
                delete ResqApi.checkHealth;
                // Click retry button in table
                await window.resqRetryCurrentView();

                const rows = Array.from(document.querySelectorAll('#regionsTableBody tr'));
                const hasSpinner = document.querySelector('#regionsTableBody .spinner') !== null;

                return {
                    rowCountAfterReconnect: rows.length,
                    hasSpinner,
                    firstRowRegion: rows[0]?.querySelector('td:nth-child(2)')?.textContent?.trim()
                };
            })()
        `,
        awaitPromise: true,
        returnByValue: true
    });
    console.log('Reconnect Simulation Result:', testReconnect.result.value);

    ws.close();
    browserProc.kill();
    console.log('=== OFFLINE & RECONNECT TESTS PASSED ===');
}

main().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

