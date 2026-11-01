const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('=== FULL END-TO-END CLEAN LOGIN TEST ===');

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

    const userDataDir = path.join(__dirname, 'browser_profile_clean_auth2');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const PORT = 9250;
    const browserProc = spawn(browserExe, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${userDataDir}`,
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        'about:blank'
    ]);

    await new Promise(r => setTimeout(r, 2000));

    const targets = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();
    const consoleErrors = [];

    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
            const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
            if (msg.params.type === 'error') {
                consoleErrors.push(text);
                console.log(`[BROWSER ERROR] ${text}`);
            }
        }
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

    async function evalScript(expression) {
        const res = await send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result.value;
    }

    await send('Runtime.enable');
    await send('Page.enable');

    console.log("Navigating to http://127.0.0.1:5500/...");
    await send('Page.navigate', { url: 'http://127.0.0.1:5500/' });
    await new Promise(r => setTimeout(r, 2500));

    console.log("\n[1/5] DOM Verification:");
    const dom = await evalScript(`(() => {
        const email = document.getElementById('authSignInEmail');
        const pass = document.getElementById('authSignInPassword');
        const select = document.getElementById('authSignInAccountType');
        const submit = document.getElementById('authSignInBtn');
        const toggle = document.getElementById('toggleSignInPassword');
        const demoAccounts = document.querySelector('.auth-demo-accounts');
        const demoChips = document.querySelectorAll('.auth-demo-chip');
        const fullText = document.body.innerText;
        const tabs = document.querySelector('.auth-nav-tabs');
        const signUpLink = document.getElementById('linkToSignUp');
        const title = document.querySelector('.auth-brand-title');
        const security = document.querySelector('.auth-footer-notice');

        return {
            hasEmail: !!email,
            emailPlaceholder: email.placeholder,
            hasPassword: !!pass,
            hasSelect: !!select,
            options: Array.from(select.options).map(o => o.value),
            hasSubmit: !!submit,
            hasToggle: !!toggle,
            hasDemoAccounts: !!demoAccounts,
            demoChipCount: demoChips.length,
            hasVerifiedText: fullText.includes('Verified System Test Accounts'),
            hasTabs: !!tabs,
            hasSignUpLink: !!signUpLink,
            title: title ? title.textContent.trim() : null,
            security: security ? security.textContent.trim() : null
        };
    })()`);
    console.log(JSON.stringify(dom, null, 2));

    console.log("\n[2/5] Password Toggle Verification:");
    const toggle = await evalScript(`(() => {
        const toggleBtn = document.getElementById('toggleSignInPassword');
        const passInput = document.getElementById('authSignInPassword');
        const t0 = passInput.type;
        toggleBtn.click();
        const t1 = passInput.type;
        toggleBtn.click();
        const t2 = passInput.type;
        return { initial: t0, afterToggleOn: t1, afterToggleOff: t2 };
    })()`);
    console.log(JSON.stringify(toggle, null, 2));

    async function testLogin(email, password, role) {
        return await evalScript(`(async () => {
            const emailInput = document.getElementById('authSignInEmail');
            const passInput = document.getElementById('authSignInPassword');
            const select = document.getElementById('authSignInAccountType');
            const submitBtn = document.getElementById('authSignInBtn');

            emailInput.value = '${email}';
            passInput.value = '${password}';
            select.value = '${role}';

            submitBtn.click();

            for (let i = 0; i < 40; i++) {
                await new Promise(r => setTimeout(r, 100));
                const dashboard = document.getElementById('dashboardScreen');
                if (dashboard && dashboard.style.display !== 'none' && getComputedStyle(dashboard).display !== 'none') {
                    const badge = document.getElementById('topbarRoleBadge');
                    const notice = document.getElementById('publicModeNotice');
                    const logoutBtn = document.getElementById('topbarLogoutBtn');
                    
                    const res = {
                        success: true,
                        role: badge ? badge.textContent.trim() : null,
                        noticeVisible: notice ? notice.style.display !== 'none' : false
                    };

                    // Logout to reset for next test
                    if (logoutBtn) logoutBtn.click();
                    await new Promise(r => setTimeout(r, 300));
                    return res;
                }
            }
            const alertMsg = document.getElementById('authAlertMessage');
            return { success: false, error: alertMsg ? alertMsg.textContent : 'Timeout' };
        })()`);
    }

    console.log("\n[3/5] Testing Admin Sign-In:");
    const adminRes = await testLogin('admin@crisis-sync.gov', 'Admin@123', 'ADMIN');
    console.log("Admin result:", JSON.stringify(adminRes));

    console.log("\n[4/5] Testing Coordinator Sign-In:");
    const coordRes = await testLogin('coordinator@crisis-sync.gov', 'Coordinator@123', 'COORDINATOR');
    console.log("Coordinator result:", JSON.stringify(coordRes));

    console.log("\n[5/5] Testing Public Sign-In:");
    const publicRes = await testLogin('citizen@crisis-sync.gov', 'Citizen@123', 'PUBLIC');
    console.log("Public result:", JSON.stringify(publicRes));

    console.log("\nConsole Errors Recorded:", consoleErrors.length);

    ws.close();
    browserProc.kill();
    console.log("\n=== ALL TESTS COMPLETED ===");
}

main().catch(console.error);
