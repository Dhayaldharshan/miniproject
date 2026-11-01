const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'frontend', 'app.js');
const rootAppPath = path.join(__dirname, '..', 'app.js');

let content = fs.readFileSync(appPath, 'utf8');

// Replace loadDashboardData and renderDashboardPriorityIncidents
const oldDashRegex = /\/\/ --- Dashboard Data ---[\s\S]*?async function loadDashboardData\(\)[\s\S]*?function renderDashboardPriorityIncidents[\s\S]*?return \(b\.population \|\| 0\) - \(a\.population \|\| 0\);\s*\}\);[\s\S]*?\}/;

const newDashboardLogic = `// --- Dashboard Data ---
    async function loadDashboardData() {
        try {
            const [stats, regions, inventory, teams, requests, shelters] = await Promise.all([
                ResqApi.getDashboardStats().catch(() => null),
                ResqApi.getRegions().catch(() => []),
                ResqApi.getInventory().catch(() => ({ foodKits: 0, medicineKits: 0 })),
                ResqApi.getRescueTeams().catch(() => []),
                ResqApi.getRequests().catch(() => []),
                ResqApi.getShelters().catch(() => [])
            ]);

            state.regions = regions || [];
            state.inventory = inventory || { foodKits: 0, medicineKits: 0 };
            state.teams = teams || [];
            state.requests = requests || [];
            state.shelters = shelters || [];

            // Standard Admin Summary Cards (2x2)
            const regionCountEl = document.getElementById('statRegionCount');
            const teamCountEl = document.getElementById('statTeamCount');
            const foodStockEl = document.getElementById('statFoodStock');
            const medStockEl = document.getElementById('statMedStock');

            if (regionCountEl) regionCountEl.textContent = stats?.totalRegions ?? state.regions.length;
            if (teamCountEl) {
                const total = stats?.totalTeams ?? state.teams.length;
                const available = stats?.availableTeams ?? state.teams.filter(t => t.available).length;
                teamCountEl.textContent = \`\${available} / \${total}\`;
            }
            if (foodStockEl) foodStockEl.textContent = (stats?.foodKits ?? state.inventory.foodKits ?? 0).toLocaleString();
            if (medStockEl) medStockEl.textContent = (stats?.medicineKits ?? state.inventory.medicineKits ?? 0).toLocaleString();

            // Coordinator Telemetry Cards
            if (elements.coordStatHighSev) {
                const highCount = state.regions.filter(r => r.severity >= 4).length;
                elements.coordStatHighSev.textContent = highCount;
            }
            if (elements.coordStatPendingReqs) {
                const pendingCount = state.requests.filter(r => r.status !== 'COMPLETED').length;
                elements.coordStatPendingReqs.textContent = pendingCount;
            }
            if (elements.coordStatTeamsStatus) {
                const avail = state.teams.filter(t => t.available).length;
                const busy = state.teams.filter(t => !t.available).length;
                elements.coordStatTeamsStatus.textContent = \`\${avail} avail / \${busy} busy\`;
            }
            if (elements.coordStatShelterUsage) {
                const occ = state.shelters.reduce((acc, s) => acc + (s.occupied || 0), 0);
                const cap = state.shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
                elements.coordStatShelterUsage.textContent = \`\${occ.toLocaleString()} / \${cap.toLocaleString()}\`;
            }

            // Render Recent Incident Reports in Coordinator Section
            renderCoordRecentReports(state.regions, state.requests);
            populateRegionDropdowns();
        } catch (err) {
            console.error('Error loading dashboard:', err);
        }
    }

    function renderCoordRecentReports(regions, requests) {
        const tbody = elements.coordRecentReportsBody;
        if (!tbody) return;

        if (!regions || regions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-box">No incident reports logged yet.</td></tr>';
            return;
        }

        // Map requirements to regions
        const regionReqs = {};
        (requests || []).forEach(req => {
            const regId = req.region?.regionId || req.regionId;
            if (!regId) return;
            if (!regionReqs[regId]) regionReqs[regId] = [];
            regionReqs[regId].push(req);
        });

        // Take up to 6 most recent regions
        const recent = [...regions].slice(-6).reverse();

        tbody.innerHTML = recent.map(r => {
            const reqs = regionReqs[r.regionId] || [];
            let foodReq = 0, medReq = 0, teamsReq = 0, shelterReq = 0;
            reqs.forEach(rq => {
                if (rq.foodRequired) foodReq += rq.foodRequired;
                if (rq.medicineRequired) medReq += rq.medicineRequired;
                if (rq.teamsRequired) teamsReq += rq.teamsRequired;
                if (rq.peopleToRescue) shelterReq += rq.peopleToRescue;
            });

            const badges = [];
            if (foodReq > 0) badges.push('🍲 ' + foodReq + ' kits');
            if (medReq > 0) badges.push('💊 ' + medReq + ' kits');
            if (teamsReq > 0) badges.push('🚑 ' + teamsReq + ' teams');
            if (shelterReq > 0) badges.push('🏠 ' + shelterReq + ' people');
            const reqDisplay = badges.length > 0 ? badges.join(', ') : '<span style="color: #64748B;">General Monitoring</span>';

            return \`
                <tr>
                    <td><strong>#\${r.regionId}</strong></td>
                    <td>
                        <div><strong>\${escapeHtml(r.regionName)}</strong></div>
                        <span style="font-size: 11px; color: #94A3B8;">\${escapeHtml(r.disasterType || 'General Emergency')}</span>
                    </td>
                    <td>\${renderSeverityBadge(r.severity)}</td>
                    <td>\${(r.population || 0).toLocaleString()}</td>
                    <td>\${renderRegionAccessibilityBadge(r)}</td>
                    <td><span style="font-size: 12px;">\${reqDisplay}</span></td>
                    <td>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.resqOpenRegionDetail(\${r.regionId})">
                            View Details →
                        </button>
                    </td>
                </tr>
            \`;
        }).join('');
    }`;

if (!oldDashRegex.test(content)) {
    console.error('oldDashRegex did not match');
    process.exit(1);
}
content = content.replace(oldDashRegex, newDashboardLogic);

// Replace renderRegionsTable to show 8 columns
const oldRenderRegionsRegex = /function renderRegionsTable\(regions\) \{[\s\S]*?tbody\.innerHTML = uniqueRegions\.map\(r => \{[\s\S]*?\}\)\.join\(''\);\s*\}/;

const newRenderRegionsLogic = `function renderRegionsTable(regions) {
        const tbody = document.getElementById('regionsTableBody');
        if (!tbody) return;

        if (!regions || regions.length === 0) {
            tbody.innerHTML = \`
                <tr>
                    <td colspan="8" class="empty-state-box">
                        <div class="empty-state-icon">⌖</div>
                        <p class="empty-state-title">No affected regions found</p>
                        <p class="empty-state-desc">No regions match the search filter or register query.</p>
                    </td>
                </tr>
            \`;
            return;
        }

        // Deduplicate to guarantee each region appears exactly once
        const seenKeys = new Set();
        const uniqueRegions = regions.filter(r => {
            const key = (r.regionId != null ? String(r.regionId) : r.regionName).toLowerCase();
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });

        // Map request assistance status and quantities for each region
        const regionStatusMap = {};
        const regionReqsMap = {};
        (state.requests || []).forEach(req => {
            const regId = req.region?.regionId || req.regionId;
            if (!regId) return;
            if (!regionStatusMap[regId]) regionStatusMap[regId] = [];
            if (!regionReqsMap[regId]) regionReqsMap[regId] = [];
            regionStatusMap[regId].push(req.status);
            regionReqsMap[regId].push(req);
        });

        tbody.innerHTML = uniqueRegions.map(r => {
            const statuses = regionStatusMap[r.regionId] || [];
            let statusBadge = '<span class="badge badge-low">No Demands</span>';
            if (statuses.some(s => s === 'WAITING' || s === 'PENDING')) {
                statusBadge = '<span class="badge badge-waiting">● Pending</span>';
            } else if (statuses.some(s => s === 'IN_PROGRESS' || s === 'PARTIALLY_FULFILLED')) {
                statusBadge = '<span class="badge badge-in-progress">⚡ In Progress</span>';
            } else if (statuses.length > 0 && statuses.every(s => s === 'COMPLETED')) {
                statusBadge = '<span class="badge badge-completed">✓ Completed</span>';
            }

            // Calculate requested quantities
            const reqs = regionReqsMap[r.regionId] || [];
            let foodReq = 0, medReq = 0, teamsReq = 0, shelterPeople = 0;
            reqs.forEach(rq => {
                if (rq.foodRequired) foodReq += rq.foodRequired;
                if (rq.medicineRequired) medReq += rq.medicineRequired;
                if (rq.teamsRequired) teamsReq += rq.teamsRequired;
                if (rq.peopleToRescue) shelterPeople += rq.peopleToRescue;
            });

            const badges = [];
            if (foodReq > 0) badges.push('🍲 ' + foodReq + ' kits');
            if (medReq > 0) badges.push('💊 ' + medReq + ' kits');
            if (teamsReq > 0) badges.push('🚑 ' + teamsReq + ' teams');
            if (shelterPeople > 0) badges.push('🏠 ' + shelterPeople + ' evacuees');
            const reqDisplay = badges.length > 0 ? badges.join(' · ') : '<span style="color: #64748B;">General Monitoring</span>';

            return \`
                <tr style="cursor: pointer;" onclick="window.resqOpenRegionDetail(\${r.regionId})">
                    <td><strong>#\${r.regionId}</strong></td>
                    <td>
                        <div><strong>\${escapeHtml(r.regionName)}</strong></div>
                        <span style="font-size: 11px; color: #94A3B8;">\${escapeHtml(r.disasterType || 'General Emergency')}</span>
                    </td>
                    <td>\${(r.population || 0).toLocaleString()} citizens</td>
                    <td>\${renderSeverityBadge(r.severity)}</td>
                    <td>\${renderRegionAccessibilityBadge(r)}</td>
                    <td><span style="font-size: 12px; font-weight: 500;">\${reqDisplay}</span></td>
                    <td>\${statusBadge}</td>
                    <td>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.resqOpenRegionDetail(\${r.regionId})">
                                View Details →
                            </button>
                            <button type="button" class="btn btn-danger btn-sm coordinator-only-action" onclick="event.stopPropagation(); window.resqQuickAllocate(\${r.regionId})">
                                Allocate
                            </button>
                        </div>
                    </td>
                </tr>
            \`;
        }).join('');
    }`;

if (!oldRenderRegionsRegex.test(content)) {
    console.error('oldRenderRegionsRegex did not match');
    process.exit(1);
}
content = content.replace(oldRenderRegionsRegex, newRenderRegionsLogic);

// Shortcut to navigate to allocation with region pre-selected
const shortcutScript = `
    window.resqQuickAllocate = function(regionId) {
        navigateTo('allocation');
        setTimeout(() => {
            if (elements.allocRegionSelect) {
                elements.allocRegionSelect.value = regionId;
                elements.allocRegionSelect.dispatchEvent(new Event('change'));
            }
        }, 150);
    };
`;
content = content.replace('function renderRegionsTable', shortcutScript + '\n    function renderRegionsTable');

// Replace loadRequestsData and priority request handling with full loadAllocationData
const oldRequestsRegex = /\/\/ --- Priority Requests Data ---[\s\S]*?async function loadRequestsData\(\)[\s\S]*?renderRequestsTable\(state\.requests\);[\s\S]*?\}\s*\}\s*catch \(err\) \{[\s\S]*?\}\s*\}/;

const newAllocationLogic = `// ==========================================================================
    // 4. RESOURCE ALLOCATION & PRIORITY QUEUE LOGIC
    // ==========================================================================
    async function loadAllocationData() {
        const tbody = elements.allocationTableBody || document.getElementById('allocationTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading-box"><span class="spinner"></span> Loading allocations & demands...</td></tr>';

        try {
            const [requests, regions, inventory] = await Promise.all([
                ResqApi.getRequests(),
                ResqApi.getRegions(),
                ResqApi.getInventory()
            ]);
            state.requests = requests || [];
            state.regions = regions || [];
            state.inventory = inventory || { foodKits: 0, medicineKits: 0 };

            // Update Stock Telemetry
            const foodStock = state.inventory.foodKits || 0;
            const medStock = state.inventory.medicineKits || 0;
            if (elements.allocStockFood) elements.allocStockFood.textContent = foodStock.toLocaleString();
            if (elements.allocStockMed) elements.allocStockMed.textContent = medStock.toLocaleString();

            let totalDispatched = 0;
            let totalDeficit = 0;
            let waitingSupply = 0;
            let waitingRescue = 0;

            state.requests.forEach(r => {
                if (r.requestType === 'SUPPLY') {
                    totalDispatched += (r.foodAllocated || 0) + (r.medicineAllocated || 0);
                    totalDeficit += (r.foodOutstanding || 0) + (r.medicineOutstanding || 0);
                    if (r.status === 'WAITING' || r.status === 'PENDING') waitingSupply++;
                } else {
                    if (r.status === 'WAITING' || r.status === 'PENDING') waitingRescue++;
                }
            });

            if (elements.allocTotalDispatched) elements.allocTotalDispatched.textContent = totalDispatched.toLocaleString() + ' kits';
            if (elements.allocTotalDeficit) elements.allocTotalDeficit.textContent = totalDeficit.toLocaleString() + ' kits';
            if (elements.allocQueueSupplyCount) elements.allocQueueSupplyCount.textContent = waitingSupply + ' waiting';
            if (elements.allocQueueRescueCount) elements.allocQueueRescueCount.textContent = waitingRescue + ' waiting';

            // Populate Allocation Region Select
            populateAllocRegionDropdown();

            // Render Demands Table
            renderAllocationTable(state.requests);
        } catch (err) {
            console.error('Failed to load allocation data:', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-state-box">Failed to load allocation data.</td></tr>';
        }
    }

    function populateAllocRegionDropdown() {
        const select = elements.allocRegionSelect;
        if (!select) return;

        const currentVal = select.value;
        select.innerHTML = '<option value="">Select target region...</option>';

        // Filter regions that have pending supply requests first
        const pendingMap = {};
        state.requests.forEach(r => {
            if (r.requestType === 'SUPPLY' && r.status !== 'COMPLETED') {
                const regId = r.region?.regionId || r.regionId;
                if (regId) pendingMap[regId] = r;
            }
        });

        state.regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.regionId;
            const hasPending = pendingMap[r.regionId];
            opt.textContent = \`#\${r.regionId} - \${r.regionName} (Severity \${r.severity}/5)\${hasPending ? ' [Pending Demands]' : ''}\`;
            select.appendChild(opt);
        });

        if (currentVal) select.value = currentVal;
    }

    // Allocation Region Selection Handler
    if (elements.allocRegionSelect) {
        elements.allocRegionSelect.addEventListener('change', () => {
            const regId = parseInt(elements.allocRegionSelect.value, 10);
            if (!regId) {
                if (elements.allocRegionDemandBox) elements.allocRegionDemandBox.style.display = 'none';
                if (elements.allocFoodInput) elements.allocFoodInput.value = '0';
                if (elements.allocMedInput) elements.allocMedInput.value = '0';
                return;
            }

            const region = state.regions.find(r => r.regionId === regId);
            const activeReq = state.requests.find(r => (r.region?.regionId === regId || r.regionId === regId) && r.requestType === 'SUPPLY' && r.status !== 'COMPLETED');

            const foodStock = state.inventory?.foodKits || 0;
            const medStock = state.inventory?.medicineKits || 0;

            if (elements.allocFoodHint) elements.allocFoodHint.textContent = \`Available in warehouse: \${foodStock.toLocaleString()} kits\`;
            if (elements.allocMedHint) elements.allocMedHint.textContent = \`Available in warehouse: \${medStock.toLocaleString()} kits\`;

            if (activeReq) {
                const foodRem = activeReq.foodOutstanding ?? Math.max(0, activeReq.foodRequired - (activeReq.foodAllocated || 0));
                const medRem = activeReq.medicineOutstanding ?? Math.max(0, activeReq.medicineRequired - (activeReq.medicineAllocated || 0));

                if (elements.allocRegionDemandBox) {
                    elements.allocDemandTitle.textContent = \`Demand for \${region ? region.regionName : '#' + regId}:\`;
                    elements.allocDemandDetails.innerHTML = \`
                        <strong>Food Kits:</strong> Required \${activeReq.foodRequired}, Allocated \${activeReq.foodAllocated || 0}, <strong>Remaining Need: \${foodRem}</strong><br>
                        <strong>Medical Kits:</strong> Required \${activeReq.medicineRequired}, Allocated \${activeReq.medicineAllocated || 0}, <strong>Remaining Need: \${medRem}</strong>
                    \`;
                    elements.allocRegionDemandBox.style.display = 'block';
                }

                if (elements.allocFoodInput) elements.allocFoodInput.value = Math.min(foodRem, foodStock);
                if (elements.allocMedInput) elements.allocMedInput.value = Math.min(medRem, medStock);
            } else {
                if (elements.allocRegionDemandBox) {
                    elements.allocDemandTitle.textContent = \`Status for \${region ? region.regionName : '#' + regId}:\`;
                    elements.allocDemandDetails.textContent = 'No unmet supply requests in queue. You can allocate supplementary buffer stock.';
                    elements.allocRegionDemandBox.style.display = 'block';
                }
                if (elements.allocFoodInput) elements.allocFoodInput.value = '0';
                if (elements.allocMedInput) elements.allocMedInput.value = '0';
            }
        });
    }

    // Direct Allocation Form Submission
    if (elements.directAllocationForm) {
        elements.directAllocationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.allocErrorBox) elements.allocErrorBox.style.display = 'none';

            const regionId = parseInt(elements.allocRegionSelect.value, 10);
            if (!regionId) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = 'Please select a target affected region.';
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }

            const foodKits = parseInt(elements.allocFoodInput.value, 10) || 0;
            const medKits = parseInt(elements.allocMedInput.value, 10) || 0;

            if (foodKits <= 0 && medKits <= 0) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = 'Please specify a positive quantity of Food Kits or Medical Kits to allocate.';
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }

            const foodStock = state.inventory?.foodKits || 0;
            const medStock = state.inventory?.medicineKits || 0;

            if (foodKits > foodStock) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = \`Cannot allocate \${foodKits} food kits. Available warehouse stock is only \${foodStock}.\`;
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }
            if (medKits > medStock) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = \`Cannot allocate \${medKits} medical kits. Available warehouse stock is only \${medStock}.\`;
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }

            // Loading state
            if (elements.allocSubmitBtn) elements.allocSubmitBtn.disabled = true;
            if (elements.allocSubmitBtnText) elements.allocSubmitBtnText.textContent = 'Allocating & Dispatching...';

            try {
                const res = await ResqApi.allocateResources(regionId, foodKits, medKits);
                showToast(res.message || 'Resources allocated successfully!');
                await loadAllocationData();
                await loadInventoryData();
            } catch (err) {
                console.error('Allocation failed:', err);
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = err.message || 'Failed to allocate resources. Please check parameters.';
                    elements.allocErrorBox.style.display = 'block';
                }
            } finally {
                if (elements.allocSubmitBtn) elements.allocSubmitBtn.disabled = false;
                if (elements.allocSubmitBtnText) elements.allocSubmitBtnText.textContent = 'Confirm Allocation & Dispatch';
            }
        });
    }

    function renderAllocationTable(requests) {
        const tbody = elements.allocationTableBody || document.getElementById('allocationTableBody');
        if (!tbody) return;

        if (!requests || requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state-box">No allocation records found in system.</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(req => {
            const regName = req.region?.regionName || req.regionName || 'Zone #' + (req.region?.regionId || req.regionId);
            const isSupply = req.requestType === 'SUPPLY';

            const requested = isSupply
                ? \`🍲 \${req.foodRequired || 0} | 💊 \${req.medicineRequired || 0}\`
                : \`🚑 \${req.teamsRequired || 0} teams | 👥 \${req.peopleToRescue || 0} people\`;

            const allocated = isSupply
                ? \`🍲 \${req.foodAllocated || 0} | 💊 \${req.medicineAllocated || 0}\`
                : (req.assignedTeamId ? \`Team #\${req.assignedTeamId} assigned\` : 'None assigned');

            const remaining = isSupply
                ? \`🍲 \${req.foodOutstanding ?? Math.max(0, (req.foodRequired || 0) - (req.foodAllocated || 0))} | 💊 \${req.medicineOutstanding ?? Math.max(0, (req.medicineRequired || 0) - (req.medicineAllocated || 0))}\`
                : (req.status === 'COMPLETED' ? '0' : \`\${req.teamsRequired || 1} team\`);

            let badge = '<span class="badge badge-waiting">● WAITING</span>';
            if (req.status === 'COMPLETED') badge = '<span class="badge badge-completed">✓ COMPLETED</span>';
            else if (req.status === 'IN_PROGRESS' || req.status === 'PARTIALLY_FULFILLED') badge = '<span class="badge badge-in-progress">⚡ IN PROGRESS</span>';

            const regId = req.region?.regionId || req.regionId;

            return \`
                <tr>
                    <td><strong>#\${req.requestId}</strong></td>
                    <td><strong>\${escapeHtml(regName)}</strong></td>
                    <td><span class="badge \${isSupply ? 'badge-low' : 'badge-critical'}">\${req.requestType}</span></td>
                    <td>\${requested}</td>
                    <td>\${allocated}</td>
                    <td><strong style="color: #F87171;">\${remaining}</strong></td>
                    <td>\${badge}</td>
                    <td class="coordinator-only-action">
                        \${isSupply && req.status !== 'COMPLETED'
                            ? \`<button type="button" class="btn btn-primary btn-sm" onclick="window.resqQuickAllocate(\${regId})">Allocate</button>\`
                            : '-'
                        }
                    </td>
                </tr>
            \`;
        }).join('');
    }`;

if (!oldRequestsRegex.test(content)) {
    console.error('oldRequestsRegex did not match');
    process.exit(1);
}
content = content.replace(oldRequestsRegex, newAllocationLogic);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Step 2 app.js updates applied!');

