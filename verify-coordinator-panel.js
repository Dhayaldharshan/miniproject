const BASE_URL = 'http://127.0.0.1:8080/api';

async function runCoordinatorTests() {
    console.log('================================================================');
    console.log('   RESQ-ALLOCATE: COORDINATOR PANEL END-TO-END VERIFICATION    ');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  [PASS] ${message}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${message}`);
            failed++;
        }
    }

    // 1. Sign in as Coordinator
    console.log('--- TEST 1: Coordinator Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'coordinator@crisis-sync.gov',
            password: 'COORDINATOR@123',
            accountType: 'COORDINATOR'
        })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Coordinator login returns 200 OK');
    assert(loginData.token && loginData.token.length > 20, 'JWT token returned');
    assert(loginData.role === 'COORDINATOR', `User role is COORDINATOR (got ${loginData.role})`);

    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
    };

    // 2. Dashboard Telemetry & Stats
    console.log('\n--- TEST 2: Dashboard Telemetry & Stats ---');
    const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeaders });
    const stats = await statsRes.json();
    assert(statsRes.status === 200, 'Dashboard stats API returns 200 OK');
    assert(typeof stats.totalRegions === 'number', `Total regions metric present (${stats.totalRegions})`);
    assert(typeof stats.foodKits === 'number', `Food kits stock present (${stats.foodKits})`);
    assert(typeof stats.medicineKits === 'number', `Medicine kits stock present (${stats.medicineKits})`);
    assert(typeof stats.totalTeams === 'number', `Total rescue teams metric present (${stats.totalTeams})`);

    // 3. Affected Regions Roster
    console.log('\n--- TEST 3: Affected Regions Roster ---');
    const regionsRes = await fetch(`${BASE_URL}/regions`, { headers: authHeaders });
    const regions = await regionsRes.json();
    assert(regionsRes.status === 200, 'Affected regions API returns 200 OK');
    assert(Array.isArray(regions) && regions.length > 0, `Regions list populated (${regions.length} regions found)`);
    const sampleRegion = regions[0];
    assert(sampleRegion.regionId != null, `Region has regionId (#${sampleRegion.regionId})`);
    assert(sampleRegion.regionName != null, `Region has regionName (${sampleRegion.regionName})`);
    assert(sampleRegion.severity != null, `Region has severity (${sampleRegion.severity})`);

    // 4. Resource Inventory Tracking
    console.log('\n--- TEST 4: Resource Inventory Tracking ---');
    const invRes = await fetch(`${BASE_URL}/inventory`, { headers: authHeaders });
    const inventory = await invRes.json();
    assert(invRes.status === 200, 'Inventory API returns 200 OK');
    assert(inventory.foodKits >= 0, `Available food kits: ${inventory.foodKits}`);
    assert(inventory.medicineKits >= 0, `Available medicine kits: ${inventory.medicineKits}`);

    // 5. Resource Allocation Workflow
    console.log('\n--- TEST 5: Resource Allocation Workflow ---');
    const targetRegion = regions[0];
    const initialFood = inventory.foodKits;
    const initialMed = inventory.medicineKits;

    // Test excessive allocation rejection
    const excessRes = await fetch(`${BASE_URL}/allocation/allocate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            regionId: targetRegion.regionId,
            foodKits: initialFood + 999999,
            medicalKits: 0
        })
    });
    assert(excessRes.status === 400, 'Excessive allocation beyond warehouse stock is rejected with 400 Bad Request');

    // Test valid allocation
    const allocQty = 2;
    if (initialFood >= allocQty && initialMed >= allocQty) {
        const validAllocRes = await fetch(`${BASE_URL}/allocation/allocate`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                regionId: targetRegion.regionId,
                foodKits: allocQty,
                medicalKits: allocQty
            })
        });
        const validAllocData = await validAllocRes.json();
        assert(validAllocRes.status === 200, `Direct allocation executed: ${validAllocData.message}`);

        // Verify warehouse stock was deducted
        const invAfterRes = await fetch(`${BASE_URL}/inventory`, { headers: authHeaders });
        const invAfter = await invAfterRes.json();
        assert(invAfter.foodKits === initialFood - allocQty, `Warehouse food stock deducted by ${allocQty} (now ${invAfter.foodKits})`);
        assert(invAfter.medicineKits === initialMed - allocQty, `Warehouse medicine stock deducted by ${allocQty} (now ${invAfter.medicineKits})`);
    } else {
        console.log('  [SKIP] Skipping valid allocation deduction test due to low initial stock.');
    }

    // 6. Rescue Team Management & Assignment Workflow
    console.log('\n--- TEST 6: Rescue Team Management & Assignment ---');
    const teamsRes = await fetch(`${BASE_URL}/rescue-teams`, { headers: authHeaders });
    const teams = await teamsRes.json();
    assert(teamsRes.status === 200, 'Rescue teams API returns 200 OK');
    assert(Array.isArray(teams) && teams.length > 0, `Teams list populated (${teams.length} teams found)`);

    // Find or make an available team
    let testTeam = teams.find(t => t.available);
    if (!testTeam) {
        await fetch(`${BASE_URL}/rescue-teams/${teams[0].teamId}/release`, { method: 'POST', headers: authHeaders });
        const refTeams = await (await fetch(`${BASE_URL}/rescue-teams`, { headers: authHeaders })).json();
        testTeam = refTeams.find(t => t.teamId === teams[0].teamId);
    }
    assert(testTeam && testTeam.available, `Found available team #${testTeam.teamId} (${testTeam.teamName})`);

    // Assign team to region
    const assignRes = await fetch(`${BASE_URL}/rescue-teams/${testTeam.teamId}/assign`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ regionId: targetRegion.regionId })
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 200, `Team #${testTeam.teamId} successfully deployed to region #${targetRegion.regionId}`);

    // Verify team is now BUSY
    const updatedTeams = await (await fetch(`${BASE_URL}/rescue-teams`, { headers: authHeaders })).json();
    const assignedTeamState = updatedTeams.find(t => t.teamId === testTeam.teamId);
    assert(assignedTeamState && !assignedTeamState.available, `Team #${testTeam.teamId} status updated to BUSY`);

    // Verify assigning already busy team is REJECTED
    const doubleAssignRes = await fetch(`${BASE_URL}/rescue-teams/${testTeam.teamId}/assign`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ regionId: targetRegion.regionId })
    });
    assert(doubleAssignRes.status === 400, 'Attempting to assign an already busy team is rejected with 400 Bad Request');

    // Release team back to available
    const releaseRes = await fetch(`${BASE_URL}/rescue-teams/${testTeam.teamId}/release`, {
        method: 'POST',
        headers: authHeaders
    });
    assert(releaseRes.status === 200, `Team #${testTeam.teamId} released back to standby`);

    const releasedTeams = await (await fetch(`${BASE_URL}/rescue-teams`, { headers: authHeaders })).json();
    const releasedTeamState = releasedTeams.find(t => t.teamId === testTeam.teamId);
    assert(releasedTeamState && releasedTeamState.available, `Team #${testTeam.teamId} status reverted to AVAILABLE`);

    // 7. Shelter Management & Capacity Safeguard
    console.log('\n--- TEST 7: Shelter Management ---');
    const sheltersRes = await fetch(`${BASE_URL}/shelters`, { headers: authHeaders });
    const shelters = await sheltersRes.json();
    assert(sheltersRes.status === 200, 'Shelters API returns 200 OK');
    assert(Array.isArray(shelters) && shelters.length > 0, `Shelters list populated (${shelters.length} shelters found)`);

    const totalCap = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
    const totalOcc = shelters.reduce((acc, s) => acc + (s.occupied || 0), 0);
    const totalAvail = Math.max(0, totalCap - totalOcc);
    assert(totalCap > 0, `Total shelter capacity: ${totalCap}`);
    assert(totalAvail >= 0, `Available shelter capacity: ${totalAvail}`);

    // 8. Roads & Routing Verification
    console.log('\n--- TEST 8: Roads & Dijkstra Routing ---');
    const roadsRes = await fetch(`${BASE_URL}/roads`, { headers: authHeaders });
    const roads = await roadsRes.json();
    assert(roadsRes.status === 200, 'Road network API returns 200 OK');
    assert(Array.isArray(roads) && roads.length > 0, `Road network populated (${roads.length} segments found)`);

    // Route test
    const routeRes = await fetch(`${BASE_URL}/routes/shortest-time?source=Aruvi%20Village&destination=Kurinji%20Nagar`, {
        headers: authHeaders
    });
    assert(routeRes.status === 200, `Dijkstra shortest-time route API returns 200 OK`);
    const routeData = await routeRes.json();
    assert(routeData.reachable === true, `Route is reachable: ${routeData.reachable}`);
    assert(routeData.travelTime === 15, `Shortest travel time calculated accurately: ${routeData.travelTime} mins`);
    assert(Array.isArray(routeData.candidateRoutes) && routeData.candidateRoutes.length >= 1, `Candidate routes generated (${routeData.candidateRoutes.length} routes)`);

    // 9. Response Monitoring Data Integrity
    console.log('\n--- TEST 9: Response Monitoring Data Integrity ---');
    const reqsRes = await fetch(`${BASE_URL}/requests`, { headers: authHeaders });
    const requests = await reqsRes.json();
    assert(reqsRes.status === 200, 'Emergency requests API returns 200 OK');
    assert(Array.isArray(requests), `Requests roster loaded (${requests.length} requests in queue)`);

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runCoordinatorTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
