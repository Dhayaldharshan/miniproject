const http = require('http');
const https = require('https');
const { spawn, execSync } = require('child_process');

async function testBackendApi() {
    console.log('\n--- 1. Testing Backend REST API with Assistance Quantities ---');

    // Sign in as Public user first to obtain JWT token
    const authPayload = JSON.stringify({
        email: 'dharun@gmail.com',
        password: '123456',
        accountType: 'PUBLIC'
    });

    const authRes = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8080,
            path: '/api/auth/signin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(authPayload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(authPayload);
        req.end();
    });

    if (authRes.statusCode !== 200 || !authRes.body.token) {
        throw new Error(`Auth failed: status ${authRes.statusCode}, body: ${JSON.stringify(authRes.body)}`);
    }

    const token = authRes.body.token;
    console.log(`Public user authenticated successfully. Role: ${authRes.body.role}`);

    const timestamp = Date.now();
    const testRegionName = `Public Sector Quantities ${timestamp}`;

    const payload = JSON.stringify({
        regionName: testRegionName,
        disasterType: 'Flood',
        severity: 4,
        population: 500,
        accessible: true,
        description: 'Verification of required assistance dynamic quantities',
        requiredAssistance: ['FOOD', 'MEDICAL', 'TEAMS', 'SHELTERS'],
        foodQuantity: 150,
        medicineQuantity: 80,
        rescueTeamsQuantity: 3,
        shelterPeopleQuantity: 200
    });

    const res = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8080,
            path: '/api/regions/public-report',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });

    console.log(`Backend Response HTTP Status: ${res.statusCode}`);
    console.log('Response Body:', res.body);

    if (res.statusCode !== 201) {
        throw new Error(`Expected HTTP 201, got ${res.statusCode}`);
    }

    const { regionId, foodQuantity, medicineQuantity, rescueTeamsQuantity, shelterPeopleQuantity, supplyRequestId, rescueRequestId } = res.body;

    if (foodQuantity !== 150 || medicineQuantity !== 80 || rescueTeamsQuantity !== 3 || shelterPeopleQuantity !== 200) {
        throw new Error(`Returned quantities do not match input: ${JSON.stringify(res.body)}`);
    }

    console.log(`Region #${regionId} created with SupplyReq #${supplyRequestId} and RescueReq #${rescueRequestId}`);

    // Verify in MariaDB directly
    const mysqlOutput = execSync(
        `& "C:\\xampp\\mysql\\bin\\mysql.exe" -u root resq_allocate -e "SELECT request_id, request_type, status, food_required, food_allocated, medicine_required, medicine_allocated, teams_required, people_to_rescue FROM relief_requests WHERE request_id IN (${supplyRequestId}, ${rescueRequestId});"`,
        { shell: 'powershell.exe', encoding: 'utf8' }
    );
    console.log('\nMariaDB relief_requests verification:\n' + mysqlOutput);

    if (!mysqlOutput.includes('150') || !mysqlOutput.includes('80') || !mysqlOutput.includes('3') || !mysqlOutput.includes('200')) {
        throw new Error('Database records do not contain expected quantities!');
    }
    if (!mysqlOutput.includes('WAITING')) {
        throw new Error('Expected status WAITING for new requests!');
    }
    console.log('API and MariaDB verification PASSED!');
    return { regionId, testRegionName };
}

// 2. CDP Browser Test using native WebSocket
function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

let cdpRequestId = 1;
const cdpCallbacks = new Map();

function sendCdp(ws, method, params = {}) {
    const id = cdpRequestId++;
    return new Promise((resolve, reject) => {
        cdpCallbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });
}

async function evalJs(ws, expression) {
    const res = await sendCdp(ws, 'Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
    });
    if (res.exceptionDetails) {
        throw new Error(`CDP JS Eval Error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
}

async function testFrontendUI() {
    console.log('\n--- 2. Testing Frontend UI with Chrome CDP ---');
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const cdpPort = 9445;
    const chromeProc = spawn(chromePath, [
        `--remote-debugging-port=${cdpPort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-quantities-' + Date.now(),
        'http://127.0.0.1:5500/#signin'
    ]);

    try {
        await wait(2500);

        // Get WebSocket Debugger URL
        const versionData = await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${cdpPort}/json/list`, res => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => resolve(JSON.parse(d)));
            }).on('error', reject);
        });

        const pageTarget = versionData.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No page target found');

        const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.id && cdpCallbacks.has(msg.id)) {
                    const { resolve, reject } = cdpCallbacks.get(msg.id);
                    cdpCallbacks.delete(msg.id);
                    if (msg.error) reject(msg.error);
                    else resolve(msg.result);
                }
            } catch (e) {}
        };

        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });

        await sendCdp(ws, 'Page.enable');
        await sendCdp(ws, 'Runtime.enable');

        console.log('Connected to Chrome CDP. Signing in as Public user...');

        // Perform Sign In as Public user
        await evalJs(ws, `
            document.getElementById('authSignInEmail').value = 'dharun@gmail.com';
            document.getElementById('authSignInPassword').value = '123456';
            document.getElementById('authSignInAccountType').value = 'PUBLIC';
            document.getElementById('authSignInForm').dispatchEvent(new Event('submit', { cancelable: true }));
        `);

        await wait(2000);

        const currentRole = await evalJs(ws, `window.ResqState ? window.ResqState.currentUser?.role : null`);
        console.log('Logged in user role:', currentRole);

        const publicViewVisible = await evalJs(ws, `
            const v = document.getElementById('view-public-report');
            v && window.getComputedStyle(v).display !== 'none'
        `);
        console.log('Public Emergency Incident Report form visible:', publicViewVisible);

        // Test initial state of quantity containers (all should be hidden)
        const initialStates = await evalJs(ws, `
            ({
                foodCheck: document.getElementById('assistFoodCheck').checked,
                foodContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerFood')).display,
                medCheck: document.getElementById('assistMedCheck').checked,
                medContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerMed')).display,
                teamsCheck: document.getElementById('assistTeamsCheck').checked,
                teamsContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerTeams')).display,
                sheltersCheck: document.getElementById('assistSheltersCheck').checked,
                sheltersContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerShelters')).display
            })
        `);
        console.log('Initial checkboxes & container displays:', initialStates);

        if (initialStates.foodContainerDisplay !== 'none' || initialStates.medContainerDisplay !== 'none' ||
            initialStates.teamsContainerDisplay !== 'none' || initialStates.sheltersContainerDisplay !== 'none') {
            throw new Error('Quantity containers should be hidden by default!');
        }

        // Test Click on Food card
        console.log('Checking Food Relief Kits card...');
        await evalJs(ws, `
            document.getElementById('assistFoodCheck').click();
        `);
        await wait(200);

        const afterFoodCheck = await evalJs(ws, `
            ({
                foodChecked: document.getElementById('assistFoodCheck').checked,
                foodDisplay: window.getComputedStyle(document.getElementById('qtyContainerFood')).display,
                medDisplay: window.getComputedStyle(document.getElementById('qtyContainerMed')).display
            })
        `);
        console.log('After checking Food:', afterFoodCheck);

        if (!afterFoodCheck.foodChecked || afterFoodCheck.foodDisplay === 'none') {
            throw new Error('Food quantity container should be visible when Food is checked!');
        }
        if (afterFoodCheck.medDisplay !== 'none') {
            throw new Error('Medical container should stay hidden!');
        }

        // Test Click on Rescue Teams card
        console.log('Checking Rescue Teams card...');
        await evalJs(ws, `
            document.getElementById('assistTeamsCheck').click();
        `);
        await wait(200);

        const afterTeamsCheck = await evalJs(ws, `
            ({
                teamsChecked: document.getElementById('assistTeamsCheck').checked,
                teamsDisplay: window.getComputedStyle(document.getElementById('qtyContainerTeams')).display
            })
        `);
        console.log('After checking Rescue Teams:', afterTeamsCheck);
        if (!afterTeamsCheck.teamsChecked || afterTeamsCheck.teamsDisplay === 'none') {
            throw new Error('Rescue teams quantity container should be visible when Teams is checked!');
        }

        // Test Uncheck Food card -> should immediately hide container and reset value
        console.log('Unchecking Food card...');
        await evalJs(ws, `
            document.getElementById('qtyFoodInput').value = '999';
            document.getElementById('assistFoodCheck').click();
        `);
        await wait(200);

        const afterFoodUncheck = await evalJs(ws, `
            ({
                foodChecked: document.getElementById('assistFoodCheck').checked,
                foodDisplay: window.getComputedStyle(document.getElementById('qtyContainerFood')).display,
                foodValue: document.getElementById('qtyFoodInput').value
            })
        `);
        console.log('After unchecking Food:', afterFoodUncheck);
        if (afterFoodUncheck.foodChecked || afterFoodUncheck.foodDisplay !== 'none' || afterFoodUncheck.foodValue !== '') {
            throw new Error('Food container should be hidden and input cleared when unchecked!');
        }

        // Check Food and Medical
        console.log('Selecting Food and Medical...');
        await evalJs(ws, `
            document.getElementById('assistFoodCheck').click();
            document.getElementById('assistMedCheck').click();
        `);
        await wait(200);

        // Test validation: submit with empty quantities
        console.log('Testing validation: submitting with blank quantities...');
        await evalJs(ws, `
            document.getElementById('publicRegionName').value = 'UI Test Sector ' + Date.now();
            document.getElementById('publicReportForm').dispatchEvent(new Event('submit', { cancelable: true }));
        `);
        await wait(300);

        const validationErrors = await evalJs(ws, `
            ({
                errorFoodDisplay: window.getComputedStyle(document.getElementById('errorQtyFood')).display,
                errorFoodText: document.getElementById('errorQtyFood').textContent,
                errorMedDisplay: window.getComputedStyle(document.getElementById('errorQtyMed')).display,
                errorTeamsDisplay: window.getComputedStyle(document.getElementById('errorQtyTeams')).display,
                successDisplay: window.getComputedStyle(document.getElementById('publicReportSuccessBox')).display
            })
        `);
        console.log('Validation errors state:', validationErrors);

        if (validationErrors.errorFoodDisplay === 'none' || validationErrors.successDisplay !== 'none') {
            throw new Error('Validation should have blocked submission with missing quantities!');
        }
        console.log('Validation correctly blocked submission and displayed error messages!');

        // Now enter valid positive numbers for all 4 resources
        console.log('Selecting all 4 resources and entering positive whole quantities...');
        await evalJs(ws, `
            if (!document.getElementById('assistFoodCheck').checked) document.getElementById('assistFoodCheck').click();
            if (!document.getElementById('assistMedCheck').checked) document.getElementById('assistMedCheck').click();
            if (!document.getElementById('assistTeamsCheck').checked) document.getElementById('assistTeamsCheck').click();
            if (!document.getElementById('assistSheltersCheck').checked) document.getElementById('assistSheltersCheck').click();

            document.getElementById('qtyFoodInput').value = '175';
            document.getElementById('qtyMedInput').value = '95';
            document.getElementById('qtyTeamsInput').value = '4';
            document.getElementById('qtySheltersInput').value = '250';
        `);
        await wait(200);

        // Submit form
        console.log('Submitting emergency incident report...');
        await evalJs(ws, `
            document.getElementById('publicReportForm').dispatchEvent(new Event('submit', { cancelable: true }));
        `);

        await wait(2500);

        const submitResult = await evalJs(ws, `
            ({
                successDisplay: window.getComputedStyle(document.getElementById('publicReportSuccessBox')).display,
                successDetails: document.getElementById('publicSuccessDetails').innerText,
                foodChecked: document.getElementById('assistFoodCheck').checked,
                foodContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerFood')).display,
                medContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerMed')).display,
                teamsContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerTeams')).display,
                sheltersContainerDisplay: window.getComputedStyle(document.getElementById('qtyContainerShelters')).display
            })
        `);
        console.log('Submission result:', submitResult);

        if (submitResult.successDisplay === 'none') {
            throw new Error('Success banner was not displayed after submission!');
        }
        if (!submitResult.successDetails.includes('175') || !submitResult.successDetails.includes('95') ||
            !submitResult.successDetails.includes('4') || !submitResult.successDetails.includes('250')) {
            throw new Error(`Success details do not include exact submitted quantities: ${submitResult.successDetails}`);
        }
        if (submitResult.foodChecked || submitResult.foodContainerDisplay !== 'none') {
            throw new Error('Form should be reset and containers hidden after submission!');
        }

        console.log('\n--- ALL UI AND INTERACTION TESTS PASSED SUCCESSFULLY! ---');
        ws.close();
    } finally {
        try { chromeProc.kill(); } catch (e) {}
    }
}

async function runAll() {
    try {
        await testBackendApi();
        await testFrontendUI();
        console.log('\n======================================================');
        console.log(' ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
        console.log('======================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('\nVerification failed:', err);
        process.exit(1);
    }
}

runAll();
