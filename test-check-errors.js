const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

    const userDataDir = path.join(__dirname, 'browser_diag_profile');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const browserProc = spawn(browserExe, [
        '--headless=new',
        '--remote-debugging-port=9225',
        `--user-data-dir=${userDataDir}`,
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        'http://127.0.0.1:5500/'
    ]);

    await new Promise(r => setTimeout(r, 2000));

    const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9225/json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();
    const networkFailures = [];
    const consoleErrors = [];

    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Network.responseReceived') {
            const status = msg.params.response.status;
            const url = msg.params.response.url;
            if (status >= 400) {
                networkFailures.push({ url, status });
            }
        }
        if (msg.method === 'Log.entryAdded') {
            consoleErrors.push(msg.params.entry);
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

    await send('Network.enable');
    await send('Page.enable');
    await send('Log.enable');

    await send('Page.navigate', { url: 'http://127.0.0.1:5500/' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('NETWORK FAILURES (>= 400):', JSON.stringify(networkFailures, null, 2));
    console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors, null, 2));

    ws.close();
    browserProc.kill();
}

main().catch(console.error);

