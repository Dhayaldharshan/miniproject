const fs = require('fs');
const path = require('path');

console.log('Building Coordinator Panel...');

// Paths
const htmlPath = path.join(__dirname, '..', 'frontend', 'index.html');
const rootHtmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'frontend', 'style.css');
const rootCssPath = path.join(__dirname, '..', 'style.css');
const appPath = path.join(__dirname, '..', 'frontend', 'app.js');
const rootAppPath = path.join(__dirname, '..', 'app.js');

let html = fs.readFileSync(htmlPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');
let app = fs.readFileSync(appPath, 'utf8');

// =========================================================================
// 1. UPDATE SIDEBAR NAVIGATION IN HTML
// =========================================================================
const navTargetRegex = /<nav class="sidebar-nav">[\s\S]*?<\/nav>/;
const newNav = `<nav class="sidebar-nav">
                <a href="#public-report" class="nav-link public-only-nav">
                    <span class="nav-icon">🚨</span>
                    <span>Emergency Incident Report</span>
                </a>
                <a href="#dashboard" class="nav-link admin-coordinator-only-nav active">
                    <span class="nav-icon">▦</span>
                    <span>Dashboard</span>
                </a>
                <a href="#regions" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">⌖</span>
                    <span>Affected Regions</span>
                </a>
                <a href="#inventory" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">📦</span>
                    <span>Resource Inventory</span>
                </a>
                <a href="#allocation" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">⚖️</span>
                    <span>Resource Allocation</span>
                </a>
                <a href="#teams" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">🚑</span>
                    <span>Rescue Team Management</span>
                </a>
                <a href="#shelters" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">🏠</span>
                    <span>Shelter Management</span>
                </a>
                <a href="#roads" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">🛣️</span>
                    <span>Roads & Routing</span>
                </a>
                <a href="#monitoring" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">📡</span>
                    <span>Response Monitoring</span>
                </a>
            </nav>`;

if (!navTargetRegex.test(html)) {
    console.error('Sidebar nav regex not matched in HTML');
    process.exit(1);
}
html = html.replace(navTargetRegex, newNav);

// =========================================================================
// 2. ENHANCE DASHBOARD VIEW IN HTML
// =========================================================================
const dashEndRegex = /<\/div>\s*<\/section>\s*<!-- =+ -->\s*<!-- 2\. AFFECTED REGIONS VIEW/m;
const coordDashboardHtml = `</div>

                    <!-- Coordinator Operational Command Section -->
                    <div class="coordinator-dashboard-section coordinator-only-action" style="margin-top: 24px;">
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-header-left">
                                    <h2 class="panel-title">Coordinator Operational Overview</h2>
                                    <p class="panel-subtitle">Comprehensive situational telemetry across regions, relief stock, rescue teams, and shelters</p>
                                </div>
                                <div class="panel-actions">
                                    <button type="button" class="btn btn-secondary btn-sm" id="btnRefreshCoordDashboard">
                                        ↻ Refresh Telemetry
                                    </button>
                                </div>
                            </div>
                            <div class="panel-body">
                                <!-- 4 Coordinator Telemetry Cards -->
                                <div class="stats-grid" style="margin-bottom: 24px;">
                                    <article class="stat-card">
                                        <div class="stat-header">
                                            <span class="stat-label">HIGH / CRITICAL ZONES</span>
                                            <span class="stat-icon red">⚠️</span>
                                        </div>
                                        <h3 class="stat-value" id="coordStatHighSev">0</h3>
                                        <p class="stat-subtext">Severity Level 4 & 5 emergency areas</p>
                                    </article>

                                    <article class="stat-card">
                                        <div class="stat-header">
                                            <span class="stat-label">PENDING DEMANDS</span>
                                            <span class="stat-icon amber">📋</span>
                                        </div>
                                        <h3 class="stat-value" id="coordStatPendingReqs">0</h3>
                                        <p class="stat-subtext">Waiting supply & rescue requests</p>
                                    </article>

                                    <article class="stat-card">
                                        <div class="stat-header">
                                            <span class="stat-label">TEAM DEPLOYMENTS</span>
                                            <span class="stat-icon blue">🚑</span>
                                        </div>
                                        <h3 class="stat-value" id="coordStatTeamsStatus">0 / 0</h3>
                                        <p class="stat-subtext">Available vs Deployed on mission</p>
                                    </article>

                                    <article class="stat-card">
                                        <div class="stat-header">
                                            <span class="stat-label">SHELTER OCCUPANCY</span>
                                            <span class="stat-icon teal">🏠</span>
                                        </div>
                                        <h3 class="stat-value" id="coordStatShelterUsage">0 / 0</h3>
                                        <p class="stat-subtext">Current evacuees vs Total capacity</p>
                                    </article>
                                </div>

                                <!-- Recent Emergency Reports Table -->
                                <div class="panel-header" style="padding-left: 0; padding-right: 0;">
                                    <div class="panel-header-left">
                                        <h3 class="panel-title" style="font-size: 1rem;">Recent Emergency Incident Reports</h3>
                                        <p class="panel-subtitle">Real-time reports registered by citizens and field teams</p>
                                    </div>
                                    <div class="panel-actions">
                                        <a href="#regions" class="btn btn-secondary btn-sm">View All Regions →</a>
                                    </div>
                                </div>
                                <div class="table-responsive">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Region ID</th>
                                                <th>Region & Disaster</th>
                                                <th>Severity</th>
                                                <th>Population</th>
                                                <th>Road Access</th>
                                                <th>Requested Assistance</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody id="coordRecentReportsBody">
                                            <tr><td colspan="7" class="loading-box"><span class="spinner"></span> Loading telemetry...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ============================================================== -->
                <!-- 2. AFFECTED REGIONS VIEW`;

if (!dashEndRegex.test(html)) {
    console.error('dashEndRegex not matched');
    process.exit(1);
}
html = html.replace(dashEndRegex, coordDashboardHtml);

// =========================================================================
// 3. ENHANCE REGIONS TABLE HEADERS IN HTML
// =========================================================================
const regionsTableHeadRegex = /<table class="data-table">[\s\S]*?<th>Region ID<\/th>[\s\S]*?<th>Action<\/th>[\s\S]*?<\/thead>/;
const newRegionsTableHead = `<table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Region ID</th>
                                        <th>Region & Disaster</th>
                                        <th>Affected Population</th>
                                        <th>Severity Level</th>
                                        <th>Road Access</th>
                                        <th>Requested Assistance Quantities</th>
                                        <th>Operational Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>`;
if (!regionsTableHeadRegex.test(html)) {
    console.error('regionsTableHeadRegex not matched');
    process.exit(1);
}
html = html.replace(regionsTableHeadRegex, newRegionsTableHead);

// =========================================================================
// 4. REPLACE VIEW-REQUESTS WITH VIEW-ALLOCATION IN HTML
// =========================================================================
const viewRequestsRegex = /<!-- =+ -->\s*<!-- 3\. PRIORITY REQUESTS VIEW\s*-->\s*<!-- =+ -->[\s\S]*?<section class="app-view" id="view-requests">[\s\S]*?<\/section>/;

const newAllocationView = `<!-- ============================================================== -->
                <!-- 4. RESOURCE ALLOCATION VIEW                                    -->
                <!-- ============================================================== -->
                <section class="app-view" id="view-allocation">
                    <!-- Warehouse Stock Telemetry -->
                    <div class="stats-grid" style="margin-bottom: 20px;">
                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">WAREHOUSE FOOD STOCK</span>
                                <span class="stat-icon teal">🍲</span>
                            </div>
                            <h3 class="stat-value" id="allocStockFood">0</h3>
                            <p class="stat-subtext">Food Relief Kits available for dispatch</p>
                        </article>

                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">WAREHOUSE MEDICAL STOCK</span>
                                <span class="stat-icon amber">💊</span>
                            </div>
                            <h3 class="stat-value" id="allocStockMed">0</h3>
                            <p class="stat-subtext">Medical Relief Kits available for dispatch</p>
                        </article>

                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">TOTAL KITS ALLOCATED</span>
                                <span class="stat-icon blue">🚚</span>
                            </div>
                            <h3 class="stat-value" id="allocTotalDispatched">0</h3>
                            <p class="stat-subtext">Cumulative relief units dispatched</p>
                        </article>

                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">OUTSTANDING DEFICIT</span>
                                <span class="stat-icon red">⚠️</span>
                            </div>
                            <h3 class="stat-value" id="allocTotalDeficit">0</h3>
                            <p class="stat-subtext">Unfilled emergency requirements</p>
                        </article>
                    </div>

                    <!-- Direct Allocation & Priority Batch Queue -->
                    <div class="grid-2 mutation-action">
                        <!-- Direct Allocation Form -->
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-header-left">
                                    <h2 class="panel-title">Direct Resource Allocation (Coordinator Action)</h2>
                                    <p class="panel-subtitle">Dispatch Food & Medical Relief Kits directly to target region</p>
                                </div>
                            </div>
                            <div class="panel-body">
                                <form id="directAllocationForm" class="form-stacked">
                                    <div class="form-group">
                                        <label class="form-label" for="allocRegionSelect">Target Affected Region <span class="required-star">*</span></label>
                                        <select id="allocRegionSelect" class="form-select" required>
                                            <option value="">Select target region...</option>
                                        </select>
                                    </div>

                                    <!-- Region live demand box -->
                                    <div id="allocRegionDemandBox" class="info-callout" style="display: none; margin-bottom: 14px;">
                                        <div>
                                            <div style="font-weight: 600; color: #FFFFFF;" id="allocDemandTitle">Region Demand:</div>
                                            <div id="allocDemandDetails" style="font-size: 13px; color: #CBD5E1; margin-top: 4px;"></div>
                                        </div>
                                    </div>

                                    <div class="grid-2" style="gap: 12px;">
                                        <div class="form-group">
                                            <label class="form-label" for="allocFoodInput">Food Kits to Allocate</label>
                                            <input type="number" id="allocFoodInput" class="form-input" min="0" placeholder="e.g. 50" value="0">
                                            <span class="form-hint" id="allocFoodHint">Available in stock: 0</span>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label" for="allocMedInput">Medical Kits to Allocate</label>
                                            <input type="number" id="allocMedInput" class="form-input" min="0" placeholder="e.g. 20" value="0">
                                            <span class="form-hint" id="allocMedHint">Available in stock: 0</span>
                                        </div>
                                    </div>

                                    <div id="allocErrorBox" class="field-error" style="display: none; margin-bottom: 12px;"></div>

                                    <button type="submit" id="allocSubmitBtn" class="btn btn-primary btn-full" style="height: 44px;">
                                        <span id="allocSubmitBtnText">Confirm Allocation & Dispatch</span>
                                    </button>
                                </form>
                            </div>
                        </div>

                        <!-- Priority Queue Processor -->
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-header-left">
                                    <h2 class="panel-title">Priority Queue Batch Processor</h2>
                                    <p class="panel-subtitle">FIFO & Severity-based dispatch automation</p>
                                </div>
                            </div>
                            <div class="panel-body">
                                <div class="info-callout" style="margin-bottom: 18px;">
                                    <span class="info-callout-icon">⚡</span>
                                    <div>
                                        <strong>Deterministic Allocation Queue:</strong>
                                        Automatically processes the top-ranked waiting request from the emergency queue based on:
                                        <code>Severity (DESC) ➔ Population (DESC) ➔ Arrival Order (FIFO)</code>.
                                    </div>
                                </div>

                                <button type="button" id="processNextRequestBtn" class="btn btn-primary btn-full" style="height: 48px; font-size: 15px; margin-bottom: 16px;">
                                    <span>⚡</span> Process Next Priority Request
                                </button>

                                <div class="info-kv-box">
                                    <div class="info-kv-row">
                                        <span class="kv-key">Waiting Supply Requests:</span>
                                        <span class="kv-val" id="allocQueueSupplyCount">0 waiting</span>
                                    </div>
                                    <div class="info-kv-row">
                                        <span class="kv-key">Waiting Rescue Requests:</span>
                                        <span class="kv-val" id="allocQueueRescueCount">0 waiting</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Allocation Demands & Regional Fulfillments Table -->
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-header-left">
                                <h2 class="panel-title">Regional Allocation Demands & Fulfillment Progress</h2>
                                <p class="panel-subtitle">Live inspection of all region requirements, allocated quantities, and remaining deficits</p>
                            </div>
                            <div class="panel-actions">
                                <input type="text" id="allocSearchInput" class="form-input search-input" placeholder="Search allocations...">
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Request ID</th>
                                        <th>Target Region</th>
                                        <th>Type</th>
                                        <th>Requested</th>
                                        <th>Allocated</th>
                                        <th>Remaining Need</th>
                                        <th>Status</th>
                                        <th class="coordinator-only-action">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="allocationTableBody">
                                    <tr><td colspan="8" class="loading-box"><span class="spinner"></span> Loading allocations...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>`;

if (!viewRequestsRegex.test(html)) {
    console.error('viewRequestsRegex not matched');
    process.exit(1);
}
html = html.replace(viewRequestsRegex, newAllocationView);

// =========================================================================
// 5. ADD DEPLOY TEAM ACTION IN VIEW-TEAMS IN HTML
// =========================================================================
const teamsActionRegex = /<div class="grid-2 coordinator-only-action">\s*<div class="panel">\s*<div class="panel-header">\s*<div class="panel-header-left">\s*<h2 class="panel-title">Register Rescue Team/;

const newTeamsActions = `<div class="grid-2 coordinator-only-action">
                        <!-- Deploy Team Form -->
                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-header-left">
                                    <h2 class="panel-title">Deploy Rescue Team (Coordinator Action)</h2>
                                    <p class="panel-subtitle">Assign an available response unit to an affected region</p>
                                </div>
                            </div>
                            <div class="panel-body">
                                <form id="assignTeamForm" class="form-stacked">
                                    <div class="form-group">
                                        <label class="form-label" for="assignTeamSelect">Select Available Team <span class="required-star">*</span></label>
                                        <select id="assignTeamSelect" class="form-select" required>
                                            <option value="">Select available team...</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="assignRegionSelect">Target Affected Region <span class="required-star">*</span></label>
                                        <select id="assignRegionSelect" class="form-select" required>
                                            <option value="">Select target region...</option>
                                        </select>
                                    </div>
                                    <div id="assignTeamErrorBox" class="field-error" style="display: none; margin-bottom: 10px;"></div>
                                    <button type="submit" id="btnAssignTeamSubmit" class="btn btn-danger btn-full" style="height: 44px;">
                                        <span>🚑</span> Deploy Team to Region
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div class="panel">
                            <div class="panel-header">
                                <div class="panel-header-left">
                                    <h2 class="panel-title">Register Rescue Team`;

if (!teamsActionRegex.test(html)) {
    console.error('teamsActionRegex not matched');
    process.exit(1);
}
html = html.replace(teamsActionRegex, newTeamsActions);

// =========================================================================
// 6. ADD VIEW-MONITORING BEFORE </main> IN HTML
// =========================================================================
const endMainRegex = /<\/section>\s*<\/main>/;
const monitoringViewHtml = `</section>

                <!-- ============================================================== -->
                <!-- 8. RESPONSE MONITORING VIEW                                    -->
                <!-- ============================================================== -->
                <section class="app-view" id="view-monitoring">
                    <!-- 4 Telemetry Header Cards -->
                    <div class="stats-grid">
                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">ACTIVE EMERGENCY ZONES</span>
                                <span class="stat-icon red">⌖</span>
                            </div>
                            <h3 class="stat-value" id="monStatRegions">0</h3>
                            <p class="stat-subtext">Total incident regions under monitoring</p>
                        </article>

                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">PENDING DEMANDS</span>
                                <span class="stat-icon amber">⏳</span>
                            </div>
                            <h3 class="stat-value" id="monStatPending">0</h3>
                            <p class="stat-subtext">Relief & rescue requests in queue</p>
                        </article>

                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">RESCUE DEPLOYMENT RATE</span>
                                <span class="stat-icon blue">🚑</span>
                            </div>
                            <h3 class="stat-value" id="monStatTeams">0%</h3>
                            <p class="stat-subtext" id="monStatTeamsSub">0 of 0 teams deployed</p>
                        </article>

                        <article class="stat-card">
                            <div class="stat-header">
                                <span class="stat-label">SHELTER CAPACITY USED</span>
                                <span class="stat-icon teal">🏠</span>
                            </div>
                            <h3 class="stat-value" id="monStatShelter">0%</h3>
                            <p class="stat-subtext" id="monStatShelterSub">0 of 0 spaces occupied</p>
                        </article>
                    </div>

                    <!-- Monitoring Console with Tabs -->
                    <div class="panel" style="margin-top: 20px;">
                        <div class="panel-header">
                            <div class="panel-header-left">
                                <h2 class="panel-title">Response Monitoring Console</h2>
                                <p class="panel-subtitle">Live synchronized operational status from real database records</p>
                            </div>
                            <div class="panel-actions">
                                <span id="monLastUpdated" style="font-size: 12px; color: #9EA3B0; margin-right: 8px;"></span>
                                <button type="button" class="btn btn-secondary btn-sm" id="btnRefreshMonitoring">
                                    ↻ Refresh Monitoring
                                </button>
                            </div>
                        </div>
                        <div class="panel-body">
                            <!-- Tab Navigation -->
                            <div class="auth-tabs" style="margin-bottom: 20px; border-bottom: 1px solid #3A3F4E; padding-bottom: 8px;">
                                <button type="button" class="auth-tab-button active" id="tabMonPending">Pending Demands</button>
                                <button type="button" class="auth-tab-button" id="tabMonAllocations">Resource Allocations</button>
                                <button type="button" class="auth-tab-button" id="tabMonTeams">Team Deployments</button>
                                <button type="button" class="auth-tab-button" id="tabMonShelters">Shelter Status</button>
                            </div>

                            <!-- Tab 1: Pending Demands -->
                            <div id="monTabContentPending" class="mon-tab-content">
                                <div class="table-responsive">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Request ID</th>
                                                <th>Region Name</th>
                                                <th>Type</th>
                                                <th>Severity</th>
                                                <th>Required Quantities</th>
                                                <th>Queue Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody id="monPendingTableBody">
                                            <tr><td colspan="7" class="loading-box"><span class="spinner"></span> Loading pending demands...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Tab 2: Allocations -->
                            <div id="monTabContentAllocations" class="mon-tab-content" style="display: none;">
                                <div class="table-responsive">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Request ID</th>
                                                <th>Region Name</th>
                                                <th>Food Required / Allocated</th>
                                                <th>Meds Required / Allocated</th>
                                                <th>Fulfillment</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody id="monAllocationsTableBody">
                                            <tr><td colspan="6" class="loading-box"><span class="spinner"></span> Loading allocations...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Tab 3: Team Deployments -->
                            <div id="monTabContentTeams" class="mon-tab-content" style="display: none;">
                                <div class="table-responsive">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Team ID</th>
                                                <th>Team Name</th>
                                                <th>Current Region</th>
                                                <th>Status</th>
                                                <th>Assigned Mission</th>
                                            </tr>
                                        </thead>
                                        <tbody id="monTeamsTableBody">
                                            <tr><td colspan="5" class="loading-box"><span class="spinner"></span> Loading team deployments...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Tab 4: Shelter Status -->
                            <div id="monTabContentShelters" class="mon-tab-content" style="display: none;">
                                <div class="table-responsive">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Shelter ID</th>
                                                <th>Shelter Name</th>
                                                <th>Location</th>
                                                <th>Total Capacity</th>
                                                <th>Occupied</th>
                                                <th>Available</th>
                                                <th>Usage</th>
                                            </tr>
                                        </thead>
                                        <tbody id="monSheltersTableBody">
                                            <tr><td colspan="7" class="loading-box"><span class="spinner"></span> Loading shelters...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>`;

if (!endMainRegex.test(html)) {
    console.error('endMainRegex not matched');
    process.exit(1);
}
html = html.replace(endMainRegex, monitoringViewHtml);

// Save HTML to frontend/index.html and index.html
html = html.replace(/\r?\n/g, '\r\n');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.writeFileSync(rootHtmlPath, html, 'utf8');
console.log('Successfully updated HTML files!');

// =========================================================================
// 7. CSS UPDATES IN STYLE.CSS
// =========================================================================
if (!css.includes('.coordinator-dashboard-section')) {
    const additionalCss = `
/* Coordinator Dashboard & Monitoring Extensions */
.coordinator-dashboard-section {
    animation: fadeIn 0.25s ease-out;
}

.mon-tab-content {
    animation: fadeIn 0.2s ease-out;
}

.alloc-demand-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}
`;
    css += additionalCss;
    css = css.replace(/\r?\n/g, '\r\n');
    fs.writeFileSync(cssPath, css, 'utf8');
    fs.writeFileSync(rootCssPath, css, 'utf8');
    console.log('Successfully updated CSS files!');
}

console.log('HTML and CSS update complete!');

