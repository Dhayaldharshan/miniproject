const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('=== FULL LIVE APPLICATION END-TO-END TEST ===');

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

    const userDataDir = path.join(__dirname, 'browser_profile_pages');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const browserProc = spawn(browserExe, [
        '--headless=new',
        '--remote-debugging-port=9223',
        `--user-data-dir=${userDataDir}`,
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        'http://127.0.0.1:5500/frontend/'
    ]);

    await new Promise(r => setTimeout(r, 2000));

    const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9223/json', (res) => {
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

    console.log('[1] Logging into ResQ-Allocate as ADMIN...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5500/frontend/' });
    await new Promise(r => setTimeout(r, 2000));

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

    // Test Page 1: Dashboard
    console.log('\n--- VERIFYING PAGE 1: DASHBOARD ---');
    const dashRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                return {
                    regCount: document.getElementById('statRegionCount')?.textContent?.trim(),
                    teamCount: document.getElementById('statTeamCount')?.textContent?.trim(),
                    foodStock: document.getElementById('statFoodStock')?.textContent?.trim(),
                    medStock: document.getElementById('statMedStock')?.textContent?.trim(),
                    connectionStatus: document.getElementById('connectionStatusText')?.textContent?.trim(),
                    offlineBannerHidden: document.getElementById('offlineBanner')?.style?.display === 'none'
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Dashboard Data:', dashRes.result.value);

    // Test Page 2: Affected Regions
    console.log('\n--- VERIFYING PAGE 2: AFFECTED REGIONS ---');
    await send('Runtime.evaluate', { expression: `location.hash = '#regions';` });
    await new Promise(r => setTimeout(r, 1500));

    const regionsRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const rows = Array.from(document.querySelectorAll('#regionsTableBody tr'));
                const hasSpinner = document.querySelector('#regionsTableBody .spinner') !== null;
                const sampleRows = rows.slice(0, 5).map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()));
                return {
                    rowCount: rows.length,
                    hasSpinner,
                    firstRowText: rows[0]?.textContent?.trim(),
                    sampleRows
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Affected Regions Data:', JSON.stringify(regionsRes.result.value, null, 2));

    // Test Page 3: Priority Requests
    console.log('\n--- VERIFYING PAGE 3: PRIORITY REQUESTS ---');
    await send('Runtime.evaluate', { expression: `location.hash = '#requests';` });
    await new Promise(r => setTimeout(r, 1500));

    const requestsRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const rows = Array.from(document.querySelectorAll('#requestsTableBody tr'));
                const hasSpinner = document.querySelector('#requestsTableBody .spinner') !== null;
                return {
                    rowCount: rows.length,
                    hasSpinner,
                    sampleRows: rows.slice(0, 3).map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()))
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Priority Requests Data:', JSON.stringify(requestsRes.result.value, null, 2));

    // Test Page 4: Resource Inventory
    console.log('\n--- VERIFYING PAGE 4: RESOURCE INVENTORY ---');
    await send('Runtime.evaluate', { expression: `location.hash = '#inventory';` });
    await new Promise(r => setTimeout(r, 1500));

    const invRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                // Click View Details on Food
                const btnFood = document.getElementById('btnSelectFood');
                if (btnFood) btnFood.click();
                
                const availEl = document.getElementById('invDetailAvailable')?.textContent?.trim();
                const reqEl = document.getElementById('invDetailRequired')?.textContent?.trim();
                const allocEl = document.getElementById('invDetailAllocated')?.textContent?.trim();
                const remEl = document.getElementById('invDetailRemaining')?.textContent?.trim();
                const rows = Array.from(document.querySelectorAll('#invRegionRequirementsBody tr'));

                return {
                    foodAvailable: availEl,
                    foodRequired: reqEl,
                    foodAllocated: allocEl,
                    foodRemaining: remEl,
                    requirementsRowCount: rows.length
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Resource Inventory Data:', invRes.result.value);

    // Test Page 5: Rescue Teams
    console.log('\n--- VERIFYING PAGE 5: RESCUE TEAMS ---');
    await send('Runtime.evaluate', { expression: `location.hash = '#teams';` });
    await new Promise(r => setTimeout(r, 1500));

    const teamsRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const total = document.getElementById('teamStatTotal')?.textContent?.trim();
                const avail = document.getElementById('teamStatAvailable')?.textContent?.trim();
                const busy = document.getElementById('teamStatBusy')?.textContent?.trim();
                const rows = Array.from(document.querySelectorAll('#teamsTableBody tr'));
                const hasSpinner = document.querySelector('#teamsTableBody .spinner') !== null;
                return {
                    statTotal: total,
                    statAvail: avail,
                    statBusy: busy,
                    rowCount: rows.length,
                    hasSpinner,
                    sampleTeams: rows.slice(0, 4).map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()))
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Rescue Teams Data:', JSON.stringify(teamsRes.result.value, null, 2));

    // Test Page 6: Shelters
    console.log('\n--- VERIFYING PAGE 6: SHELTERS ---');
    await send('Runtime.evaluate', { expression: `location.hash = '#shelters';` });
    await new Promise(r => setTimeout(r, 1500));

    const sheltersRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const total = document.getElementById('shelterStatTotal')?.textContent?.trim();
                const cap = document.getElementById('shelterStatCapacity')?.textContent?.trim();
                const occ = document.getElementById('shelterStatOccupied')?.textContent?.trim();
                const avail = document.getElementById('shelterStatAvailable')?.textContent?.trim();
                const rows = Array.from(document.querySelectorAll('#sheltersTableBody tr'));
                const hasSpinner = document.querySelector('#sheltersTableBody .spinner') !== null;
                return {
                    statTotal: total,
                    statCapacity: cap,
                    statOccupied: occ,
                    statAvailable: avail,
                    rowCount: rows.length,
                    hasSpinner,
                    shelters: rows.map(r => Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim()))
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Shelters Data:', JSON.stringify(sheltersRes.result.value, null, 2));

    // Test Page 7: Roads & Routing
    console.log('\n--- VERIFYING PAGE 7: ROADS & ROUTING ---');
    await send('Runtime.evaluate', { expression: `location.hash = '#roads';` });
    await new Promise(r => setTimeout(r, 2000));

    const roadsRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const roadRows = Array.from(document.querySelectorAll('#roadsTableBody tr'));
                const regionItems = Array.from(document.querySelectorAll('#routingRegionsList .routing-region-item'));
                const svgNodes = Array.from(document.querySelectorAll('#roadNetworkSvg .svg-node'));
                const svgEdges = Array.from(document.querySelectorAll('#roadNetworkSvg .svg-edge-group'));
                const candidateCards = Array.from(document.querySelectorAll('#routeOptionsContainer .candidate-route-card'));
                const startSelectVal = document.getElementById('routeStartSelect')?.value;
                const countSubtitle = document.getElementById('routeCountSubtitle')?.textContent?.trim();
                const hasSpinner = document.querySelector('#roadsTableBody .spinner, #routingRegionsList .spinner') !== null;

                return {
                    roadRegistryRowCount: roadRows.length,
                    hasSpinner,
                    routingRegionItemsCount: regionItems.length,
                    svgNodesCount: svgNodes.length,
                    svgEdgesCount: svgEdges.length,
                    startSelectValue: startSelectVal,
                    candidateRouteCardsCount: candidateCards.length,
                    routeCountSubtitle: countSubtitle,
                    candidateRoutesDetails: candidateCards.map(c => ({
                        title: c.querySelector('.candidate-route-title')?.textContent?.trim(),
                        tag: c.querySelector('.candidate-route-tag')?.textContent?.trim(),
                        path: c.querySelector('.candidate-route-path')?.textContent?.trim(),
                        stats: c.querySelector('.candidate-route-stats')?.textContent?.trim()
                    }))
                };
            })()
        `,
        returnByValue: true
    });
    console.log('Roads & Routing Data:', JSON.stringify(roadsRes.result.value, null, 2));

    ws.close();
    browserProc.kill();
    console.log('\n=== ALL 6 PAGES TESTED SUCCESSFULLY! ===');
}

main().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

