const fs = require('fs');

function updateAppJs(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add elements in DOM Elements Mapping
    const elementsMarker = 'views: document.querySelectorAll(\'.app-view\'),';
    const publicElements = `views: document.querySelectorAll('.app-view'),
        // Public Incident Reporting Form Elements
        publicReportView: document.getElementById('view-public-report'),
        publicReportForm: document.getElementById('publicReportForm'),
        publicRegionName: document.getElementById('publicRegionName'),
        publicDisasterType: document.getElementById('publicDisasterType'),
        publicSeverity: document.getElementById('publicSeverity'),
        publicPopulation: document.getElementById('publicPopulation'),
        publicAccessibility: document.getElementById('publicAccessibility'),
        publicDescription: document.getElementById('publicDescription'),
        publicSubmitBtn: document.getElementById('publicSubmitBtn'),
        publicSubmitBtnText: document.getElementById('publicSubmitBtnText'),
        publicReportSuccessBox: document.getElementById('publicReportSuccessBox'),
        publicSuccessDetails: document.getElementById('publicSuccessDetails'),
        publicReportNewBtn: document.getElementById('publicReportNewBtn'),
        publicReportErrorBox: document.getElementById('publicReportErrorBox'),
        publicReportErrorMessage: document.getElementById('publicReportErrorMessage'),
        errorPublicRegionName: document.getElementById('errorPublicRegionName'),`;

    if (!content.includes('publicReportForm:')) {
        content = content.replace(elementsMarker, publicElements);
        console.log(`Added public report elements to ${filePath}`);
    }

    // 2. Update showDashboardScreen navigation for PUBLIC
    const oldShowDashRegex = /if \(user\.role === 'PUBLIC'\) \{\s*document\.title = 'ResQ-Allocate \| Public Community Panel';\s*\} else \{\s*document\.title = 'ResQ-Allocate \| Emergency Command & Control Center';\s*\}[\s\S]*?navigateTo\(activeHash === 'signin' \|\| activeHash === 'signup' \? 'dashboard' : activeHash\);/;
    const newShowDash = `if (user.role === 'PUBLIC') {
            document.title = 'ResQ-Allocate | Public Incident Report';
            navigateTo('public-report');
        } else {
            document.title = 'ResQ-Allocate | Emergency Command & Control Center';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        }`;

    content = content.replace(oldShowDashRegex, newShowDash);
    console.log(`Updated showDashboardScreen in ${filePath}`);

    // 3. Update navigateTo view router
    const oldNavigateRegex = /function navigateTo\(viewId\) \{\s*\/\/ Enforce authentication gate: do not show views if unauthenticated\s*if \(!state\.currentUser\) \{\s*showAuthScreen\(\);\s*return;\s*\}\s*state\.currentView = viewId;/;
    const newNavigate = `function navigateTo(viewId) {
        // Enforce authentication gate: do not show views if unauthenticated
        if (!state.currentUser) {
            showAuthScreen();
            return;
        }

        // Restrict Public users strictly to the Public Emergency Reporting Form
        if (state.currentUser.role === 'PUBLIC') {
            viewId = 'public-report';
        } else if (viewId === 'public-report') {
            viewId = 'dashboard';
        }

        state.currentView = viewId;`;

    content = content.replace(oldNavigateRegex, newNavigate);

    // 4. Update viewTitles in navigateTo
    const oldTitlesRegex = /const isPublicUser = state\.currentUser && state\.currentUser\.role === 'PUBLIC';\s*const viewTitles = \{[\s\S]*?roads: \{ title: 'Road Network & Route Analysis', bc: 'ResQ-Allocate \/ ROUTING LOGISTICS' \}\s*\};/;
    const newTitles = `const viewTitles = {
            'public-report': { title: 'Emergency Incident Report', bc: 'ResQ-Allocate / EMERGENCY REPORT' },
            dashboard: { title: 'Emergency Dashboard', bc: 'ResQ-Allocate / OVERVIEW' },
            regions: { title: 'Affected Regions', bc: 'ResQ-Allocate / INCIDENT ZONES' },
            requests: { title: 'Priority Relief Requests', bc: 'ResQ-Allocate / EMERGENCY QUEUE' },
            inventory: { title: 'Resource Inventory', bc: 'ResQ-Allocate / SUPPLY CHAIN' },
            teams: { title: 'Rescue Teams & Missions', bc: 'ResQ-Allocate / FIELD OPERATIONS' },
            shelters: { title: 'Shelter Management', bc: 'ResQ-Allocate / EVACUATION SHELTERS' },
            roads: { title: 'Road Network & Route Analysis', bc: 'ResQ-Allocate / ROUTING LOGISTICS' }
        };`;

    content = content.replace(oldTitlesRegex, newTitles);
    console.log(`Updated viewTitles in ${filePath}`);

    // 5. Skip refreshCurrentViewData if in public-report
    const oldRefreshStart = 'function refreshCurrentViewData() {';
    const newRefreshStart = `function refreshCurrentViewData() {
        if (state.currentView === 'public-report') return;`;
    if (!content.includes("if (state.currentView === 'public-report') return;")) {
        content = content.replace(oldRefreshStart, newRefreshStart);
        console.log(`Updated refreshCurrentViewData in ${filePath}`);
    }

    // 6. Update hashchange event listener
    const oldHashchangeRegex = /window\.addEventListener\('hashchange', \(\) => \{\s*if \(!state\.currentUser\) \{\s*showAuthScreen\(\);\s*return;\s*\}\s*const hash = window\.location\.hash\.replace\('#', ''\) \|\| 'dashboard';\s*navigateTo\(hash\);\s*\}\);/;
    const newHashchange = `window.addEventListener('hashchange', () => {
        if (!state.currentUser) {
            showAuthScreen();
            return;
        }
        if (state.currentUser.role === 'PUBLIC') {
            navigateTo('public-report');
            return;
        }
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        navigateTo(hash);
    });`;
    content = content.replace(oldHashchangeRegex, newHashchange);

    // 7. Add Public Report Form event listeners at the end of setup
    const formListenersCode = `
    // ==========================================================================
    // PUBLIC EMERGENCY INCIDENT REPORT FORM SUBMISSION
    // ==========================================================================
    if (elements.publicReportForm) {
        elements.publicReportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.publicReportErrorBox) elements.publicReportErrorBox.style.display = 'none';
            if (elements.publicReportSuccessBox) elements.publicReportSuccessBox.style.display = 'none';
            if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'none';

            const regionName = elements.publicRegionName ? elements.publicRegionName.value.trim() : '';
            if (!regionName) {
                if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'block';
                if (elements.publicRegionName) elements.publicRegionName.focus();
                return;
            }

            const disasterType = elements.publicDisasterType ? elements.publicDisasterType.value : 'Flood';
            const severity = elements.publicSeverity ? parseInt(elements.publicSeverity.value, 10) : 3;
            const population = (elements.publicPopulation && elements.publicPopulation.value.trim() !== '') 
                ? parseInt(elements.publicPopulation.value.trim(), 10) : 0;
            const accessible = elements.publicAccessibility ? (elements.publicAccessibility.value === 'true') : true;
            const description = elements.publicDescription ? elements.publicDescription.value.trim() : '';

            // Collect selected assistance checkboxes
            const assistance = [];
            const checkboxes = elements.publicReportForm.querySelectorAll('input[name="publicAssistance"]:checked');
            checkboxes.forEach(cb => assistance.push(cb.value));

            // Loading state
            if (elements.publicSubmitBtnText) {
                elements.publicSubmitBtnText.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span> Submitting Report...';
            }
            if (elements.publicSubmitBtn) elements.publicSubmitBtn.disabled = true;

            try {
                const response = await ResqApi.submitPublicReport({
                    regionName,
                    disasterType,
                    severity,
                    population,
                    accessible,
                    description,
                    requiredAssistance: assistance
                });

                // Show success only after backend confirms successful saving
                if (elements.publicReportSuccessBox) {
                    const assistanceNames = {
                        FOOD: 'Food Relief Kits',
                        MEDICAL: 'Medical Relief Kits',
                        TEAMS: 'Rescue Teams',
                        SHELTERS: 'Shelters'
                    };
                    const selectedLabels = assistance.map(k => assistanceNames[k] || k).join(', ') || 'General Monitoring (No immediate supplies)';
                    const details = '<strong>Assigned Region #' + response.regionId + ':</strong> ' + escapeHtml(response.regionName) +
                        ' | <strong>Disaster:</strong> ' + escapeHtml(response.disasterType || disasterType) +
                        ' | <strong>Severity Level:</strong> ' + response.severity + '/5' +
                        ' | <strong>Road Access:</strong> ' + (response.accessible ? 'Open' : 'Blocked') +
                        ' | <strong>Required Assistance:</strong> ' + escapeHtml(selectedLabels) +
                        '. Field Coordinators & Incident Command have received this alert.';
                    
                    if (elements.publicSuccessDetails) {
                        elements.publicSuccessDetails.innerHTML = details;
                    }
                    elements.publicReportSuccessBox.style.display = 'flex';
                }

                // Reset form
                elements.publicReportForm.reset();
                if (elements.publicDisasterType) elements.publicDisasterType.value = 'Flood';
                if (elements.publicSeverity) elements.publicSeverity.value = '4';
                if (elements.publicAccessibility) elements.publicAccessibility.value = 'true';

                showToast('Emergency incident report #' + response.regionId + ' submitted successfully.');
            } catch (err) {
                console.error('Failed to submit public report:', err);
                if (elements.publicReportErrorBox) {
                    if (elements.publicReportErrorMessage) {
                        elements.publicReportErrorMessage.textContent = err.message === 'BACKEND_OFFLINE'
                            ? 'Unable to submit report: Backend service is currently offline. Please ensure the server is running on port 8080.'
                            : (err.message || 'Failed to submit report. Please check input parameters and try again.');
                    }
                    elements.publicReportErrorBox.style.display = 'flex';
                }
            } finally {
                if (elements.publicSubmitBtnText) {
                    elements.publicSubmitBtnText.textContent = 'Submit Emergency Report';
                }
                if (elements.publicSubmitBtn) elements.publicSubmitBtn.disabled = false;
            }
        });
    }

    if (elements.publicReportNewBtn) {
        elements.publicReportNewBtn.addEventListener('click', () => {
            if (elements.publicReportSuccessBox) elements.publicReportSuccessBox.style.display = 'none';
            if (elements.publicRegionName) elements.publicRegionName.focus();
        });
    }

    if (elements.publicRegionName) {
        elements.publicRegionName.addEventListener('input', () => {
            if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'none';
        });
    }
`;

    if (!content.includes('PUBLIC EMERGENCY INCIDENT REPORT FORM SUBMISSION')) {
        const initEndMarker = 'init();\n})();';
        const initEndMarkerCRLF = 'init();\r\n})();';
        if (content.includes(initEndMarkerCRLF)) {
            content = content.replace(initEndMarkerCRLF, formListenersCode + '\r\n    ' + initEndMarkerCRLF);
        } else if (content.includes(initEndMarker)) {
            content = content.replace(initEndMarker, formListenersCode + '\n    ' + initEndMarker);
        }
        console.log(`Added form submit listeners to ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

updateAppJs('frontend/app.js');
updateAppJs('app.js');
console.log('app.js files updated successfully!');

