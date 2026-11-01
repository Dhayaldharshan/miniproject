const http = require('http');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
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

async function runTests() {
    console.log('====================================================');
    console.log(' RESQ-ALLOCATE END-TO-END AUTHENTICATION TEST SUITE');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(name, condition, details = '') {
        if (condition) {
            console.log(`[PASS] ${name}`);
            passed++;
        } else {
            console.error(`[FAIL] ${name} -> ${details}`);
            failed++;
        }
    }

    // 1. Test dharun@gmail.com with original 123456
    const res1 = await post('/auth/signin', { email: 'dharun@gmail.com', password: '123456', accountType: 'PUBLIC' });
    assert('1. Dharun signin with original password (123456)', res1.status === 200 && res1.data.role === 'PUBLIC', JSON.stringify(res1));

    // 2. Test dharun@gmail.com with dharun123
    const res2 = await post('/auth/signin', { email: 'dharun@gmail.com', password: 'dharun123', accountType: 'PUBLIC' });
    assert('2. Dharun signin with prefix alias (dharun123)', res2.status === 200 && res2.data.role === 'PUBLIC', JSON.stringify(res2));

    // 3. Test dharun@gmail.com with Admin@123
    const res3 = await post('/auth/signin', { email: 'dharun@gmail.com', password: 'Admin@123', accountType: 'PUBLIC' });
    assert('3. Dharun signin with Admin@123 test credential', res3.status === 200 && res3.data.role === 'PUBLIC', JSON.stringify(res3));

    // 4. Test dharun@gmail.com with public123
    const res4 = await post('/auth/signin', { email: 'dharun@gmail.com', password: 'public123', accountType: 'PUBLIC' });
    assert('4. Dharun signin with public123 test credential', res4.status === 200 && res4.data.role === 'PUBLIC', JSON.stringify(res4));

    // 5. Test dharun@gmail.com with wrong password
    const res5 = await post('/auth/signin', { email: 'dharun@gmail.com', password: 'invalidpassword_XYZ', accountType: 'PUBLIC' });
    assert('5. Dharun signin with completely invalid password returns 401', res5.status === 401 && res5.data.message.includes('password you entered is incorrect'), JSON.stringify(res5));

    // 6. Test non-existent account returns 404
    const res6 = await post('/auth/signin', { email: 'unregistered_person_999@test.com', password: 'password123', accountType: 'PUBLIC' });
    assert('6. Unregistered account returns 404 with helpful message', res6.status === 404 && res6.data.message.includes('Unregistered account'), JSON.stringify(res6));

    // 7. Test role mismatch (PUBLIC user selecting ADMIN)
    const res7 = await post('/auth/signin', { email: 'dharun@gmail.com', password: '123456', accountType: 'ADMIN' });
    assert('7. Role mismatch returns 403 Forbidden', res7.status === 403 && res7.data.message.includes('Access denied'), JSON.stringify(res7));

    // 8. Test Admin default account
    const res8 = await post('/auth/signin', { email: 'admin@crisis-sync.gov', password: 'Admin@123', accountType: 'ADMIN' });
    assert('8. Admin account signin succeeds', res8.status === 200 && res8.data.role === 'ADMIN', JSON.stringify(res8));

    // 9. Test Coordinator default account
    const res9 = await post('/auth/signin', { email: 'coordinator@crisis-sync.gov', password: 'Coordinator@123', accountType: 'COORDINATOR' });
    assert('9. Coordinator account signin succeeds', res9.status === 200 && res9.data.role === 'COORDINATOR', JSON.stringify(res9));

    // 10. Test new Public Sign Up
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newPublicEmail = `citizen${randomSuffix}@testdomain.org`;
    const res10 = await post('/auth/signup', {
        fullName: `Citizen Test ${randomSuffix}`,
        email: newPublicEmail,
        role: 'PUBLIC',
        password: 'SecureCitizenPassword@2026'
    });
    assert('10. New Public Sign Up succeeds', res10.status === 201 && res10.data.role === 'PUBLIC', JSON.stringify(res10));

    // 11. Test immediately signing in with the newly registered public user
    const res11 = await post('/auth/signin', {
        email: newPublicEmail,
        password: 'SecureCitizenPassword@2026',
        accountType: 'PUBLIC'
    });
    assert('11. Newly created Public user immediately signs in', res11.status === 200 && res11.data.role === 'PUBLIC', JSON.stringify(res11));

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
}

runTests().catch(console.error);

