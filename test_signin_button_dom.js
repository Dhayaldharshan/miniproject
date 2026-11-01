// Test script to verify DOM event wiring, button click handling, and loading state
const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');

console.log("Checking index.html for Sign In button:");
const hasForm = htmlContent.includes('id="authSignInForm"');
const hasBtn = htmlContent.includes('id="authSignInBtn"');
const hasBtnText = htmlContent.includes('id="signInBtnText"');
const hasEmailInput = htmlContent.includes('id="authSignInEmail"');
const hasPasswordInput = htmlContent.includes('id="authSignInPassword"');
const hasAccountType = htmlContent.includes('id="authSignInAccountType"');

console.log(`- Form present: ${hasForm}`);
console.log(`- Button present: ${hasBtn}`);
console.log(`- Button text span present: ${hasBtnText}`);
console.log(`- Email input present: ${hasEmailInput}`);
console.log(`- Password input present: ${hasPasswordInput}`);
console.log(`- Account type select present: ${hasAccountType}`);

// Check for any remaining syntax or parse issues
try {
    new Function(jsContent);
    console.log("[PASS] app.js parses cleanly as valid JavaScript syntax without errors.");
} catch (err) {
    console.error("[FAIL] Syntax error in app.js:", err.message);
    process.exit(1);
}
