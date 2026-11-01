// Simulate browser environment and run full app.js initialization and button click
const fs = require('fs');
const path = require('path');

// Mock a lightweight browser DOM
class MockElement {
    constructor(id, tagName = 'div') {
        this.id = id;
        this.tagName = tagName;
        this.classes = new Set();
        this.classList = {
            add: (c) => this.classes.add(c),
            remove: (c) => this.classes.delete(c),
            contains: (c) => this.classes.has(c)
        };
        this.style = {};
        this.value = '';
        this.innerHTML = '';
        this.textContent = '';
        this.listeners = {};
        this.disabled = false;
        this.type = (tagName === 'button') ? 'submit' : (tagName === 'input' ? 'text' : '');
    }

    addEventListener(event, handler) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
    }

    async dispatchEvent(event) {
        const type = (typeof event === 'string') ? event : event.type;
        const handlers = this.listeners[type] || [];
        for (const h of handlers) {
            await h(event);
        }
    }

    async requestSubmit() {
        await this.dispatchEvent(new Event('submit'));
    }

    getAttribute(name) {
        if (name === 'type') return this.type;
        return null;
    }

    setAttribute(name, val) {
        if (name === 'type') this.type = val;
    }

    querySelector() { return null; }
    querySelectorAll() { return []; }
}

const elementsMap = {};
function getEl(id, tag = 'div') {
    if (!elementsMap[id]) elementsMap[id] = new MockElement(id, tag);
    return elementsMap[id];
}

const mockDocument = {
    getElementById: (id) => getEl(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (event, handler) => {
        if (event === 'DOMContentLoaded') {
            mockDocument.domLoadedHandler = handler;
        }
    },
    title: ''
};

const mockWindow = {
    location: { hash: '', hostname: 'localhost', port: '8080', origin: 'http://localhost:8080' },
    addEventListener: () => {},
    dispatchEvent: () => {}
};

const mockSessionStorage = {
    data: {},
    getItem: (k) => mockSessionStorage.data[k] || null,
    setItem: (k, v) => { mockSessionStorage.data[k] = String(v); },
    removeItem: (k) => { delete mockSessionStorage.data[k]; }
};

let capturedSignInPayload = null;
const mockResqApi = {
    signIn: async (email, password, accountType) => {
        capturedSignInPayload = { email, password, accountType };
        if (password === 'WrongPassword') {
            throw new Error('Invalid credentials. Please verify your Email or Admin ID and password.');
        }
        return {
            token: 'mock-jwt-token-12345',
            email: 'admin@crisis-sync.gov',
            fullName: 'Chief Disaster Administrator',
            role: 'ADMIN',
            message: 'Authentication successful.'
        };
    }
};

// Set up globals
global.document = mockDocument;
global.window = mockWindow;
global.sessionStorage = mockSessionStorage;
global.ResqApi = mockResqApi;
global.Event = function(type) { this.type = type; this.preventDefault = () => {}; };

// Load and run app.js
require('../frontend/app.js');

// Trigger DOMContentLoaded
if (mockDocument.domLoadedHandler) {
    mockDocument.domLoadedHandler();
    console.log("[PASS] DOMContentLoaded triggered successfully.");
} else {
    console.error("[FAIL] DOMContentLoaded handler was not registered!");
    process.exit(1);
}

const signInForm = getEl('authSignInForm', 'form');
const signInBtn = getEl('authSignInBtn', 'button');
const emailInput = getEl('authSignInEmail', 'input');
const passwordInput = getEl('authSignInPassword', 'input');
const accountTypeSelect = getEl('authSignInAccountType', 'select');
const alertBox = getEl('authAlertMessage');
const authScreen = getEl('authScreen');
const dashboardScreen = getEl('dashboardScreen');

// Run Tests
(async () => {
    // TEST 1: Empty credentials validation
    emailInput.value = '';
    passwordInput.value = '';
    await signInForm.dispatchEvent(new Event('submit'));

    const emailErr = getEl('errorSignInEmail');
    const passErr = getEl('errorSignInPassword');
    console.log(`[TEST 1 - Empty Fields] Email error visible: ${emailErr.classList.contains('visible')}, Password error visible: ${passErr.classList.contains('visible')}`);

    // TEST 2: Invalid credentials test
    emailInput.value = 'admin@crisis-sync.gov';
    passwordInput.value = 'WrongPassword';
    accountTypeSelect.value = 'ADMIN';

    await signInForm.dispatchEvent(new Event('submit'));
    console.log(`[TEST 2 - Wrong Password] Alert text: '${alertBox.textContent}', Alert display: '${alertBox.style.display}'`);

    // TEST 3: Valid Admin Sign In test via form submit
    emailInput.value = 'admin@crisis-sync.gov';
    passwordInput.value = 'Admin@123';
    accountTypeSelect.value = 'ADMIN';

    await signInForm.dispatchEvent(new Event('submit'));
    console.log(`[TEST 3 - Valid Admin] Payload sent:`, capturedSignInPayload);
    console.log(`[TEST 3 - Valid Admin] Token stored: ${mockSessionStorage.getItem('crisis_sync_token') !== null}`);
    console.log(`[TEST 3 - Valid Admin] Auth screen display: '${authScreen.style.display}', Dashboard screen display: '${dashboardScreen.style.display}'`);
    console.log(`[TEST 3 - Valid Admin] Document title: '${mockDocument.title}'`);

    // TEST 4: Direct button click when button has type="button"
    signInBtn.setAttribute('type', 'button');
    capturedSignInPayload = null;
    emailInput.value = 'admin';
    passwordInput.value = 'admin';
    accountTypeSelect.value = 'ADMIN';

    await signInBtn.dispatchEvent(new Event('click'));
    console.log(`[TEST 4 - Direct Button Click] Payload sent:`, capturedSignInPayload);
    console.log(`[TEST 4 - Direct Button Click] Success.`);
})();
