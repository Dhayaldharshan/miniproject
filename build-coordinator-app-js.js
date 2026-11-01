const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'frontend', 'app.js');
const rootAppPath = path.join(__dirname, '..', 'app.js');

let content = fs.readFileSync(appPath, 'utf8');

// 1. ADD ELEMENTS TO elements OBJECT
const targetEl = `        errorQtyShelters: document.getElementById('errorQtyShelters'),`;
const newElements = `        errorQtyShelters: document.getElementById('errorQtyShelters'),

        // Coordinator Dashboard Telemetry Elements
        coordStatHighSev: document.getElementById('coordStatHighSev'),
        coordStatPendingReqs: document.getElementById('coordStatPendingReqs'),
        coordStatTeamsStatus: document.getElementById('coordStatTeamsStatus'),
        coordStatShelterUsage: document.getElementById('coordStatShelterUsage'),
        coordRecentReportsBody: document.getElementById('coordRecentReportsBody'),
        btnRefreshCoordDashboard: document.getElementById('btnRefreshCoordDashboard'),

        // Resource Allocation Elements
        allocStockFood: document.getElementById('allocStockFood'),
        allocStockMed: document.getElementById('allocStockMed'),
        allocTotalDispatched: document.getElementById('allocTotalDispatched'),
        allocTotalDeficit: document.getElementById('allocTotalDeficit'),
        directAllocationForm: document.getElementById('directAllocationForm'),
        allocRegionSelect: document.getElementById('allocRegionSelect'),
        allocRegionDemandBox: document.getElementById('allocRegionDemandBox'),
        allocDemandTitle: document.getElementById('allocDemandTitle'),
        allocDemandDetails: document.getElementById('allocDemandDetails'),
        allocFoodInput: document.getElementById('allocFoodInput'),
        allocMedInput: document.getElementById('allocMedInput'),
        allocFoodHint: document.getElementById('allocFoodHint'),
        allocMedHint: document.getElementById('allocMedHint'),
        allocErrorBox: document.getElementById('allocErrorBox'),
        allocSubmitBtn: document.getElementById('allocSubmitBtn'),
        allocSubmitBtnText: document.getElementById('allocSubmitBtnText'),
        allocQueueSupplyCount: document.getElementById('allocQueueSupplyCount'),
        allocQueueRescueCount: document.getElementById('allocQueueRescueCount'),
        allocSearchInput: document.getElementById('allocSearchInput'),
        allocationTableBody: document.getElementById('allocationTableBody'),

        // Team Deployment Elements
        assignTeamForm: document.getElementById('assignTeamForm'),
        assignTeamSelect: document.getElementById('assignTeamSelect'),
        assignRegionSelect: document.getElementById('assignRegionSelect'),
        assignTeamErrorBox: document.getElementById('assignTeamErrorBox'),
        btnAssignTeamSubmit: document.getElementById('btnAssignTeamSubmit'),

        // Response Monitoring Elements
        monStatRegions: document.getElementById('monStatRegions'),
        monStatPending: document.getElementById('monStatPending'),
        monStatTeams: document.getElementById('monStatTeams'),
        monStatTeamsSub: document.getElementById('monStatTeamsSub'),
        monStatShelter: document.getElementById('monStatShelter'),
        monStatShelterSub: document.getElementById('monStatShelterSub'),
        monLastUpdated: document.getElementById('monLastUpdated'),
        btnRefreshMonitoring: document.getElementById('btnRefreshMonitoring'),
        tabMonPending: document.getElementById('tabMonPending'),
        tabMonAllocations: document.getElementById('tabMonAllocations'),
        tabMonTeams: document.getElementById('tabMonTeams'),
        tabMonShelters: document.getElementById('tabMonShelters'),
        monTabContentPending: document.getElementById('monTabContentPending'),
        monTabContentAllocations: document.getElementById('monTabContentAllocations'),
        monTabContentTeams: document.getElementById('monTabContentTeams'),
        monTabContentShelters: document.getElementById('monTabContentShelters'),
        monPendingTableBody: document.getElementById('monPendingTableBody'),
        monAllocationsTableBody: document.getElementById('monAllocationsTableBody'),
        monTeamsTableBody: document.getElementById('monTeamsTableBody'),
        monSheltersTableBody: document.getElementById('monSheltersTableBody'),`;

if (!content.includes(targetEl)) {
    console.error('Target elements in app.js not found');
    process.exit(1);
}
content = content.replace(targetEl, newElements);

// 2. UPDATE showDashboardScreen TO CUSTOMIZE FOR COORDINATOR
const targetShowDash = `        if (user.role === 'PUBLIC') {
            document.title = 'ResQ-Allocate | Public Incident Report';
            navigateTo('public-report');
        } else {
            document.title = 'ResQ-Allocate | Emergency Command & Control Center';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        }`;

const newShowDash = `        if (user.role === 'PUBLIC') {
            document.title = 'ResQ-Allocate | Public Incident Report';
            navigateTo('public-report');
        } else if (user.role === 'COORDINATOR') {
            document.title = 'ResQ-Allocate | Disaster Response Coordinator Panel';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        } else {
            document.title = 'ResQ-Allocate | Admin Operations Center';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        }`;

content = content.replace(targetShowDash, newShowDash);

// 3. UPDATE viewTitles IN navigateTo
const targetViewTitles = `        const viewTitles = {
            'public-report': { title: 'Emergency Incident Report', bc: 'ResQ-Allocate / EMERGENCY REPORT' },
            dashboard: { title: 'Emergency Dashboard', bc: 'ResQ-Allocate / OVERVIEW' },
            regions: { title: 'Affected Regions', bc: 'ResQ-Allocate / INCIDENT ZONES' },
            requests: { title: 'Priority Relief Requests', bc: 'ResQ-Allocate / EMERGENCY QUEUE' },
            inventory: { title: 'Resource Inventory', bc: 'ResQ-Allocate / SUPPLY CHAIN' },
            teams: { title: 'Rescue Teams & Missions', bc: 'ResQ-Allocate / FIELD OPERATIONS' },
            shelters: { title: 'Shelter Management', bc: 'ResQ-Allocate / EVACUATION SHELTERS' },
            roads: { title: 'Road Network & Route Analysis', bc: 'ResQ-Allocate / ROUTING LOGISTICS' }
        };`;

const newViewTitles = `        const viewTitles = {
            'public-report': { title: 'Emergency Incident Report', bc: 'ResQ-Allocate / EMERGENCY REPORT' },
            dashboard: {
                title: state.currentUser?.role === 'COORDINATOR' ? 'Coordinator Operations Dashboard' : 'Emergency Command Dashboard',
                bc: state.currentUser?.role === 'COORDINATOR' ? 'Coordinator Panel / OPERATIONAL OVERVIEW' : 'Admin Console / OVERVIEW'
            },
            regions: { title: 'Affected Regions Incident Roster', bc: 'ResQ-Allocate / INCIDENT ZONES' },
            requests: { title: 'Resource Allocation & Priority Queue', bc: 'ResQ-Allocate / RESOURCE ALLOCATION' },
            allocation: { title: 'Resource Allocation & Priority Queue', bc: 'ResQ-Allocate / RESOURCE ALLOCATION' },
            inventory: { title: 'Resource Inventory Breakdown', bc: 'ResQ-Allocate / SUPPLY CHAIN' },
            teams: { title: 'Rescue Team Management & Deployment', bc: 'ResQ-Allocate / FIELD OPERATIONS' },
            shelters: { title: 'Emergency Shelter Management', bc: 'ResQ-Allocate / EVACUATION SHELTERS' },
            roads: { title: 'Road Network & Route Analysis', bc: 'ResQ-Allocate / ROUTING LOGISTICS' },
            monitoring: { title: 'Response Monitoring Console', bc: 'ResQ-Allocate / RESPONSE MONITORING' }
        };`;

content = content.replace(targetViewTitles, newViewTitles);

// 4. UPDATE refreshCurrentViewData SWITCH CASES
const targetSwitch = `            switch (state.currentView) {
                case 'dashboard':
                    await loadDashboardData();
                    break;
                case 'regions':
                    await loadRegionsData();
                    break;
                case 'requests':
                    await loadRequestsData();
                    break;
                case 'inventory':
                    await loadInventoryData();
                    break;
                case 'teams':
                    await loadTeamsData();
                    break;
                case 'shelters':
                    await loadSheltersData();
                    break;
                case 'roads':
                    await loadRoadsData();
                    break;
            }`;

const newSwitch = `            switch (state.currentView) {
                case 'dashboard':
                    await loadDashboardData();
                    break;
                case 'regions':
                    await loadRegionsData();
                    break;
                case 'requests':
                case 'allocation':
                    await loadAllocationData();
                    break;
                case 'inventory':
                    await loadInventoryData();
                    break;
                case 'teams':
                    await loadTeamsData();
                    break;
                case 'shelters':
                    await loadSheltersData();
                    break;
                case 'roads':
                    await loadRoadsData();
                    break;
                case 'monitoring':
                    await loadMonitoringData();
                    break;
            }`;

content = content.replace(targetSwitch, newSwitch);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Step 1 app.js updates applied!');

