const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'frontend', 'app.js');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Update showDashboardScreen document.title for Coordinator
const oldDashTitleRegex = /if \(user\.role === 'PUBLIC'\) \{\s*document\.title = 'ResQ-Allocate \| Public Incident Report';\s*navigateTo\('public-report'\);\s*\} else \{\s*document\.title = 'ResQ-Allocate \| Emergency Command & Control Center';\s*const activeHash = window\.location\.hash\.replace\('#', ''\) \|\| 'dashboard';\s*navigateTo\(activeHash === 'signin' \|\| activeHash === 'signup' \|\| activeHash === 'public-report' \? 'dashboard' : activeHash\);\s*\}/;

const newDashTitleLogic = `if (user.role === 'PUBLIC') {
            document.title = 'ResQ-Allocate | Public Incident Report';
            navigateTo('public-report');
        } else if (user.role === 'COORDINATOR') {
            document.title = 'ResQ-Allocate | Disaster Response Coordinator Panel';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        } else {
            document.title = 'ResQ-Allocate | Emergency Command & Control Center';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        }`;

if (!oldDashTitleRegex.test(content)) {
    console.error('Failed to match oldDashTitleRegex');
    process.exit(1);
}
content = content.replace(oldDashTitleRegex, newDashTitleLogic);

// 2. Update navigateTo viewTitles and refreshCurrentViewData cases
const oldNavRegex = /const viewTitles = \{[\s\S]*?roads: \{ title: 'Road Network & Route Analysis', bc: 'ResQ-Allocate \/ ROUTING LOGISTICS' \}\s*\};/;
const newNavLogic = `const viewTitles = {
            'public-report': { title: 'Emergency Incident Report', bc: 'ResQ-Allocate / EMERGENCY REPORT' },
            dashboard: { title: state.currentUser?.role === 'COORDINATOR' ? 'Coordinator Operational Dashboard' : 'Emergency Dashboard', bc: 'ResQ-Allocate / OVERVIEW' },
            regions: { title: 'Affected Regions Roster', bc: 'ResQ-Allocate / INCIDENT ZONES' },
            allocation: { title: 'Resource Allocation & Fulfillment', bc: 'ResQ-Allocate / RESOURCE ALLOCATION' },
            requests: { title: 'Priority Relief Requests', bc: 'ResQ-Allocate / EMERGENCY QUEUE' },
            inventory: { title: 'Resource Inventory', bc: 'ResQ-Allocate / SUPPLY CHAIN' },
            teams: { title: 'Rescue Teams & Missions', bc: 'ResQ-Allocate / FIELD OPERATIONS' },
            shelters: { title: 'Shelter Management', bc: 'ResQ-Allocate / EVACUATION SHELTERS' },
            roads: { title: 'Road Network & Route Analysis', bc: 'ResQ-Allocate / ROUTING LOGISTICS' },
            monitoring: { title: 'Operational Response Monitoring', bc: 'ResQ-Allocate / RESPONSE MONITORING' }
        };`;

if (!oldNavRegex.test(content)) {
    console.error('Failed to match oldNavRegex');
    process.exit(1);
}
content = content.replace(oldNavRegex, newNavLogic);

// 3. Update refreshCurrentViewData switch cases to include 'allocation' and 'monitoring'
const oldSwitchRegex = /case 'roads':\s*await loadRoadsData\(\);\s*break;/;
const newSwitchLogic = `case 'roads':
                    await loadRoadsData();
                    break;
                case 'allocation':
                    await loadAllocationData();
                    break;
                case 'monitoring':
                    await loadMonitoringData();
                    break;`;

if (!oldSwitchRegex.test(content)) {
    console.error('Failed to match oldSwitchRegex');
    process.exit(1);
}
content = content.replace(oldSwitchRegex, newSwitchLogic);

// 4. Update loadTeamsData and renderTeamsTable and deploy handler
const oldTeamsRegex = /\/\/ --- Rescue Teams Data ---[\s\S]*?async function loadTeamsData\(\)[\s\S]*?renderTeamsTable\(state\.teams\);[\s\S]*?document\.querySelectorAll\('\.toggle-team-btn'\)\.forEach\(btn => \{[\s\S]*?\}\);\s*\}\s*\}/;

const newTeamsLogic = `// --- Rescue Teams Data ---
    async function loadTeamsData() {
        const tbody = document.getElementById('teamsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="loading-box"><span class="spinner"></span> Loading rescue teams...</td></tr>';

        try {
            const [teams, requests, regions] = await Promise.all([
                ResqApi.getRescueTeams(),
                ResqApi.getRequests(),
                ResqApi.getRegions()
            ]);

            state.teams = teams || [];
            state.requests = requests || [];
            state.regions = regions || [];

            // Summary Cards
            const total = state.teams.length;
            const available = state.teams.filter(t => t.available).length;
            const busy = total - available;

            const statTotal = document.getElementById('teamStatTotal');
            const statAvail = document.getElementById('teamStatAvailable');
            const statBusy = document.getElementById('teamStatBusy');

            if (statTotal) statTotal.textContent = total;
            if (statAvail) statAvail.textContent = available;
            if (statBusy) statBusy.textContent = busy;

            // Populate Coordinator Deploy Team Dropdowns
            populateDeployTeamDropdowns();

            renderTeamsTable(state.teams);
        } catch (err) {
            if (tbody) {
                if (err.message === 'BACKEND_OFFLINE') {
                    renderBackendOfflineView('teams');
                } else {
                    tbody.innerHTML = \`
                        <tr>
                            <td colspan="6" class="empty-state-box" style="padding: 24px;">
                                <p style="color: #F87171; font-weight: 600;">Failed to load rescue teams: \${escapeHtml(err.message)}</p>
                                <button class="btn btn-secondary btn-sm" onclick="loadTeamsData()" style="margin-top: 8px;">Retry</button>
                            </td>
                        </tr>
                    \`;
                }
            }
        }
    }

    function populateDeployTeamDropdowns() {
        if (elements.assignTeamSelect) {
            const availTeams = (state.teams || []).filter(t => t.available);
            elements.assignTeamSelect.innerHTML = '<option value="">Select available team...</option>' +
                availTeams.map(t => \`<option value="\${t.teamId}">#\${t.teamId} - \${escapeHtml(t.teamName)} (\${escapeHtml(t.currentLocation)})</option>\`).join('');
            if (availTeams.length === 0) {
                elements.assignTeamSelect.innerHTML = '<option value="">No available teams on standby</option>';
            }
        }

        if (elements.assignRegionSelect) {
            const waitingRescueMap = {};
            (state.requests || []).forEach(r => {
                if (r.requestType === 'RESCUE' && (r.status === 'WAITING' || r.status === 'PENDING')) {
                    const regId = r.region?.regionId || r.regionId;
                    if (regId) waitingRescueMap[regId] = true;
                }
            });

            elements.assignRegionSelect.innerHTML = '<option value="">Select target region...</option>' +
                (state.regions || []).map(r => {
                    const hasReq = waitingRescueMap[r.regionId];
                    return \`<option value="\${r.regionId}">#\${r.regionId} - \${escapeHtml(r.regionName)} (Severity \${r.severity}/5)\${hasReq ? ' [Rescue Needed]' : ''}</option>\`;
                }).join('');
        }
    }

    // Deploy Team Form Handler
    if (elements.assignTeamForm && !elements.assignTeamForm._resqBound) {
        elements.assignTeamForm._resqBound = true;
        elements.assignTeamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.assignTeamErrorBox) elements.assignTeamErrorBox.style.display = 'none';

            const teamId = parseInt(elements.assignTeamSelect.value, 10);
            const regionId = parseInt(elements.assignRegionSelect.value, 10);

            if (!teamId || !regionId) {
                if (elements.assignTeamErrorBox) {
                    elements.assignTeamErrorBox.textContent = 'Please select both an available rescue team and a target region.';
                    elements.assignTeamErrorBox.style.display = 'block';
                }
                return;
            }

            const team = state.teams.find(t => t.teamId === teamId);
            if (team && !team.available) {
                if (elements.assignTeamErrorBox) {
                    elements.assignTeamErrorBox.textContent = \`Team #\${teamId} is already busy on an active mission and cannot be deployed.\`;
                    elements.assignTeamErrorBox.style.display = 'block';
                }
                return;
            }

            if (elements.btnAssignTeamSubmit) elements.btnAssignTeamSubmit.disabled = true;

            try {
                const res = await ResqApi.assignRescueTeam(teamId, regionId);
                showToast(res.message || \`Team #\${teamId} successfully deployed to region #\${regionId}!\`);
                elements.assignTeamForm.reset();
                await loadTeamsData();
                await loadDashboardData();
            } catch (err) {
                console.error('Failed to assign team:', err);
                if (elements.assignTeamErrorBox) {
                    elements.assignTeamErrorBox.textContent = err.message || 'Failed to assign rescue team.';
                    elements.assignTeamErrorBox.style.display = 'block';
                }
            } finally {
                if (elements.btnAssignTeamSubmit) elements.btnAssignTeamSubmit.disabled = false;
            }
        });
    }

    function renderTeamsTable(teams) {
        const tbody = document.getElementById('teamsTableBody');
        if (!tbody) return;

        if (!teams || teams.length === 0) {
            tbody.innerHTML = \`
                <tr>
                    <td colspan="6" class="empty-state-box">
                        <div class="empty-state-icon">👥</div>
                        <p class="empty-state-title">No rescue teams registered</p>
                        <p class="empty-state-desc">Personnel roster is empty.</p>
                    </td>
                </tr>
            \`;
            return;
        }

        const isPublic = state.currentUser?.role === 'PUBLIC';

        tbody.innerHTML = teams.map(t => {
            let missionText = '<span class="text-muted">Standby / Unassigned</span>';
            if (!t.available) {
                const activeReq = (state.requests || []).find(r => 
                    r.requestType === 'RESCUE' && 
                    r.status !== 'COMPLETED' && 
                    (r.assignedTeamId === t.teamId || (r.assignedTeam && r.assignedTeam.teamId === t.teamId))
                );
                if (activeReq) {
                    missionText = \`<strong>Rescue Op #\${activeReq.requestId}</strong> (\${escapeHtml(activeReq.region?.regionName || activeReq.regionName || t.currentLocation)})\`;
                } else {
                    missionText = \`<strong>Deployed</strong> (\${escapeHtml(t.currentLocation)})\`;
                }
            }

            return \`
                <tr>
                    <td><strong>#\${t.teamId}</strong></td>
                    <td><strong>\${escapeHtml(t.teamName)}</strong></td>
                    <td>📍 \${escapeHtml(t.currentLocation)}</td>
                    <td>
                        \${t.available 
                            ? '<span class="badge badge-available">● Available</span>' 
                            : '<span class="badge badge-busy">● Busy (Deployed)</span>'}
                    </td>
                    <td>\${missionText}</td>
                    <td class="coordinator-only-action">
                        \${!isPublic ? (
                            t.available 
                                ? \`<button class="btn btn-secondary btn-sm toggle-team-btn" data-id="\${t.teamId}" data-status="true">Set Busy</button>\`
                                : \`<button class="btn btn-danger btn-sm release-team-btn" data-id="\${t.teamId}">Release Team</button>\`
                        ) : ''}
                    </td>
                </tr>
            \`;
        }).join('');

        if (!isPublic) {
            document.querySelectorAll('.toggle-team-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const teamId = e.currentTarget.getAttribute('data-id');
                    try {
                        await ResqApi.updateTeamStatus(teamId, false);
                        showToast(\`Team #\${teamId} marked BUSY.\`);
                        loadTeamsData();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            });

            document.querySelectorAll('.release-team-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const teamId = e.currentTarget.getAttribute('data-id');
                    try {
                        await ResqApi.releaseRescueTeam(teamId);
                        showToast(\`Team #\${teamId} released to Standby/Available.\`);
                        await loadTeamsData();
                        await loadDashboardData();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            });
        }
    }`;

if (!oldTeamsRegex.test(content)) {
    console.error('Failed to match oldTeamsRegex');
    process.exit(1);
}
content = content.replace(oldTeamsRegex, newTeamsLogic);

// 5. Update shelterAllocForm to check available capacity strictly
const oldShelterAllocRegex = /if \(elements\.shelterAllocForm\) \{\s*elements\.shelterAllocForm\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);\s*const people = parseInt\(document\.getElementById\('shelterPeopleCountInput'\)\.value, 10\);[\s\S]*?\}\);\s*\}/;

const newShelterAllocLogic = `if (elements.shelterAllocForm) {
        elements.shelterAllocForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const people = parseInt(document.getElementById('shelterPeopleCountInput').value, 10);

            if (isNaN(people) || people <= 0) {
                showToast('Please specify a positive number of people to allocate.', 'error');
                return;
            }

            // Client check: prevent capacity overflow
            const totalAvailable = (state.shelters || []).reduce((acc, s) => acc + Math.max(0, (s.capacity || 0) - (s.occupied || 0)), 0);
            if (people > totalAvailable) {
                showToast(\`Cannot allocate \${people} evacuees. Total available shelter capacity is only \${totalAvailable}.\`, 'error');
                return;
            }

            try {
                const res = await ResqApi.allocateShelter(people);
                showToast(\`Accommodated \${people} evacuees at shelter "\${res.shelterName}" (\${res.location}).\`);
                elements.shelterAllocForm.reset();
                await loadSheltersData();
                await loadDashboardData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }`;

if (!oldShelterAllocRegex.test(content)) {
    console.error('Failed to match oldShelterAllocRegex');
    process.exit(1);
}
content = content.replace(oldShelterAllocRegex, newShelterAllocLogic);

// 6. Append complete Monitoring module logic before initResQApp closing
const monitoringModuleLogic = `
    // ==========================================================================
    // 8. RESPONSE MONITORING CONSOLE & SITUATIONAL LOGIC
    // ==========================================================================
    async function loadMonitoringData() {
        try {
            const [regions, requests, teams, shelters, inventory] = await Promise.all([
                ResqApi.getRegions().catch(() => []),
                ResqApi.getRequests().catch(() => []),
                ResqApi.getRescueTeams().catch(() => []),
                ResqApi.getShelters().catch(() => []),
                ResqApi.getInventory().catch(() => ({ foodKits: 0, medicineKits: 0 }))
            ]);

            state.regions = regions || [];
            state.requests = requests || [];
            state.teams = teams || [];
            state.shelters = shelters || [];
            state.inventory = inventory || { foodKits: 0, medicineKits: 0 };

            // 1. Update Telemetry Metric Cards
            if (elements.monStatRegions) {
                elements.monStatRegions.textContent = state.regions.length;
            }

            const pendingReqs = state.requests.filter(r => r.status === 'WAITING' || r.status === 'PENDING');
            if (elements.monStatPending) {
                elements.monStatPending.textContent = pendingReqs.length;
            }

            const totalTeams = state.teams.length;
            const busyTeams = state.teams.filter(t => !t.available).length;
            const teamRate = totalTeams > 0 ? Math.round((busyTeams / totalTeams) * 100) : 0;
            if (elements.monStatTeams) elements.monStatTeams.textContent = \`\${teamRate}%\`;
            if (elements.monStatTeamsSub) elements.monStatTeamsSub.textContent = \`\${busyTeams} of \${totalTeams} units deployed\`;

            let totalCap = 0, totalOcc = 0;
            state.shelters.forEach(s => {
                totalCap += (s.capacity || 0);
                totalOcc += (s.occupied || 0);
            });
            const shelterRate = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;
            if (elements.monStatShelter) elements.monStatShelter.textContent = \`\${shelterRate}%\`;
            if (elements.monStatShelterSub) elements.monStatShelterSub.textContent = \`\${totalOcc.toLocaleString()} of \${totalCap.toLocaleString()} occupied\`;

            if (elements.monLastUpdated) {
                elements.monLastUpdated.textContent = 'Synced: ' + new Date().toLocaleTimeString();
            }

            // 2. Render all 4 tab tables
            renderMonitoringPending(state.requests);
            renderMonitoringAllocations(state.requests);
            renderMonitoringTeams(state.teams);
            renderMonitoringShelters(state.shelters);
        } catch (err) {
            console.error('Failed to load monitoring data:', err);
        }
    }

    function renderMonitoringPending(requests) {
        const tbody = elements.monPendingTableBody;
        if (!tbody) return;

        const pending = (requests || []).filter(r => r.status === 'WAITING' || r.status === 'PENDING');
        if (pending.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-box">No pending demands in queue. All requests are currently fulfilled or in progress.</td></tr>';
            return;
        }

        tbody.innerHTML = pending.map(req => {
            const regName = req.region?.regionName || req.regionName || '#' + (req.region?.regionId || req.regionId);
            const regId = req.region?.regionId || req.regionId;
            const isSupply = req.requestType === 'SUPPLY';

            const reqQty = isSupply 
                ? \`🍲 \${req.foodRequired || 0} food | 💊 \${req.medicineRequired || 0} med\`
                : \`🚑 \${req.teamsRequired || 1} team | 👥 \${req.peopleToRescue || 0} people\`;

            const actionBtn = isSupply 
                ? \`<button type="button" class="btn btn-primary btn-sm" onclick="window.resqQuickAllocate(\${regId})">Allocate Stock</button>\`
                : \`<button type="button" class="btn btn-danger btn-sm" onclick="navigateTo('teams')">Deploy Team</button>\`;

            return \`
                <tr>
                    <td><strong>#\${req.requestId}</strong></td>
                    <td><strong>\${escapeHtml(regName)}</strong></td>
                    <td><span class="badge \${isSupply ? 'badge-low' : 'badge-critical'}">\${req.requestType}</span></td>
                    <td>\${renderSeverityBadge(req.severity || req.region?.severity || 3)}</td>
                    <td>\${reqQty}</td>
                    <td><span class="badge badge-waiting">● WAITING</span></td>
                    <td>\${actionBtn}</td>
                </tr>
            \`;
        }).join('');
    }

    function renderMonitoringAllocations(requests) {
        const tbody = elements.monAllocationsTableBody;
        if (!tbody) return;

        const supplyReqs = (requests || []).filter(r => r.requestType === 'SUPPLY');
        if (supplyReqs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-box">No supply allocation records found.</td></tr>';
            return;
        }

        tbody.innerHTML = supplyReqs.map(req => {
            const regName = req.region?.regionName || req.regionName || '#' + (req.region?.regionId || req.regionId);
            const foodReq = req.foodRequired || 0;
            const foodAlloc = req.foodAllocated || 0;
            const foodRem = req.foodOutstanding ?? Math.max(0, foodReq - foodAlloc);

            const medReq = req.medicineRequired || 0;
            const medAlloc = req.medicineAllocated || 0;
            const medRem = req.medicineOutstanding ?? Math.max(0, medReq - medAlloc);

            let statusBadge = '<span class="badge badge-waiting">● WAITING</span>';
            if (req.status === 'COMPLETED') statusBadge = '<span class="badge badge-completed">✓ COMPLETED</span>';
            else if (req.status === 'IN_PROGRESS' || req.status === 'PARTIALLY_FULFILLED') statusBadge = '<span class="badge badge-in-progress">⚡ IN PROGRESS</span>';

            return \`
                <tr>
                    <td><strong>#\${req.requestId}</strong></td>
                    <td><strong>\${escapeHtml(regName)}</strong></td>
                    <td>🍲 \${foodReq} req / <strong>\${foodAlloc} alloc</strong></td>
                    <td>\${foodRem > 0 ? \`<span style="color:#F87171; font-weight:600;">\${foodRem} needed</span>\` : '<span style="color:#34D399;">Fulfilled</span>'}</td>
                    <td>💊 \${medReq} req / <strong>\${medAlloc} alloc</strong></td>
                    <td>\${medRem > 0 ? \`<span style="color:#F87171; font-weight:600;">\${medRem} needed</span>\` : '<span style="color:#34D399;">Fulfilled</span>'}</td>
                    <td>\${statusBadge}</td>
                </tr>
            \`;
        }).join('');
    }

    function renderMonitoringTeams(teams) {
        const tbody = elements.monTeamsTableBody;
        if (!tbody) return;

        if (!teams || teams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state-box">No rescue teams registered.</td></tr>';
            return;
        }

        tbody.innerHTML = teams.map(t => {
            const isAvail = t.available;
            let mission = '<span class="text-muted">Standby at base</span>';
            if (!isAvail) {
                const activeReq = (state.requests || []).find(r => 
                    r.requestType === 'RESCUE' && 
                    r.status !== 'COMPLETED' && 
                    (r.assignedTeamId === t.teamId || (r.assignedTeam && r.assignedTeam.teamId === t.teamId))
                );
                if (activeReq) {
                    mission = \`<strong>Rescue Mission #\${activeReq.requestId}</strong> (\${escapeHtml(activeReq.region?.regionName || activeReq.regionName || t.currentLocation)})\`;
                } else {
                    mission = \`<strong>Deployed</strong> (\${escapeHtml(t.currentLocation)})\`;
                }
            }

            return \`
                <tr>
                    <td><strong>#\${t.teamId}</strong></td>
                    <td><strong>\${escapeHtml(t.teamName)}</strong></td>
                    <td>📍 \${escapeHtml(t.currentLocation)}</td>
                    <td>\${isAvail ? '<span class="badge badge-available">● Available</span>' : '<span class="badge badge-busy">● Busy (Deployed)</span>'}</td>
                    <td>\${mission}</td>
                    <td>
                        \${!isAvail 
                            ? \`<button type="button" class="btn btn-danger btn-sm mon-release-btn" data-team-id="\${t.teamId}">Release</button>\` 
                            : '<span class="badge badge-low">Ready</span>'
                        }
                    </td>
                </tr>
            \`;
        }).join('');

        document.querySelectorAll('.mon-release-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const teamId = e.currentTarget.getAttribute('data-team-id');
                try {
                    await ResqApi.releaseRescueTeam(teamId);
                    showToast(\`Team #\${teamId} returned to standby.\`);
                    await loadMonitoringData();
                    await loadTeamsData();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        });
    }

    function renderMonitoringShelters(shelters) {
        const tbody = elements.monSheltersTableBody;
        if (!tbody) return;

        if (!shelters || shelters.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state-box">No shelters registered.</td></tr>';
            return;
        }

        tbody.innerHTML = shelters.map(s => {
            const cap = s.capacity || 0;
            const occ = s.occupied || 0;
            const vac = Math.max(0, cap - occ);
            const pct = cap > 0 ? Math.min(100, Math.round((occ / cap) * 100)) : 0;

            let statusBadge = '<span class="badge badge-available">Available (&lt;80%)</span>';
            let barColor = '#10B981';
            if (pct >= 100) {
                statusBadge = '<span class="badge badge-busy">Full (100%)</span>';
                barColor = '#EF4444';
            } else if (pct >= 80) {
                statusBadge = '<span class="badge badge-waiting">Nearly Full (&ge;80%)</span>';
                barColor = '#F59E0B';
            }

            return \`
                <tr>
                    <td><strong>#\${s.shelterId}</strong></td>
                    <td><strong>\${escapeHtml(s.shelterName)}</strong></td>
                    <td>📍 \${escapeHtml(s.location)}</td>
                    <td>\${cap.toLocaleString()}</td>
                    <td>\${occ.toLocaleString()}</td>
                    <td><strong>\${vac.toLocaleString()}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 8px; background: #2F3342; border-radius: 4px; overflow: hidden;">
                                <div style="width: \${pct}%; height: 100%; background: \${barColor}; border-radius: 4px;"></div>
                            </div>
                            <span style="font-size: 11px; min-width: 32px;">\${pct}%</span>
                        </div>
                    </td>
                    <td>\${statusBadge}</td>
                </tr>
            \`;
        }).join('');
    }

    // Monitoring Tab Switcher Setup
    function setupMonitoringTabs() {
        const tabs = [
            { btn: elements.tabMonPending, content: elements.monTabContentPending },
            { btn: elements.tabMonAllocations, content: elements.monTabContentAllocations },
            { btn: elements.tabMonTeams, content: elements.monTabContentTeams },
            { btn: elements.tabMonShelters, content: elements.monTabContentShelters }
        ];

        tabs.forEach(({ btn, content }) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                tabs.forEach(t => {
                    if (t.btn) t.btn.classList.remove('active');
                    if (t.content) t.content.style.display = 'none';
                });
                btn.classList.add('active');
                if (content) content.style.display = 'block';
            });
        });

        if (elements.btnRefreshMonitoring) {
            elements.btnRefreshMonitoring.addEventListener('click', () => {
                loadMonitoringData();
                showToast('Monitoring data refreshed.');
            });
        }
    }
    setupMonitoringTabs();
`;

// Insert monitoringModuleLogic before the end of initResQApp
const initEndIdx = content.lastIndexOf('// Boot Session on startup');
if (initEndIdx === -1) {
    console.error('Could not find // Initialize Session on startup');
    process.exit(1);
}

content = content.substring(0, initEndIdx) + monitoringModuleLogic + '\n    ' + content.substring(initEndIdx);

fs.writeFileSync(appPath, content, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'app.js'), content, 'utf8');
console.log('Step 3 applied successfully to frontend/app.js and app.js!');
