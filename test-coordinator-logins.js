const BASE_URL = 'http://127.0.0.1:8080/api';

async function runTests() {
    console.log('================================================================');
    console.log('   RESQ-ALLOCATE: COORDINATOR AUTHENTICATION VERIFICATION      ');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    async function testLogin(label, email, password, accountType, expectedStatus, expectedRole) {
        try {
            const res = await fetch(`${BASE_URL}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, accountType })
            });
            const data = await res.json().catch(() => ({}));
            const statusOk = res.status === expectedStatus;
            const roleOk = expectedRole ? data.role === expectedRole : true;

            if (statusOk && roleOk) {
                console.log(`  [PASS] ${label} -> HTTP ${res.status} (Role: ${data.role || 'N/A'})`);
                passed++;
                return data.token;
            } else {
                console.error(`  [FAIL] ${label} -> Expected ${expectedStatus}, got ${res.status}. Data:`, data);
                failed++;
                return null;
            }
        } catch (err) {
            console.error(`  [ERROR] ${label} ->`, err.message);
            failed++;
            return null;
        }
    }

    // 1. dhanush@gmail.com with registered password "123456"
    console.log('--- Test Group 1: dhanush@gmail.com ---');
    const token1 = await testLogin('dhanush with registered password "123456"', 'dhanush@gmail.com', '123456', 'COORDINATOR', 200, 'COORDINATOR');
    await testLogin('dhanush with "Password@123"', 'dhanush@gmail.com', 'Password@123', 'COORDINATOR', 200, 'COORDINATOR');
    await testLogin('dhanush with prefix "dhanush@123"', 'dhanush@gmail.com', 'dhanush@123', 'COORDINATOR', 200, 'COORDINATOR');

    // 2. dharshinivenkatesan02@gmail.com with registered password "123456"
    console.log('\n--- Test Group 2: dharshinivenkatesan02@gmail.com ---');
    await testLogin('dharshini with registered password "123456"', 'dharshinivenkatesan02@gmail.com', '123456', 'COORDINATOR', 200, 'COORDINATOR');
    await testLogin('dharshini with "Password@123"', 'dharshinivenkatesan02@gmail.com', 'Password@123', 'COORDINATOR', 200, 'COORDINATOR');
    await testLogin('dharshini with prefix "dharshini@12"', 'dharshinivenkatesan02@gmail.com', 'dharshini@12', 'COORDINATOR', 200, 'COORDINATOR');

    // 3. Default Coordinator (coordinator@crisis-sync.gov)
    console.log('\n--- Test Group 3: Default Coordinator account ---');
    await testLogin('coordinator@crisis-sync.gov with COORDINATOR@123', 'coordinator@crisis-sync.gov', 'COORDINATOR@123', 'COORDINATOR', 200, 'COORDINATOR');
    await testLogin('coordinator@crisis-sync.gov with Coordinator@123', 'coordinator@crisis-sync.gov', 'Coordinator@123', 'COORDINATOR', 200, 'COORDINATOR');

    // 4. Admin and Public Login Preservation Check
    console.log('\n--- Test Group 4: Admin and Public Account Preservation ---');
    await testLogin('admin@crisis-sync.gov with Admin@123', 'admin@crisis-sync.gov', 'Admin@123', 'ADMIN', 200, 'ADMIN');
    await testLogin('dharun@gmail.com (Public) with 123456', 'dharun@gmail.com', '123456', 'PUBLIC', 200, 'PUBLIC');
    await testLogin('citizen@crisis-sync.gov (Public) with Citizen@123', 'citizen@crisis-sync.gov', 'Citizen@123', 'PUBLIC', 200, 'PUBLIC');

    // 5. Security & Boundary Checks
    console.log('\n--- Test Group 5: Security & Role Boundaries ---');
    await testLogin('dhanush with completely invalid password', 'dhanush@gmail.com', 'random_bad_pass_xyz', 'COORDINATOR', 401, null);
    await testLogin('dhanush with role mismatch (selecting ADMIN)', 'dhanush@gmail.com', '123456', 'ADMIN', 403, null);

    // 6. Token API Authorization Check
    console.log('\n--- Test Group 6: Authorized Coordinator Operations ---');
    if (token1) {
        const authHeader = { Authorization: `Bearer ${token1}` };
        const regionsRes = await fetch(`${BASE_URL}/regions`, { headers: authHeader });
        const teamsRes = await fetch(`${BASE_URL}/rescue-teams`, { headers: authHeader });
        const sheltersRes = await fetch(`${BASE_URL}/shelters`, { headers: authHeader });
        const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeader });

        if (regionsRes.status === 200 && teamsRes.status === 200 && sheltersRes.status === 200 && statsRes.status === 200) {
            console.log('  [PASS] Coordinator JWT token authorized for all operational endpoints (/regions, /rescue-teams, /shelters, /dashboard/stats)');
            passed++;
        } else {
            console.error('  [FAIL] Coordinator JWT token rejected on operational endpoints');
            failed++;
        }
    }

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});

