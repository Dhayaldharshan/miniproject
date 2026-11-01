const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');

const tStart = html.indexOf('id="view-teams"');
const tEnd = html.indexOf('id="view-shelters"');
console.log('--- VIEW TEAMS ---');
console.log(html.substring(tStart, tEnd));

const sStart = html.indexOf('id="view-shelters"');
const sEnd = html.indexOf('id="view-roads"');
console.log('--- VIEW SHELTERS ---');
console.log(html.substring(sStart, sEnd));

const mStart = html.indexOf('id="view-monitoring"');
const mEnd = html.indexOf('<!-- End Application Main Views -->', mStart);
console.log('--- VIEW MONITORING ---');
console.log(html.substring(mStart, mEnd));

