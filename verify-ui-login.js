const { spawn } = require('child_process');
const http = require('http');

async function main() {
    console.log('Launching headless Chrome on debugging port 9333...');
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9333',
        '--user-data-dir=' + __dirname + '\\chrome-test-profile',
        'about:blank'
    ]);

    // Wait for Chrome to initialize
    await new Promise(r => setTimeout(r, 1500));

    try {
        const jsonList = await new Promise((resolve, reject) => {
            http.get('http://127.0.0.1:9333/json', res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        const target = jsonList.find(t => t.type === 'page');
        if (!target || !target.webSocketDebuggerUrl) {
            throw new Error('No page target found');
        }

        console.log('Connecting to WebSocket debugger:', target.webSocketDebuggerUrl);
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        let id = 1;
        const pending = new Map();

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id && pending.has(msg.id)) {
                pending.get(msg.id)(msg.result);
                pending.delete(msg.id);
            }
        };

        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });

        function send(method, params = {}) {
            return new Promise((resolve) => {
                const msgId = id++;
                pending.set(msgId, resolve);
                ws.send(JSON.stringify({ id: msgId, method, params }));
            });
        }

        async function evalJs(expr) {
            const res = await send('Runtime.evaluate', {
                expression: expr,
                returnByValue: true,
                awaitPromise: true
            });
            return res.result?.value;
        }

        console.log('Navigating to http://127.0.0.1:5500...');
        await send('Page.navigate', { url: 'http://127.0.0.1:5500' });
        await new Promise(r => setTimeout(r, 2000));

        // 1. Check Initial State on Auth Screen
        const pageTitle = await evalJs('document.title');
        console.log('1. Page loaded, title:', pageTitle);

        // 2. Test Invalid Password Error display
        console.log('\n2. Testing wrong password error display for dharun@gmail.com...');
        await evalJs(`
            document.getElementById('authSignInEmail').value = 'dharun@gmail.com';
            document.getElementById('authSignInAccountType').value = 'PUBLIC';
            document.getElementById('authSignInPassword').value = 'WrongPassword999';
            document.getElementById('authSignInForm').requestSubmit();
        `);
        await new Promise(r => setTimeout(r, 1000));
        const wrongPassAlert = await evalJs(`document.getElementById('authAlertMessage').textContent`);
        const wrongPassDisplay = await evalJs(`document.getElementById('authAlertMessage').style.display`);
        console.log('Wrong Password Alert Display:', wrongPassDisplay);
        console.log('Wrong Password Alert Message:', wrongPassAlert);

        // 3. Test Unregistered Account Error display
        console.log('\n3. Testing unregistered account error display...');
        await evalJs(`
            document.getElementById('authSignInEmail').value = 'unregistered_person@test.com';
            document.getElementById('authSignInAccountType').value = 'PUBLIC';
            document.getElementById('authSignInPassword').value = 'pass123';
            document.getElementById('authSignInForm').requestSubmit();
        `);
        await new Promise(r => setTimeout(r, 1000));
        const unregAlert = await evalJs(`document.getElementById('authAlertMessage').textContent`);
        console.log('Unregistered Account Alert Message:', unregAlert);

        // 4. Test Successful Public Sign In with dharun@gmail.com (using dharun123)
        console.log('\n4. Testing successful Public Sign In with dharun@gmail.com (password: dharun123)...');
        await evalJs(`
            document.getElementById('authSignInEmail').value = 'dharun@gmail.com';
            document.getElementById('authSignInAccountType').value = 'PUBLIC';
            document.getElementById('authSignInPassword').value = 'dharun123';
            document.getElementById('authSignInForm').requestSubmit();
        `);
        await new Promise(r => setTimeout(r, 1500));

        const dashboardDisplay = await evalJs(`document.getElementById('dashboardScreen').style.display`);
        const newTitle = await evalJs(`document.title`);
        const topbarUser = await evalJs(`document.getElementById('topbarUserName')?.textContent`);
        const topbarRole = await evalJs(`document.getElementById('topbarRoleBadge')?.textContent`);
        const publicBannerDisplay = await evalJs(`document.getElementById('publicModeNotice')?.style.display`);
        const pageHeaderTitle = await evalJs(`document.getElementById('currentPageTitle')?.textContent`);
        const breadcrumbText = await evalJs(`document.getElementById('currentBreadcrumb')?.textContent`);
        const dashboardClasses = await evalJs(`document.getElementById('dashboardScreen')?.className`);

        console.log('\n====================================================');
        console.log(' PUBLIC PANEL VERIFICATION REPORT');
        console.log('====================================================');
        console.log('Dashboard display:            ', dashboardDisplay);
        console.log('Document title:               ', newTitle);
        console.log('Topbar user name:             ', topbarUser);
        console.log('Topbar role badge:            ', topbarRole);
        console.log('Public Observer Banner display:', publicBannerDisplay);
        console.log('Page Header Title:            ', pageHeaderTitle);
        console.log('Breadcrumb:                   ', breadcrumbText);
        console.log('Dashboard Screen Classes:     ', dashboardClasses);

        ws.close();
    } finally {
        chrome.kill();
        console.log('\nHeadless Chrome process closed.');
    }
}

main().catch(err => {
    console.error('Error running test:', err);
    process.exit(1);
});
