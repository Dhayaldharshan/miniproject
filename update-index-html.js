const fs = require('fs');

function updateHtml(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update sidebar nav
    const oldNavRegex = /<nav class="sidebar-nav">[\s\S]*?<\/nav>/;
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
                <a href="#requests" class="nav-link coordinator-only-nav">
                    <span class="nav-icon">📋</span>
                    <span>Priority Requests</span>
                </a>
                <a href="#inventory" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">📦</span>
                    <span>Resource Inventory</span>
                </a>
                <a href="#teams" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">🚑</span>
                    <span>Rescue Teams</span>
                </a>
                <a href="#shelters" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">🏠</span>
                    <span>Shelters</span>
                </a>
                <a href="#roads" class="nav-link admin-coordinator-only-nav">
                    <span class="nav-icon">🛣️</span>
                    <span>Roads & Routing</span>
                </a>
            </nav>`;

    content = content.replace(oldNavRegex, newNav);
    console.log(`Updated sidebar nav in ${filePath}`);

    // 2. Add public report view before view-dashboard if not already present
    if (!content.includes('id="view-public-report"')) {
        const publicViewHtml = `                <!-- ============================================================== -->
                <!-- 0. PUBLIC EMERGENCY INCIDENT REPORTING VIEW                   -->
                <!-- ============================================================== -->
                <section class="app-view" id="view-public-report">
                    <div class="panel public-report-panel">
                        <div class="panel-header">
                            <div class="panel-header-left">
                                <h2 class="panel-title">🚨 Emergency Incident & Assistance Report</h2>
                                <p class="panel-subtitle">Report where the disaster occurred and what emergency relief assistance is needed.</p>
                            </div>
                        </div>
                        <div class="panel-body">
                            <!-- Success Notification Box (Initially hidden) -->
                            <div id="publicReportSuccessBox" class="alert-banner success" style="display: none; margin-bottom: 24px;">
                                <span class="alert-banner-icon">✓</span>
                                <div style="flex: 1;">
                                    <strong id="publicSuccessTitle" style="color: #10b981; font-size: 15px; display: block;">Emergency Incident Report Registered Successfully</strong>
                                    <p id="publicSuccessDetails" style="margin: 6px 0 0; font-size: 13px; color: #d1fae5; line-height: 1.5;"></p>
                                </div>
                                <button type="button" id="publicReportNewBtn" class="btn btn-secondary btn-sm" style="margin-left: 12px; white-space: nowrap;">
                                    Submit Another Report
                                </button>
                            </div>

                            <!-- Error Notification Box (Initially hidden) -->
                            <div id="publicReportErrorBox" class="alert-banner offline" style="display: none; margin-bottom: 24px;">
                                <span class="alert-banner-icon">⚠️</span>
                                <div id="publicReportErrorMessage" style="flex: 1; color: #f87171; font-size: 13px;"></div>
                            </div>

                            <form id="publicReportForm" class="public-report-form" novalidate>
                                <!-- Row 1: Region Name & Disaster Type -->
                                <div class="form-row-2">
                                    <div class="form-group">
                                        <label class="form-label" for="publicRegionName">
                                            Affected Region / Place Name <span class="required-star">*</span>
                                        </label>
                                        <input type="text" id="publicRegionName" class="form-input" placeholder="e.g. River Side, North Valley" required>
                                        <div id="errorPublicRegionName" class="auth-field-error">Affected region or place name is required.</div>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="publicDisasterType">
                                            Disaster Type <span class="required-star">*</span>
                                        </label>
                                        <select id="publicDisasterType" class="form-select" required>
                                            <option value="Flood" selected>Flood / Inundation</option>
                                            <option value="Earthquake">Earthquake</option>
                                            <option value="Landslide">Landslide / Mudslide</option>
                                            <option value="Cyclone">Cyclone / Hurricane / Typhoon</option>
                                            <option value="Fire Outbreak">Fire Outbreak</option>
                                            <option value="Severe Storm">Severe Storm / Heavy Rain</option>
                                            <option value="Tsunami">Tsunami / Coastal Surge</option>
                                            <option value="Other">Other Emergency Incident</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Row 2: Severity Level & Road Accessibility -->
                                <div class="form-row-2">
                                    <div class="form-group">
                                        <label class="form-label" for="publicSeverity">
                                            Severity Level <span class="required-star">*</span>
                                        </label>
                                        <select id="publicSeverity" class="form-select" required>
                                            <option value="5">5 - Critical Emergency (Life Threatening)</option>
                                            <option value="4" selected>4 - High Severity (Severe Damage)</option>
                                            <option value="3">3 - Moderate (Assistance Required)</option>
                                            <option value="2">2 - Low (Minor Damage)</option>
                                            <option value="1">1 - Minimal (Precautionary Alert)</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="publicAccessibility">
                                            Road Accessibility <span class="required-star">*</span>
                                        </label>
                                        <select id="publicAccessibility" class="form-select" required>
                                            <option value="true" selected>Accessible (Roads Open)</option>
                                            <option value="false">Inaccessible (Roads Blocked / Impassable)</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Row 3: Affected Population (optional) -->
                                <div class="form-group">
                                    <label class="form-label" for="publicPopulation">
                                        Affected Population <span class="optional-tag">(optional)</span>
                                    </label>
                                    <input type="number" id="publicPopulation" class="form-input" placeholder="Estimated number of affected residents (optional, e.g. 250)" min="0">
                                </div>

                                <!-- Row 4: Short Description (optional) -->
                                <div class="form-group">
                                    <label class="form-label" for="publicDescription">
                                        Short Description <span class="optional-tag">(optional)</span>
                                    </label>
                                    <textarea id="publicDescription" class="form-input form-textarea" rows="3" placeholder="Brief description of the disaster situation, hazards, or immediate needs (optional)"></textarea>
                                </div>

                                <!-- Row 5: Required Assistance (multi-select) -->
                                <div class="form-group">
                                    <label class="form-label">
                                        Required Assistance <span class="form-hint">(Select all that apply)</span>
                                    </label>
                                    <div class="assistance-grid">
                                        <label class="assistance-card">
                                            <input type="checkbox" name="publicAssistance" value="FOOD" class="assistance-checkbox">
                                            <span class="assistance-card-body">
                                                <span class="assistance-card-header">
                                                    <span class="assistance-icon">🍲</span>
                                                    <span class="assistance-title">Food Relief Kits</span>
                                                </span>
                                                <span class="assistance-desc">Dry rations, clean drinking water & ready meals</span>
                                            </span>
                                        </label>
                                        <label class="assistance-card">
                                            <input type="checkbox" name="publicAssistance" value="MEDICAL" class="assistance-checkbox">
                                            <span class="assistance-card-body">
                                                <span class="assistance-card-header">
                                                    <span class="assistance-icon">💊</span>
                                                    <span class="assistance-title">Medical Relief Kits</span>
                                                </span>
                                                <span class="assistance-desc">First-aid supplies, trauma kits & essential medicines</span>
                                            </span>
                                        </label>
                                        <label class="assistance-card">
                                            <input type="checkbox" name="publicAssistance" value="TEAMS" class="assistance-checkbox">
                                            <span class="assistance-card-body">
                                                <span class="assistance-card-header">
                                                    <span class="assistance-icon">🚑</span>
                                                    <span class="assistance-title">Rescue Teams</span>
                                                </span>
                                                <span class="assistance-desc">Search & rescue squads, evacuation & boat units</span>
                                            </span>
                                        </label>
                                        <label class="assistance-card">
                                            <input type="checkbox" name="publicAssistance" value="SHELTERS" class="assistance-checkbox">
                                            <span class="assistance-card-body">
                                                <span class="assistance-card-header">
                                                    <span class="assistance-icon">🏠</span>
                                                    <span class="assistance-title">Shelters</span>
                                                </span>
                                                <span class="assistance-desc">Temporary emergency evacuation shelters & bedding</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Row 6: Submit Button -->
                                <div class="form-actions" style="margin-top: 24px;">
                                    <button type="submit" id="publicSubmitBtn" class="btn btn-primary btn-full" style="height: 48px; font-size: 15px;">
                                        <span id="publicSubmitBtnText">Submit Emergency Report</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

`;
        content = content.replace(
            /(<section class="app-view active" id="view-dashboard">)/,
            publicViewHtml + '$1'
        );
        console.log(`Added view-public-report in ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

updateHtml('frontend/index.html');
updateHtml('index.html');
console.log('HTML files updated successfully!');
