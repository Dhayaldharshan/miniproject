const { spawn } = require('child_process');
const http = require('http');

async function main() {
    console.log('====================================================');
    console.log(' RESQ-ALLOCATE PUBLIC PANEL END-TO-END VERIFICATION');
    console.log('====================================================\n');

    console.log('Launching headless Chrome on debugging port 9444...');
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9444',
        '--user-data-dir=' + __dirname + '\\chrome-test-public-profile',
        'about:blank'
    ]);

    await new Promise(r => setTimeout(r, 1500));

    try {
        const jsonList = await new Promise((resolve, reject) => {
            http.get('http://127.0.0.1:9444/json', res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        const target = jsonList.find(t => t.type === 'page');
        if (!target || !target.webSocketDebuggerUrl) {
            throw new Error('No page target found');
        }

        console.log('Connecting to WebSocket debugger...');
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        let id = 1;
        const pending = new Map();

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === 'Runtime.consoleAPICalled') {
                console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
            }
            if (msg.method === 'Runtime.exceptionThrown') {
                console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
            }
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

        await send('Runtime.enable');

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

        // 1. Sign In as Public User (dharun@gmail.com)
        console.log('1. Signing in as Public User (dharun@gmail.com)...');
        await evalJs(`
            document.getElementById('authSignInEmail').value = 'dharun@gmail.com';
            document.getElementById('authSignInAccountType').value = 'PUBLIC';
            document.getElementById('authSignInPassword').value = 'dharun123';
            document.getElementById('authSignInForm').requestSubmit();
        `);
        await new Promise(r => setTimeout(r, 2000));

        const authState = await evalJs(`({
            authDisplay: document.getElementById('authScreen')?.style.display,
            authAlert: document.getElementById('authAlertMessage')?.textContent,
            authAlertDisplay: document.getElementById('authAlertMessage')?.style.display,
            dashboardDisplay: document.getElementById('dashboardScreen')?.style.display,
            dashboardClass: document.getElementById('dashboardScreen')?.className,
            currentUser: window.resqState ? window.resqState.currentUser : 'no-resqState'
        })`);
        console.log('Auth Screen State:', authState);

        // 2. Verify View Visibility and Title
        const docTitle = await evalJs(`document.title`);
        const pageTitle = await evalJs(`document.getElementById('currentPageTitle')?.textContent`);
        const breadcrumb = await evalJs(`document.getElementById('currentBreadcrumb')?.textContent`);
        const publicViewActive = await evalJs(`document.getElementById('view-public-report')?.classList.contains('active')`);
        const publicViewDisplay = await evalJs(`window.getComputedStyle(document.getElementById('view-public-report')).display`);

        console.log('\n--- Public Panel View State ---');
        console.log('Document title:               ', docTitle);
        console.log('Header Page Title:            ', pageTitle);
        console.log('Breadcrumb:                   ', breadcrumb);
        console.log('Public Report View Active:    ', publicViewActive);
        console.log('Public Report View Display:   ', publicViewDisplay);

        // 3. Verify Removal of Admin/Coordinator Panels from Public Panel
        console.log('\n--- Verifying Removed Panels (Must all be none / hidden) ---');
        const removedPanels = await evalJs(`({
            dashboardView: window.getComputedStyle(document.getElementById('view-dashboard')).display,
            regionsView: window.getComputedStyle(document.getElementById('view-regions')).display,
            requestsView: window.getComputedStyle(document.getElementById('view-requests')).display,
            inventoryView: window.getComputedStyle(document.getElementById('view-inventory')).display,
            teamsView: window.getComputedStyle(document.getElementById('view-teams')).display,
            sheltersView: window.getComputedStyle(document.getElementById('view-shelters')).display,
            roadsView: window.getComputedStyle(document.getElementById('view-roads')).display,
            adminNavLinks: Array.from(document.querySelectorAll('.admin-coordinator-only-nav, .coordinator-only-nav'))
                .map(el => window.getComputedStyle(el).display),
            publicNavLink: window.getComputedStyle(document.querySelector('.public-only-nav')).display
        })`);

        console.log('view-dashboard display:       ', removedPanels.dashboardView, '(expected: none)');
        console.log('view-regions display:         ', removedPanels.regionsView, '(expected: none)');
        console.log('view-requests display:        ', removedPanels.requestsView, '(expected: none)');
        console.log('view-inventory display:       ', removedPanels.inventoryView, '(expected: none)');
        console.log('view-teams display:           ', removedPanels.teamsView, '(expected: none)');
        console.log('view-shelters display:        ', removedPanels.sheltersView, '(expected: none)');
        console.log('view-roads display:           ', removedPanels.roadsView, '(expected: none)');
        const navLinkDetails = await evalJs(`
            Array.from(document.querySelectorAll('.sidebar-nav .nav-link')).map(el => ({
                href: el.getAttribute('href'),
                text: el.textContent.trim(),
                className: el.className,
                display: window.getComputedStyle(el).display
            }))
        `);
        console.log('Nav Links in Sidebar:');
        navLinkDetails.forEach(l => console.log('  ', l.href, '-> display:', l.display, '| class:', l.className));
        console.log('Public Only Nav Link visible: ', removedPanels.publicNavLink, '(expected: flex or block)');

        // 4. Verify Form Elements are the ONLY elements present
        console.log('\n--- Verifying 8 Required Form Elements ---');
        const formFields = await evalJs(`({
            regionName: !!document.getElementById('publicRegionName'),
            disasterType: !!document.getElementById('publicDisasterType'),
            severity: !!document.getElementById('publicSeverity'),
            population: !!document.getElementById('publicPopulation'),
            accessibility: !!document.getElementById('publicAccessibility'),
            description: !!document.getElementById('publicDescription'),
            assistanceCheckboxes: document.querySelectorAll('input[name="publicAssistance"]').length,
            submitBtn: !!document.getElementById('publicSubmitBtn')
        })`);

        console.log('1. Affected Region Name Input:   ', formFields.regionName);
        console.log('2. Disaster Type Select:         ', formFields.disasterType);
        console.log('3. Severity Level Select:        ', formFields.severity);
        console.log('4. Affected Population Input:    ', formFields.population);
        console.log('5. Road Accessibility Select:    ', formFields.accessibility);
        console.log('6. Short Description Textarea:   ', formFields.description);
        console.log('7. Required Assistance Count:    ', formFields.assistanceCheckboxes, '(expected: 4)');
        console.log('8. Submit Report Button:         ', formFields.submitBtn);

        // 5. Test Submitting Emergency Incident Report
        console.log('\n5. Submitting Emergency Incident Report for unique test region...');
        const regionName = 'Malabar Coastal Sector ' + Date.now().toString().slice(-4);
        await evalJs(`
            document.getElementById('publicRegionName').value = '${regionName}';
            document.getElementById('publicDisasterType').value = 'Cyclone';
            document.getElementById('publicSeverity').value = '5';
            document.getElementById('publicPopulation').value = '600';
            document.getElementById('publicAccessibility').value = 'false';
            document.getElementById('publicDescription').value = 'Severe storm surge and flash flooding. Coastal road blocked.';
            
            // Check Food, Medical, Teams
            document.querySelectorAll('input[name="publicAssistance"]').forEach(cb => {
                if (cb.value === 'FOOD' || cb.value === 'MEDICAL' || cb.value === 'TEAMS') {
                    cb.checked = true;
                }
            });

            document.getElementById('publicReportForm').requestSubmit();
        `);

        await new Promise(r => setTimeout(r, 2000));

        const submitResult = await evalJs(`({
            successDisplay: window.getComputedStyle(document.getElementById('publicReportSuccessBox')).display,
            successText: document.getElementById('publicSuccessDetails')?.textContent,
            errorDisplay: window.getComputedStyle(document.getElementById('publicReportErrorBox')).display,
            errorText: document.getElementById('publicReportErrorMessage')?.textContent,
            btnText: document.getElementById('publicSubmitBtnText')?.textContent,
            btnDisabled: document.getElementById('publicSubmitBtn')?.disabled
        })`);

        console.log('Submit Result:', submitResult);

        ws.close();
    } finally {
        chrome.kill();
        console.log('\nHeadless Chrome process closed.');
    }
}

main().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
