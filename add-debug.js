const fs = require('fs');

let code = fs.readFileSync('frontend/app.js', 'utf8');

code = code.replace(
  'function navigateTo(viewId) {',
  'function navigateTo(viewId) {\n        console.log("[DEBUG-TRACE] navigateTo called with viewId:", viewId);'
);

code = code.replace(
  'async function refreshCurrentViewData() {',
  'async function refreshCurrentViewData() {\n        console.log("[DEBUG-TRACE] refreshCurrentViewData called, view:", state.currentView, "user:", state.currentUser?.role);'
);

code = code.replace(
  'async function loadRegionsData() {',
  'async function loadRegionsData() {\n        console.log("[DEBUG-TRACE] loadRegionsData called!");'
);

code = code.replace(
  'function renderRegionsTable(regions) {',
  'function renderRegionsTable(regions) {\n        console.log("[DEBUG-TRACE] renderRegionsTable called with count:", regions?.length);'
);

fs.writeFileSync('frontend/app.js', code, 'utf8');
fs.writeFileSync('app.js', code, 'utf8');
console.log('Added debug logs.');

