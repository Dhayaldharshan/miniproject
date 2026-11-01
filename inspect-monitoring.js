const fs = require('fs');
const api = fs.readFileSync('frontend/api.js', 'utf8');

const regIdx = api.indexOf('getRegions(');
console.log(api.substring(regIdx, regIdx + 400));
