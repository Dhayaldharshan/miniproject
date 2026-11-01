const fs = require('fs');

let code = fs.readFileSync('frontend/app.js', 'utf8');

code = code.replace(
  'async function checkBackendConnection() {',
  `async function checkBackendConnection() {
        console.log("[DEBUG-TRACE] checkBackendConnection: START");`
);

code = code.replace(
  'const healthy = await ResqApi.checkHealth();',
  `const healthy = await ResqApi.checkHealth();
            console.log("[DEBUG-TRACE] checkBackendConnection: ResqApi.checkHealth returned", healthy);`
);

code = code.replace(
  'const connected = await checkBackendConnection();',
  `const connected = await checkBackendConnection();
        console.log("[DEBUG-TRACE] refreshCurrentViewData: checkBackendConnection returned", connected);`
);

code = code.replace(
  'case \'regions\':',
  `case 'regions':
                    console.log("[DEBUG-TRACE] refreshCurrentViewData: about to call loadRegionsData()");`
);

fs.writeFileSync('frontend/app.js', code, 'utf8');
fs.writeFileSync('app.js', code, 'utf8');
console.log('Added more debug logs.');

