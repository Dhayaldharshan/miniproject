const BASE_URL = 'http://127.0.0.1:8080/api';

async function testPublicToCoordinatorSync() {
    console.log('Testing Public Report submission -> Coordinator Panel synchronization...');

    // 1. Sign up as Public User
    const pubEmail = 'resident_' + Math.floor(Math.random() * 10000) + '@crisis-sync.gov';
    const pubPwd = 'Public@123';

    const regRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fullName: 'Resident Citizen',
            email: pubEmail,
            password: pubPwd,
            role: 'PUBLIC'
        })
    });
    const regData = await regRes.json();
    console.log('Public user registered:', regData.email, 'Role:', regData.role);

    const pubToken = regData.token;

    // 2. Submit Public Report via /regions/public-report with requiredAssistance
    const testRegionName = 'Kodaikanal Valley - Test ' + Math.floor(Math.random() * 1000);
    const pubRes = await fetch(`${BASE_URL}/regions/public-report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pubToken}`
        },
        body: JSON.stringify({
            regionName: testRegionName,
            disasterType: 'Landslide',
            severity: 4,
            population: 1850,
            roadAccessible: false,
            description: 'Major slope failure blocking access road; immediate rations and excavation teams required.',
            requiredAssistance: ['food', 'medicine', 'teams', 'shelters'],
            foodQuantity: 50,
            medicineQuantity: 30,
            rescueTeamsQuantity: 2,
            shelterPeopleQuantity: 45
        })
    });

    if (pubRes.status !== 200 && pubRes.status !== 201) {
        console.error('Failed to submit public report:', pubRes.status, await pubRes.text());
        process.exit(1);
    }
    const pubData = await pubRes.json();
    console.log('Public Report Submitted Successfully:', pubData.regionName, 'ID:', pubData.regionId);

    // 3. Log in as Coordinator
    const coordLogin = await fetch(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'coordinator@crisis-sync.gov',
            password: 'COORDINATOR@123',
            accountType: 'COORDINATOR'
        })
    });
    const { token: coordToken } = await coordLogin.json();

    // 4. Fetch Regions in Coordinator Panel
    const listRes = await fetch(`${BASE_URL}/regions`, {
        headers: { Authorization: `Bearer ${coordToken}` }
    });
    const regions = await listRes.json();
    const createdRegion = regions.find(r => r.regionName === testRegionName);

    if (!createdRegion) {
        console.error('FAILED: Created region not found in Coordinator regions roster!');
        process.exit(1);
    }
    console.log('[PASS] Created region found in Coordinator Panel:', createdRegion.regionName, '(#ID:', createdRegion.regionId, ')');
    console.log('  Disaster Type:', createdRegion.disasterType);
    console.log('  Description:', createdRegion.description);

    // 5. Fetch Requests in Coordinator Panel
    const reqRes = await fetch(`${BASE_URL}/requests`, {
        headers: { Authorization: `Bearer ${coordToken}` }
    });
    const requests = await reqRes.json();
    const regionRequests = requests.filter(r => (r.region?.regionId === createdRegion.regionId) || (r.regionId === createdRegion.regionId));

    console.log(`[PASS] Found ${regionRequests.length} emergency requests created for this region:`);
    regionRequests.forEach(rq => {
        console.log(`  Req #${rq.requestId} [${rq.requestType}] Food: ${rq.foodRequired}, Med: ${rq.medicineRequired}, Teams: ${rq.teamsRequired}, Rescue: ${rq.peopleToRescue}`);
    });

    if (regionRequests.length === 0) {
        console.error('FAILED: No requests were linked to the newly created region!');
        process.exit(1);
    }

    console.log('\nAll synchronization checks between Public Panel and Coordinator Panel PASSED!');
}

testPublicToCoordinatorSync().catch(console.error);
