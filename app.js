/**
 * ResQ-Allocate - Emergency Command & Control Center
 * Application Controller: Authentication Gatekeeper, View Router, Real API Integration, and Operations Logic.
 */

function initResQApp() {
    // Application State
    const state = {
        currentUser: null,
        currentView: 'dashboard',
        regions: [],
        requests: [],
        teams: [],
        shelters: [],
        roads: [],
        inventory: { foodKits: 0, medicineKits: 0 },
        isRegionPriorityMode: true
    };

    // DOM Elements Mapping
    const elements = {
        // High-level Screen Containers
        authScreen: document.getElementById('authScreen'),
        dashboardScreen: document.getElementById('dashboardScreen'),

        // Auth Tabs & Forms
        authTabSignIn: document.getElementById('authTabSignIn'),
        authTabSignUp: document.getElementById('authTabSignUp'),
        linkToSignUp: document.getElementById('linkToSignUp'),
        linkToSignIn: document.getElementById('linkToSignIn'),
        authSignInForm: document.getElementById('authSignInForm'),
        authSignUpForm: document.getElementById('authSignUpForm'),
        authAlertMessage: document.getElementById('authAlertMessage'),

        // Sign In Fields
        authSignInEmail: document.getElementById('authSignInEmail'),
        authSignInPassword: document.getElementById('authSignInPassword'),
        authSignInAccountType: document.getElementById('authSignInAccountType'),
        toggleSignInPassword: document.getElementById('toggleSignInPassword'),
        errorSignInEmail: document.getElementById('errorSignInEmail'),
        errorSignInPassword: document.getElementById('errorSignInPassword'),
        authSignInBtn: document.getElementById('authSignInBtn'),
        signInBtnText: document.getElementById('signInBtnText'),

        // Sign Up Fields
        authSignUpName: document.getElementById('authSignUpName'),
        authSignUpEmail: document.getElementById('authSignUpEmail'),
        authSignUpRole: document.getElementById('authSignUpRole'),
        authSignUpPassword: document.getElementById('authSignUpPassword'),
        authSignUpConfirmPassword: document.getElementById('authSignUpConfirmPassword'),
        toggleSignUpPassword: document.getElementById('toggleSignUpPassword'),
        toggleSignUpConfirmPassword: document.getElementById('toggleSignUpConfirmPassword'),
        errorSignUpName: document.getElementById('errorSignUpName'),
        errorSignUpEmail: document.getElementById('errorSignUpEmail'),
        errorSignUpPassword: document.getElementById('errorSignUpPassword'),
        errorSignUpConfirmPassword: document.getElementById('errorSignUpConfirmPassword'),
        authSignUpBtn: document.getElementById('authSignUpBtn'),
        signUpBtnText: document.getElementById('signUpBtnText'),

        // Dashboard Navigation & Topbar
        views: document.querySelectorAll('.app-view'),
        // Public Incident Reporting Form Elements
        publicReportView: document.getElementById('view-public-report'),
        publicReportForm: document.getElementById('publicReportForm'),
        publicRegionName: document.getElementById('publicRegionName'),
        publicDisasterType: document.getElementById('publicDisasterType'),
        publicSeverity: document.getElementById('publicSeverity'),
        publicPopulation: document.getElementById('publicPopulation'),
        publicAccessibility: document.getElementById('publicAccessibility'),
        publicDescription: document.getElementById('publicDescription'),
        publicSubmitBtn: document.getElementById('publicSubmitBtn'),
        publicSubmitBtnText: document.getElementById('publicSubmitBtnText'),
        publicReportSuccessBox: document.getElementById('publicReportSuccessBox'),
        publicSuccessDetails: document.getElementById('publicSuccessDetails'),
        publicReportNewBtn: document.getElementById('publicReportNewBtn'),
        publicReportErrorBox: document.getElementById('publicReportErrorBox'),
        publicReportErrorMessage: document.getElementById('publicReportErrorMessage'),
        errorPublicRegionName: document.getElementById('errorPublicRegionName'),
        // Public Assistance Resource Cards & Quantities
        assistFoodCheck: document.getElementById('assistFoodCheck'),
        assistMedCheck: document.getElementById('assistMedCheck'),
        assistTeamsCheck: document.getElementById('assistTeamsCheck'),
        assistSheltersCheck: document.getElementById('assistSheltersCheck'),
        assistanceItemFood: document.getElementById('assistanceItemFood'),
        assistanceItemMed: document.getElementById('assistanceItemMed'),
        assistanceItemTeams: document.getElementById('assistanceItemTeams'),
        assistanceItemShelters: document.getElementById('assistanceItemShelters'),
        qtyContainerFood: document.getElementById('qtyContainerFood'),
        qtyContainerMed: document.getElementById('qtyContainerMed'),
        qtyContainerTeams: document.getElementById('qtyContainerTeams'),
        qtyContainerShelters: document.getElementById('qtyContainerShelters'),
        qtyFoodInput: document.getElementById('qtyFoodInput'),
        qtyMedInput: document.getElementById('qtyMedInput'),
        qtyTeamsInput: document.getElementById('qtyTeamsInput'),
        qtySheltersInput: document.getElementById('qtySheltersInput'),
        errorQtyFood: document.getElementById('errorQtyFood'),
        errorQtyMed: document.getElementById('errorQtyMed'),
        errorQtyTeams: document.getElementById('errorQtyTeams'),
        errorQtyShelters: document.getElementById('errorQtyShelters'),

        // Coordinator Dashboard Telemetry Elements
        coordStatHighSev: document.getElementById('coordStatHighSev'),
        coordStatPendingReqs: document.getElementById('coordStatPendingReqs'),
        coordStatTeamsStatus: document.getElementById('coordStatTeamsStatus'),
        coordStatShelterUsage: document.getElementById('coordStatShelterUsage'),
        coordRecentReportsBody: document.getElementById('coordRecentReportsBody'),
        btnRefreshCoordDashboard: document.getElementById('btnRefreshCoordDashboard'),

        // Resource Allocation Elements
        allocStockFood: document.getElementById('allocStockFood'),
        allocStockMed: document.getElementById('allocStockMed'),
        allocTotalDispatched: document.getElementById('allocTotalDispatched'),
        allocTotalDeficit: document.getElementById('allocTotalDeficit'),
        directAllocationForm: document.getElementById('directAllocationForm'),
        allocRegionSelect: document.getElementById('allocRegionSelect'),
        allocRegionDemandBox: document.getElementById('allocRegionDemandBox'),
        allocDemandTitle: document.getElementById('allocDemandTitle'),
        allocDemandDetails: document.getElementById('allocDemandDetails'),
        allocFoodInput: document.getElementById('allocFoodInput'),
        allocMedInput: document.getElementById('allocMedInput'),
        allocFoodHint: document.getElementById('allocFoodHint'),
        allocMedHint: document.getElementById('allocMedHint'),
        allocErrorBox: document.getElementById('allocErrorBox'),
        allocSubmitBtn: document.getElementById('allocSubmitBtn'),
        allocSubmitBtnText: document.getElementById('allocSubmitBtnText'),
        allocQueueSupplyCount: document.getElementById('allocQueueSupplyCount'),
        allocQueueRescueCount: document.getElementById('allocQueueRescueCount'),
        allocSearchInput: document.getElementById('allocSearchInput'),
        allocationTableBody: document.getElementById('allocationTableBody'),

        // Team Deployment Elements
        assignTeamForm: document.getElementById('assignTeamForm'),
        assignTeamSelect: document.getElementById('assignTeamSelect'),
        assignRegionSelect: document.getElementById('assignRegionSelect'),
        assignTeamErrorBox: document.getElementById('assignTeamErrorBox'),
        btnAssignTeamSubmit: document.getElementById('btnAssignTeamSubmit'),

        // Response Monitoring Elements
        monStatRegions: document.getElementById('monStatRegions'),
        monStatPending: document.getElementById('monStatPending'),
        monStatTeams: document.getElementById('monStatTeams'),
        monStatTeamsSub: document.getElementById('monStatTeamsSub'),
        monStatShelter: document.getElementById('monStatShelter'),
        monStatShelterSub: document.getElementById('monStatShelterSub'),
        monLastUpdated: document.getElementById('monLastUpdated'),
        btnRefreshMonitoring: document.getElementById('btnRefreshMonitoring'),
        tabMonPending: document.getElementById('tabMonPending'),
        tabMonAllocations: document.getElementById('tabMonAllocations'),
        tabMonTeams: document.getElementById('tabMonTeams'),
        tabMonShelters: document.getElementById('tabMonShelters'),
        monTabContentPending: document.getElementById('monTabContentPending'),
        monTabContentAllocations: document.getElementById('monTabContentAllocations'),
        monTabContentTeams: document.getElementById('monTabContentTeams'),
        monTabContentShelters: document.getElementById('monTabContentShelters'),
        monPendingTableBody: document.getElementById('monPendingTableBody'),
        monAllocationsTableBody: document.getElementById('monAllocationsTableBody'),
        monTeamsTableBody: document.getElementById('monTeamsTableBody'),
        monSheltersTableBody: document.getElementById('monSheltersTableBody'),
        navLinks: document.querySelectorAll('.sidebar-nav .nav-link'),
        breadcrumb: document.getElementById('currentBreadcrumb'),
        pageTitle: document.getElementById('currentPageTitle'),
        connectionStatus: document.getElementById('connectionStatusText'),
        statusDot: document.getElementById('systemStatusDot'),
        offlineBanner: document.getElementById('offlineBanner'),
        publicModeNotice: document.getElementById('publicModeNotice'),
        toastContainer: document.getElementById('toastContainer'),

        // User Identity Elements
        topbarUserName: document.getElementById('topbarUserName'),
        topbarUserAvatar: document.getElementById('topbarUserAvatar'),
        topbarRoleBadge: document.getElementById('topbarRoleBadge'),
        sidebarUserSessionName: document.getElementById('sidebarUserSessionName'),
        sidebarUserSessionRole: document.getElementById('sidebarUserSessionRole'),
        topbarLogoutBtn: document.getElementById('topbarLogoutBtn'),
        sidebarLogoutBtn: document.getElementById('sidebarLogoutBtn'),

        // Confirmation Modal Dialog
        confirmModal: document.getElementById('confirmModal'),
        confirmTitle: document.getElementById('confirmModalTitle'),
        confirmMessage: document.getElementById('confirmModalMessage'),
        confirmBtn: document.getElementById('confirmModalBtn'),
        cancelBtn: document.getElementById('cancelModalBtn'),

        // Operational Forms
        regionForm: document.getElementById('regionForm'),
        stockForm: document.getElementById('stockForm'),
        teamForm: document.getElementById('teamForm'),
        shelterForm: document.getElementById('shelterForm'),
        roadForm: document.getElementById('roadForm'),
        supplyRequestForm: document.getElementById('supplyRequestForm'),
        rescueRequestForm: document.getElementById('rescueRequestForm'),
        completeMissionForm: document.getElementById('completeMissionForm'),
        shelterAllocForm: document.getElementById('shelterAllocForm'),
        routeForm: document.getElementById('routeForm'),
        traversalForm: document.getElementById('traversalForm')
    };

    let pendingConfirmAction = null;

    // Email format validator
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ==========================================================================
    // 1. AUTHENTICATION & SESSION MANAGEMENT
    // ==========================================================================

    /**
     * Initializes authentication state on page load.
     * Enforces the authentication screen as the initial view if no active session exists.
     */
    function initSession() {
        const storedSession = sessionStorage.getItem('crisis_sync_session');
        const storedToken = sessionStorage.getItem('crisis_sync_token');
        if (storedSession && storedToken) {
            try {
                const user = JSON.parse(storedSession);
                if (user && user.email && user.role) {
                    state.currentUser = user;
                    showDashboardScreen(user);
                    return;
                }
            } catch (err) {
                sessionStorage.removeItem('crisis_sync_session');
                sessionStorage.removeItem('crisis_sync_token');
            }
        }

        // Default: Show Authentication Screen, Keep Dashboard completely hidden
        state.currentUser = null;
        showAuthScreen();
    }

    // Auto-logout if unauthorized (401)
    window.addEventListener('resq:unauthorized', () => {
        state.currentUser = null;
        showAuthScreen();
        showAuthAlert('Session expired or unauthorized. Please sign in again.');
    });

    /**
     * Displays the full-screen dark authentication page.
     * Completely hides the dashboard.
     */
    function showAuthScreen() {
        if (elements.authScreen) elements.authScreen.style.display = 'flex';
        if (elements.dashboardScreen) elements.dashboardScreen.style.display = 'none';
        document.title = 'ResQ-Allocate | Authentication';
        clearAllAuthErrors();
    }

    /**
     * Displays the Command & Control dashboard after successful authentication.
     * Applies role-specific clearance and permissions.
     */
        function showDashboardScreen(user) {
        if (elements.authScreen) elements.authScreen.style.display = 'none';
        if (elements.dashboardScreen) elements.dashboardScreen.style.display = 'flex';

        // Update Identity in Topbar and Sidebar
        const displayName = user.fullName || user.email.split('@')[0];
        const initials = displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'OP';

        if (elements.topbarUserName) elements.topbarUserName.textContent = displayName;
        if (elements.topbarUserAvatar) elements.topbarUserAvatar.textContent = initials;
        if (elements.sidebarUserSessionName) elements.sidebarUserSessionName.textContent = displayName;
        if (elements.sidebarUserSessionRole) elements.sidebarUserSessionRole.textContent = `${user.role} Clearance`;

        if (elements.topbarRoleBadge) {
            elements.topbarRoleBadge.textContent = user.role;
            elements.topbarRoleBadge.className = `role-badge ${user.role.toLowerCase()}`;
        }

        // Apply Role Clearance to Dashboard Container
        elements.dashboardScreen.classList.remove('role-admin', 'role-coordinator', 'role-public');
        elements.dashboardScreen.classList.add(`role-${user.role.toLowerCase()}`);

        if (user.role === 'PUBLIC') {
            document.title = 'ResQ-Allocate | Public Incident Report';
            navigateTo('public-report');
        } else if (user.role === 'COORDINATOR') {
            document.title = 'ResQ-Allocate | Disaster Response Coordinator Panel';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        } else {
            document.title = 'ResQ-Allocate | Emergency Command & Control Center';
            const activeHash = window.location.hash.replace('#', '') || 'dashboard';
            navigateTo(activeHash === 'signin' || activeHash === 'signup' || activeHash === 'public-report' ? 'dashboard' : activeHash);
        }
    }

    /**
     * Logs out the user, destroys the session, and returns to the Sign In screen.
     */
    function logout() {
        sessionStorage.removeItem('crisis_sync_session');
        sessionStorage.removeItem('crisis_sync_token');
        state.currentUser = null;
        showAuthScreen();
        switchAuthTab('signin');
        showAuthAlert('Session terminated. You have been signed out of the Command Center.', 'info');
        window.location.hash = '';
    }

    // Bind Logout Buttons
    if (elements.topbarLogoutBtn) {
        elements.topbarLogoutBtn.addEventListener('click', logout);
    }
    if (elements.sidebarLogoutBtn) {
        elements.sidebarLogoutBtn.addEventListener('click', logout);
    }

    // Tab Switching: Sign In vs Sign Up
    function switchAuthTab(tab) {
        clearAllAuthErrors();
        if (tab === 'signin') {
            if (elements.authTabSignIn) elements.authTabSignIn.classList.add('active');
            if (elements.authTabSignUp) elements.authTabSignUp.classList.remove('active');
            if (elements.authSignInForm) elements.authSignInForm.style.display = 'block';
            if (elements.authSignUpForm) elements.authSignUpForm.style.display = 'none';
        } else {
            if (elements.authTabSignUp) elements.authTabSignUp.classList.add('active');
            if (elements.authTabSignIn) elements.authTabSignIn.classList.remove('active');
            if (elements.authSignUpForm) elements.authSignUpForm.style.display = 'block';
            if (elements.authSignInForm) elements.authSignInForm.style.display = 'none';
        }
    }

    if (elements.authTabSignIn) {
        elements.authTabSignIn.addEventListener('click', () => switchAuthTab('signin'));
    }
    if (elements.authTabSignUp) {
        elements.authTabSignUp.addEventListener('click', () => switchAuthTab('signup'));
    }
    if (elements.linkToSignUp) {
        elements.linkToSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('signup');
        });
    }
    if (elements.linkToSignIn) {
        elements.linkToSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('signin');
        });
    }

    // URL hash routing support: #signup or #signin
    // Explicit click handlers for all sidebar navigation links
    if (elements.navLinks) {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetView = href.replace('#', '');
                    if (window.location.hash !== '#' + targetView) {
                        window.location.hash = targetView;
                    } else {
                        navigateTo(targetView);
                    }
                }
            });
        });
    }

    // Explicit click handlers for other hash navigation anchors (e.g. "View All Regions" button on dashboard)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.closest('.sidebar-nav')) return;
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                const targetView = href.replace('#', '');
                const validViews = ['dashboard', 'regions', 'inventory', 'allocation', 'teams', 'shelters', 'roads', 'monitoring', 'public-report'];
                if (validViews.includes(targetView)) {
                    e.preventDefault();
                    window.location.hash = targetView;
                    navigateTo(targetView);
                }
            }
        });
    });

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#signup') {
            switchAuthTab('signup');
        } else if (window.location.hash === '#signin') {
            switchAuthTab('signin');
        }
    });
    if (window.location.hash === '#signup') {
        switchAuthTab('signup');
    }

    // Helper: Auth field error display
    function setFieldError(inputEl, errorEl, message) {
        if (inputEl) inputEl.classList.add('input-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }
    }

    function clearFieldError(inputEl, errorEl) {
        if (inputEl) inputEl.classList.remove('input-error');
        if (errorEl) errorEl.classList.remove('visible');
    }

    function clearAllAuthErrors() {
        clearFieldError(elements.authSignInEmail, elements.errorSignInEmail);
        clearFieldError(elements.authSignInPassword, elements.errorSignInPassword);
        clearFieldError(elements.authSignUpName, elements.errorSignUpName);
        clearFieldError(elements.authSignUpEmail, elements.errorSignUpEmail);
        clearFieldError(elements.authSignUpPassword, elements.errorSignUpPassword);
        clearFieldError(elements.authSignUpConfirmPassword, elements.errorSignUpConfirmPassword);
        if (elements.authAlertMessage) {
            elements.authAlertMessage.className = 'auth-alert-message';
            elements.authAlertMessage.style.display = 'none';
            elements.authAlertMessage.textContent = '';
        }
    }

    function showAuthAlert(message, type = 'error') {
        if (!elements.authAlertMessage) return;
        elements.authAlertMessage.className = `auth-alert-message ${type}`;
        elements.authAlertMessage.textContent = message;
        elements.authAlertMessage.style.display = 'block';
    }

    // Real-time input error clearing on user keystrokes
    if (elements.authSignInEmail) {
        elements.authSignInEmail.addEventListener('input', () => clearFieldError(elements.authSignInEmail, elements.errorSignInEmail));
    }
    if (elements.authSignInPassword) {
        elements.authSignInPassword.addEventListener('input', () => clearFieldError(elements.authSignInPassword, elements.errorSignInPassword));
    }
    if (elements.authSignUpName) {
        elements.authSignUpName.addEventListener('input', () => clearFieldError(elements.authSignUpName, elements.errorSignUpName));
    }
    if (elements.authSignUpEmail) {
        elements.authSignUpEmail.addEventListener('input', () => clearFieldError(elements.authSignUpEmail, elements.errorSignUpEmail));
    }
    if (elements.authSignUpPassword) {
        elements.authSignUpPassword.addEventListener('input', () => clearFieldError(elements.authSignUpPassword, elements.errorSignUpPassword));
    }
    if (elements.authSignUpConfirmPassword) {
        elements.authSignUpConfirmPassword.addEventListener('input', () => clearFieldError(elements.authSignUpConfirmPassword, elements.errorSignUpConfirmPassword));
    }

    // Password Visibility Toggle Helpers
    function initPasswordToggle(btn, input) {
        if (!btn || !input) return;
        btn.setAttribute('type', 'button');

        // Prevent mousedown from blurring password input or changing selection
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isCurrentlyPassword = (input.getAttribute('type') === 'password' || input.type === 'password');
            const targetType = isCurrentlyPassword ? 'text' : 'password';
            input.setAttribute('type', targetType);
            input.type = targetType;

            const eyeShow = btn.querySelector('.eye-show');
            const eyeHide = btn.querySelector('.eye-hide');
            if (eyeShow && eyeHide) {
                // When revealed (text), show eye-hide icon (slashed eye)
                // When hidden (password), show eye-show icon (open eye)
                eyeShow.style.display = isCurrentlyPassword ? 'none' : 'block';
                eyeHide.style.display = isCurrentlyPassword ? 'block' : 'none';
            }
            const label = isCurrentlyPassword ? 'Hide password' : 'Show password';
            btn.setAttribute('aria-label', label);
            btn.setAttribute('title', label);
        });
    }

    initPasswordToggle(elements.toggleSignInPassword, elements.authSignInPassword);
    initPasswordToggle(elements.toggleSignUpPassword, elements.authSignUpPassword);
    initPasswordToggle(elements.toggleSignUpConfirmPassword, elements.authSignUpConfirmPassword);

    // ==========================================================================
    // 2. SIGN IN SUBMISSION (REAL API REQUEST WITH ACCOUNT TYPE VERIFICATION)
    // ==========================================================================
    if (elements.authSignInForm) {
        elements.authSignInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllAuthErrors();

            const email = elements.authSignInEmail.value.trim();
            const password = elements.authSignInPassword.value;
            const accountType = elements.authSignInAccountType ? elements.authSignInAccountType.value : 'ADMIN';

            let hasError = false;

            if (!email) {
                setFieldError(elements.authSignInEmail, elements.errorSignInEmail, 'Admin ID or Email address is required.');
                hasError = true;
            }

            if (!password) {
                setFieldError(elements.authSignInPassword, elements.errorSignInPassword, 'Password is required.');
                hasError = true;
            }

            if (hasError) return;

            // Loading state
            elements.signInBtnText.innerHTML = '<span class="spinner" style="margin-right: 6px;"></span> Verifying...';
            elements.authSignInBtn.disabled = true;

            try {
                // Call actual backend authentication endpoint with account type
                const response = await ResqApi.signIn(email, password, accountType);

                // If backend provides authenticated response
                const user = response.user || {
                    email: response.email || email,
                    fullName: response.fullName || response.name || email.split('@')[0],
                    role: response.role || 'PUBLIC'
                };

                // Validate that selected account type strictly matches the user's verified role
                const userRole = (user.role || '').toUpperCase();
                if (accountType && userRole && userRole !== accountType.toUpperCase()) {
                    throw new Error(`Access denied: Selected account type (${accountType}) does not match your authorized role (${user.role}).`);
                }

                if (response.token) {
                    sessionStorage.setItem('crisis_sync_token', response.token);
                }
                sessionStorage.setItem('crisis_sync_session', JSON.stringify(user));
                state.currentUser = user;
                showDashboardScreen(user);
                showToast(`Access granted. Welcome back, ${user.fullName}.`);
            } catch (error) {
                if (error.message === 'BACKEND_OFFLINE' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    showAuthAlert('Unable to connect to backend service. Please ensure server is running on port 8080.', 'error');
                } else if (error.message.includes('Role mismatch') || error.message.includes('Selected account type')) {
                    const match = error.message.match(/authorized role \(?'?([A-Za-z]+)'?\)?/i) || error.message.match(/Authorized: ([A-Za-z]+)/i);
                    if (match && match[1] && elements.authSignInAccountType) {
                        const targetRole = match[1].toUpperCase();
                        elements.authSignInAccountType.value = targetRole;
                        showAuthAlert(`Account has ${targetRole} clearance. We've switched Account Type to ${targetRole} for you. Click Sign In to proceed.`, 'info');
                    } else {
                        showAuthAlert(error.message, 'error');
                    }
                } else if (error.message.includes('Unregistered account')) {
                    showAuthAlert(error.message, 'error');
                } else {
                    showAuthAlert(error.message, 'error');
                }
            } finally {
                elements.signInBtnText.textContent = 'Sign In';
                elements.authSignInBtn.disabled = false;
            }
        });
    }

    if (elements.authSignInBtn && elements.authSignInForm) {
        elements.authSignInBtn.addEventListener('click', (e) => {
            if (elements.authSignInBtn.getAttribute('type') === 'button') {
                e.preventDefault();
                if (elements.authSignInForm.requestSubmit) {
                    elements.authSignInForm.requestSubmit();
                } else {
                    elements.authSignInForm.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            }
        });
    }

    // ==========================================================================
    // 3. SIGN UP SUBMISSION (REAL API REQUEST — NO FAKE REGISTRATIONS)
    // ==========================================================================
    if (elements.authSignUpForm) {
        elements.authSignUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllAuthErrors();

            const fullName = elements.authSignUpName.value.trim();
            const email = elements.authSignUpEmail.value.trim();
            const role = elements.authSignUpRole.value;
            const password = elements.authSignUpPassword.value;
            const confirmPassword = elements.authSignUpConfirmPassword.value;

            let hasError = false;

            if (!fullName) {
                setFieldError(elements.authSignUpName, elements.errorSignUpName, 'Full name is required.');
                hasError = true;
            }

            if (!email) {
                setFieldError(elements.authSignUpEmail, elements.errorSignUpEmail, 'Email address is required.');
                hasError = true;
            } else if (!EMAIL_REGEX.test(email)) {
                setFieldError(elements.authSignUpEmail, elements.errorSignUpEmail, 'Please enter a valid email address.');
                hasError = true;
            }

            if (!password) {
                setFieldError(elements.authSignUpPassword, elements.errorSignUpPassword, 'Password is required.');
                hasError = true;
            } else if (password.length < 6) {
                setFieldError(elements.authSignUpPassword, elements.errorSignUpPassword, 'Password must be at least 6 characters.');
                hasError = true;
            }

            if (!confirmPassword) {
                setFieldError(elements.authSignUpConfirmPassword, elements.errorSignUpConfirmPassword, 'Please confirm your password.');
                hasError = true;
            } else if (password !== confirmPassword) {
                setFieldError(elements.authSignUpConfirmPassword, elements.errorSignUpConfirmPassword, 'Passwords do not match.');
                hasError = true;
            }

            if (hasError) return;

            // Loading state
            elements.signUpBtnText.innerHTML = '<span class="spinner" style="margin-right: 6px;"></span> Registering with Backend...';
            elements.authSignUpBtn.disabled = true;

            try {
                // Call actual backend registration endpoint
                await ResqApi.signUp({ fullName, email, password, role });

                showAuthAlert(`Account successfully registered for ${fullName} (${role}). Please sign in with your credentials.`, 'success');
                switchAuthTab('signin');
                elements.authSignInEmail.value = email;
                if (elements.authSignInAccountType && role) {
                    elements.authSignInAccountType.value = role;
                }
                elements.authSignUpForm.reset();
                if (elements.authSignUpPassword) {
                    elements.authSignUpPassword.type = 'password';
                    elements.authSignUpPassword.setAttribute('type', 'password');
                }
                if (elements.authSignUpConfirmPassword) {
                    elements.authSignUpConfirmPassword.type = 'password';
                    elements.authSignUpConfirmPassword.setAttribute('type', 'password');
                }
                [elements.toggleSignUpPassword, elements.toggleSignUpConfirmPassword].forEach(btn => {
                    if (btn) {
                        const s = btn.querySelector('.eye-show');
                        const h = btn.querySelector('.eye-hide');
                        if (s && h) {
                            s.style.display = 'block';
                            h.style.display = 'none';
                        }
                    }
                });
            } catch (error) {
                if (error.message === 'BACKEND_OFFLINE' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    showAuthAlert('Unable to connect to backend service. Please ensure server is running on port 8080.', 'error');
                } else {
                    showAuthAlert(`Registration failed: ${error.message}`, 'error');
                }
            } finally {
                elements.signUpBtnText.textContent = 'Register Account';
                elements.authSignUpBtn.disabled = false;
            }
        });
    }

    // ==========================================================================
    // 4. NOTIFICATION & CONFIRMATION MODALS
    // ==========================================================================
    function showToast(message, type = 'success') {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✓' : '⚠️'}</span>
            <span>${escapeHtml(message)}</span>
        `;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function showConfirmation(title, message, actionLabel, onConfirm) {
        if (!elements.confirmModal) return;
        elements.confirmTitle.textContent = title;
        elements.confirmMessage.textContent = message;
        elements.confirmBtn.textContent = actionLabel;
        pendingConfirmAction = onConfirm;
        elements.confirmModal.classList.add('open');
    }

    function closeConfirmation() {
        if (!elements.confirmModal) return;
        elements.confirmModal.classList.remove('open');
        pendingConfirmAction = null;
    }

    if (elements.confirmBtn) {
        elements.confirmBtn.addEventListener('click', () => {
            if (typeof pendingConfirmAction === 'function') {
                pendingConfirmAction();
            }
            closeConfirmation();
        });
    }

    if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', closeConfirmation);
    }

    // ==========================================================================
    // 5. VIEW ROUTER & NAVIGATION
    // ==========================================================================
    function navigateTo(viewId) {
        console.log("[DEBUG-TRACE] navigateTo called with viewId:", viewId);
        // Enforce authentication gate: do not show views if unauthenticated
        if (!state.currentUser) {
            showAuthScreen();
            return;
        }

        // Restrict Public users strictly to the Public Emergency Reporting Form
        if (state.currentUser.role === 'PUBLIC') {
            viewId = 'public-report';
        } else if (viewId === 'public-report') {
            viewId = 'dashboard';
        }

        state.currentView = viewId;

        // Update nav links
        elements.navLinks.forEach(link => {
            const href = link.getAttribute('href').replace('#', '');
            if (href === viewId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Show active view
        elements.views.forEach(view => {
            if (view.id === `view-${viewId}`) {
                view.classList.add('active');
            } else {
                view.classList.remove('active');
            }
        });

        // Update titles and breadcrumbs
        const viewTitles = {
            'public-report': { title: 'Emergency Incident Report', bc: 'ResQ-Allocate / EMERGENCY REPORT' },
            dashboard: { title: state.currentUser?.role === 'COORDINATOR' ? 'Coordinator Operational Dashboard' : 'Emergency Dashboard', bc: 'ResQ-Allocate / OVERVIEW' },
            regions: { title: 'Affected Regions Roster', bc: 'ResQ-Allocate / INCIDENT ZONES' },
            allocation: { title: 'Resource Allocation & Fulfillment', bc: 'ResQ-Allocate / RESOURCE ALLOCATION' },
            requests: { title: 'Priority Relief Requests', bc: 'ResQ-Allocate / EMERGENCY QUEUE' },
            inventory: { title: 'Resource Inventory', bc: 'ResQ-Allocate / SUPPLY CHAIN' },
            teams: { title: 'Rescue Teams & Missions', bc: 'ResQ-Allocate / FIELD OPERATIONS' },
            shelters: { title: 'Shelter Management', bc: 'ResQ-Allocate / EVACUATION SHELTERS' },
            roads: { title: 'Road Network & Route Analysis', bc: 'ResQ-Allocate / ROUTING LOGISTICS' },
            monitoring: { title: 'Operational Response Monitoring', bc: 'ResQ-Allocate / RESPONSE MONITORING' }
        };

        const config = viewTitles[viewId] || { title: 'Emergency Operations', bc: 'ResQ-Allocate' };
        if (elements.pageTitle) elements.pageTitle.textContent = config.title;
        if (elements.breadcrumb) elements.breadcrumb.textContent = config.bc;

        // Close mobile drawer if open
        if (elements.dashboardScreen) {
            elements.dashboardScreen.classList.remove('mobile-sidebar-active');
        }

        // Fetch view data
        refreshCurrentViewData();
    }

    window.addEventListener('hashchange', () => {
        if (!state.currentUser) {
            showAuthScreen();
            return;
        }
        if (state.currentUser.role === 'PUBLIC') {
            navigateTo('public-report');
            return;
        }
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        navigateTo(hash);
    });

    // Mobile Navigation Drawer Toggle Handlers
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (mobileNavToggle && elements.dashboardScreen) {
        mobileNavToggle.addEventListener('click', () => {
            elements.dashboardScreen.classList.toggle('mobile-sidebar-active');
        });
    }
    if (sidebarBackdrop && elements.dashboardScreen) {
        sidebarBackdrop.addEventListener('click', () => {
            elements.dashboardScreen.classList.remove('mobile-sidebar-active');
        });
    }

    // ==========================================================================
    // 6. BACKEND HEALTH & DATA REFRESH
    // ==========================================================================
    async function checkBackendConnection() {
        try {
            const healthy = await ResqApi.checkHealth();
            console.log("[DEBUG-TRACE] checkBackendConnection: ResqApi.checkHealth returned", healthy);
            if (healthy) {
                if (elements.statusDot) elements.statusDot.classList.remove('offline');
                if (elements.connectionStatus) elements.connectionStatus.textContent = 'API Connected (8080)';
                if (elements.offlineBanner) elements.offlineBanner.style.display = 'none';
                return true;
            }
        } catch (err) {
            // Handled below
        }

        if (elements.statusDot) elements.statusDot.classList.add('offline');
        if (elements.connectionStatus) elements.connectionStatus.textContent = 'Backend Offline';
        if (elements.offlineBanner) elements.offlineBanner.style.display = 'flex';
        return false;
    }

    function renderBackendOfflineView(viewId) {
        const retryCardHtml = `
            <div class="empty-state-box" style="padding: 28px 20px;">
                <div class="empty-state-icon" style="color: var(--color-danger); font-size: 32px;">⚠️</div>
                <p class="empty-state-title" style="color: var(--color-danger); font-size: 16px; margin: 8px 0;">Backend Service Unavailable</p>
                <p class="empty-state-desc" style="color: var(--color-text-secondary); max-width: 480px; margin: 0 auto 16px; font-size: 13px;">
                    The Spring Boot REST API at <code>http://localhost:8080/api</code> is currently unreachable. Please start the backend service.
                </p>
                <button type="button" class="btn btn-primary btn-sm" onclick="window.resqRetryCurrentView()">
                    ↻ Retry Connection
                </button>
            </div>
        `;

        const retryTableRow = (cols, label = 'data') => `
            <tr>
                <td colspan="${cols}" class="empty-state-box" style="padding: 28px 20px;">
                    <div class="empty-state-icon" style="color: var(--color-danger); font-size: 28px;">⚠️</div>
                    <p class="empty-state-title" style="color: var(--color-danger); font-size: 15px; margin: 6px 0;">Backend Service Unavailable</p>
                    <p class="empty-state-desc" style="color: var(--color-text-secondary); max-width: 440px; margin: 0 auto 14px; font-size: 12px;">
                        Unable to retrieve ${label}. The REST API at <code>http://localhost:8080/api</code> is unreachable.
                    </p>
                    <button type="button" class="btn btn-primary btn-sm" onclick="window.resqRetryCurrentView()">
                        ↻ Retry Connection
                    </button>
                </td>
            </tr>
        `;

        switch (viewId) {
            case 'regions': {
                const tbody = document.getElementById('regionsTableBody');
                if (tbody) tbody.innerHTML = retryTableRow(8, 'affected regions');
                break;
            }
            case 'requests': {
                const tbody = document.getElementById('requestsTableBody');
                if (tbody) tbody.innerHTML = retryTableRow(6, 'priority requests');
                break;
            }
            case 'inventory': {
                const step1 = document.getElementById('invStepBreakdown');
                const reqTbody = document.getElementById('invRegionRequirementsBody');
                if (reqTbody) reqTbody.innerHTML = retryTableRow(6, 'regional requirements');
                if (step1 && !step1.querySelector('.backend-offline-notice')) {
                    const notice = document.createElement('div');
                    notice.className = 'backend-offline-notice';
                    notice.innerHTML = retryCardHtml;
                    step1.prepend(notice);
                }
                break;
            }
            case 'teams': {
                const tbody = document.getElementById('teamsTableBody');
                if (tbody) tbody.innerHTML = retryTableRow(6, 'rescue teams personnel roster');
                break;
            }
            case 'shelters': {
                const tbody = document.getElementById('sheltersTableBody');
                if (tbody) tbody.innerHTML = retryTableRow(8, 'evacuation shelters');
                break;
            }
            case 'roads': {
                const listEl = document.getElementById('routingRegionsList');
                if (listEl) listEl.innerHTML = retryCardHtml;
                const optEl = document.getElementById('routeOptionsContainer');
                if (optEl) optEl.innerHTML = retryCardHtml;
                const roadsTbody = document.getElementById('roadsTableBody');
                if (roadsTbody) roadsTbody.innerHTML = retryTableRow(5, 'road network');
                const svg = document.getElementById('roadNetworkSvg');
                if (svg) {
                    svg.innerHTML = `
                        <text x="400" y="210" text-anchor="middle" fill="#EF4444" font-size="16" font-weight="700">⚠️ Backend Offline</text>
                        <text x="400" y="240" text-anchor="middle" fill="#9EA3B0" font-size="13">Road network and evacuation paths require Spring Boot REST API</text>
                    `;
                }
                break;
            }
            case 'dashboard': {
                // Dashboard summary cards stay at zero/neutral, offline banner communicates status
                break;
            }
        }
    }

    window.resqRetryCurrentView = async function() {
        const statusEl = elements.connectionStatus;
        if (statusEl) statusEl.textContent = 'Reconnecting...';
        const connected = await checkBackendConnection();
        console.log("[DEBUG-TRACE] refreshCurrentViewData: checkBackendConnection returned", connected);
        if (connected) {
            showToast('Backend service connected successfully!');
            await refreshCurrentViewData();
        } else {
            showToast('Backend is still unreachable. Please ensure Spring Boot is running on port 8080.', 'error');
            renderBackendOfflineView(state.currentView);
        }
    };

    async function refreshCurrentViewData() {
        console.log("[DEBUG-TRACE] refreshCurrentViewData called, view:", state.currentView, "user:", state.currentUser?.role);
        if (state.currentView === 'public-report') return;
        if (!state.currentUser) return;
        const connected = await checkBackendConnection();
        console.log("[DEBUG-TRACE] refreshCurrentViewData: connected is", connected, "state.currentView is", state.currentView);
        if (!connected) {
            renderBackendOfflineView(state.currentView);
            return;
        }

        try {
            switch (state.currentView) {
                case 'dashboard':
                    await loadDashboardData();
                    break;
                case 'regions':
                    await loadRegionsData();
                    break;
                case 'requests':
                    await loadRequestsData();
                    break;
                case 'inventory':
                    await loadInventoryData();
                    break;
                case 'teams':
                    await loadTeamsData();
                    break;
                case 'shelters':
                    await loadSheltersData();
                    break;
                case 'roads':
                    await loadRoadsData();
                    break;
                case 'allocation':
                    await loadAllocationData();
                    break;
                case 'monitoring':
                    await loadMonitoringData();
                    break;
            }
        } catch (error) {
            console.error("[DEBUG-TRACE] refreshCurrentViewData caught error:", error);
            if (error.message === 'BACKEND_OFFLINE') {
                renderBackendOfflineView(state.currentView);
            } else {
                showToast(`Failed to load data: ${error.message}`, 'error');
            }
        }
    }

    // --- Region Detail Modal Handler ---
    window.resqOpenRegionDetail = async function(regionId) {
        const modal = document.getElementById('regionDetailModal');
        if (!modal) return;

        let region = (state.regions || []).find(r => r.regionId === regionId);
        if (!region) {
            try {
                const fetchedRegions = await ResqApi.getRegions();
                region = fetchedRegions.find(r => r.regionId === regionId);
            } catch (err) {
                console.error(err);
            }
        }
        if (!region) {
            showToast('Region details could not be found.', 'error');
            return;
        }

        // Set title and subtitle
        const titleEl = document.getElementById('regionDetailModalTitle');
        const subtitleEl = document.getElementById('regionDetailModalSubtitle');
        if (titleEl) titleEl.textContent = `${region.regionName} (Zone #${region.regionId})`;
        if (subtitleEl) subtitleEl.textContent = `Operational situational report & emergency request audit trail`;

        // Set metrics
        const popEl = document.getElementById('rdmPopulation');
        const sevEl = document.getElementById('rdmSeverity');
        const accessEl = document.getElementById('rdmRoadAccess');
        const prioEl = document.getElementById('rdmPriority');

        if (popEl) popEl.textContent = (region.population || 0).toLocaleString() + ' citizens';
        if (sevEl) sevEl.innerHTML = renderSeverityBadge(region.severity);
        if (accessEl) {
            let statusBadge = '';
            if (region.hasRoadMapping === false) {
                statusBadge = '<span class="badge badge-low" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">⚠️ Unmapped (No Road Connections)</span>';
            } else if (region.networkReachable === false) {
                statusBadge = '<span class="badge badge-critical">✕ Transit Cut Off (All Routes Blocked)</span>';
            } else if (region.accessible === false) {
                statusBadge = '<span class="badge badge-waiting" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3);">⚠️ Route Open / Zone Hazard</span>';
            } else {
                statusBadge = '<span class="badge badge-available">✓ Open Access & Navigable</span>';
            }
            accessEl.innerHTML = statusBadge;
        }
        if (prioEl) {
            const prioScore = (region.severity * 1000) + Math.floor((region.population || 0) / 100);
            prioEl.textContent = prioScore.toLocaleString() + ' pts';
        }

        // Calculate active demands & local assets
        let regionRequests = [];
        try {
            const allReqs = state.requests && state.requests.length > 0 ? state.requests : await ResqApi.getRequests();
            regionRequests = (allReqs || []).filter(r => (r.region?.regionId === regionId || r.regionId === regionId));
        } catch (err) {
            console.error(err);
        }

        const foodEl = document.getElementById('rdmFoodReq');
        const medEl = document.getElementById('rdmMedicalReq');

        const activeSupplyReqs = regionRequests.filter(r => r.requestType === 'SUPPLY');
        let foodNeed = 0, foodTotal = 0, medNeed = 0, medTotal = 0;
        activeSupplyReqs.forEach(r => {
            if (!r.foodArchived && r.foodRequired > 0) {
                foodTotal += r.foodRequired;
                foodNeed += (r.foodOutstanding ?? r.foodRequired);
            }
            if (!r.medicineArchived && r.medicineRequired > 0) {
                medTotal += r.medicineRequired;
                medNeed += (r.medicineOutstanding ?? r.medicineRequired);
            }
        });

        if (foodEl) {
            foodEl.innerHTML = foodTotal > 0 
                ? `<strong>${foodNeed}</strong> outstanding / ${foodTotal} required` 
                : '<span class="text-muted">No active demand</span>';
        }
        if (medEl) {
            medEl.innerHTML = medTotal > 0 
                ? `<strong>${medNeed}</strong> outstanding / ${medTotal} required` 
                : '<span class="text-muted">No active demand</span>';
        }

        // Teams in or assigned to this region
        const teamsEl = document.getElementById('rdmRescueTeams');
        if (teamsEl) {
            const localTeams = (state.teams || []).filter(t => t.currentLocation && t.currentLocation.toLowerCase() === region.regionName.toLowerCase());
            if (localTeams.length > 0) {
                teamsEl.innerHTML = localTeams.map(t => `${escapeHtml(t.teamName)} (${t.available ? 'Ready' : 'On Mission'})`).join(', ');
            } else {
                teamsEl.innerHTML = '<span class="text-muted">None stationed locally</span>';
            }
        }

        // Shelters in this region
        const sheltersEl = document.getElementById('rdmShelters');
        if (sheltersEl) {
            const localShelters = (state.shelters || []).filter(s => s.location && s.location.toLowerCase() === region.regionName.toLowerCase());
            if (localShelters.length > 0) {
                sheltersEl.innerHTML = localShelters.map(s => `${escapeHtml(s.shelterName)} (${s.occupied}/${s.capacity} spaces)`).join(', ');
            } else {
                sheltersEl.innerHTML = '<span class="text-muted">None stationed locally</span>';
            }
        }

        // Request history table
        const historyTbody = document.getElementById('rdmHistoryTableBody');
        if (historyTbody) {
            if (regionRequests.length === 0) {
                historyTbody.innerHTML = `<tr><td colspan="5" class="empty-state">No requests recorded for this region.</td></tr>`;
            } else {
                historyTbody.innerHTML = regionRequests.map(r => {
                    let desc = '';
                    if (r.requestType === 'SUPPLY') {
                        desc = `Food: ${r.foodOutstanding || 0}/${r.foodRequired || 0} | Meds: ${r.medicineOutstanding || 0}/${r.medicineRequired || 0}`;
                    } else {
                        desc = `Rescue: ${r.peopleToRescue || 0} people (${r.teamsRequired || 0} teams needed)`;
                    }
                    const createdDate = r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Logged';
                    return `
                        <tr>
                            <td><strong>#${r.requestId}</strong></td>
                            <td><span class="badge ${r.requestType === 'RESCUE' ? 'badge-critical' : 'badge-low'}">${r.requestType}</span></td>
                            <td><small>${escapeHtml(desc)}</small></td>
                            <td>${renderRequestStatusBadge(r.status)}</td>
                            <td><small class="text-muted">${escapeHtml(createdDate)}</small></td>
                        </tr>
                    `;
                }).join('');
            }
        }

        modal.classList.add('open');
    };

    const closeRegionModalBtn = document.getElementById('closeRegionModalBtn');
    const closeRegionModalFooterBtn = document.getElementById('closeRegionModalFooterBtn');
    if (closeRegionModalBtn) {
        closeRegionModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('regionDetailModal');
            if (modal) modal.classList.remove('open');
        });
    }
    if (closeRegionModalFooterBtn) {
        closeRegionModalFooterBtn.addEventListener('click', () => {
            const modal = document.getElementById('regionDetailModal');
            if (modal) modal.classList.remove('open');
        });
    }

    // --- Dashboard Data ---
    async function loadDashboardData() {
        try {
            const [stats, regions, inventory, teams, requests, shelters] = await Promise.all([
                ResqApi.getDashboardStats().catch(() => null),
                ResqApi.getRegions().catch(() => []),
                ResqApi.getInventory().catch(() => ({ foodKits: 0, medicineKits: 0 })),
                ResqApi.getRescueTeams().catch(() => []),
                ResqApi.getRequests().catch(() => []),
                ResqApi.getShelters().catch(() => [])
            ]);

            state.regions = regions || [];
            state.inventory = inventory || { foodKits: 0, medicineKits: 0 };
            state.teams = teams || [];
            state.requests = requests || [];
            state.shelters = shelters || [];

            // Standard Admin Summary Cards (2x2)
            const regionCountEl = document.getElementById('statRegionCount');
            const teamCountEl = document.getElementById('statTeamCount');
            const foodStockEl = document.getElementById('statFoodStock');
            const medStockEl = document.getElementById('statMedStock');

            if (regionCountEl) regionCountEl.textContent = stats?.totalRegions ?? state.regions.length;
            if (teamCountEl) {
                const total = stats?.totalTeams ?? state.teams.length;
                const available = stats?.availableTeams ?? state.teams.filter(t => t.available).length;
                teamCountEl.textContent = `${available} / ${total}`;
            }
            if (foodStockEl) foodStockEl.textContent = (stats?.foodKits ?? state.inventory.foodKits ?? 0).toLocaleString();
            if (medStockEl) medStockEl.textContent = (stats?.medicineKits ?? state.inventory.medicineKits ?? 0).toLocaleString();

            // Coordinator Telemetry Cards
            if (elements.coordStatHighSev) {
                const highCount = state.regions.filter(r => r.severity >= 4).length;
                elements.coordStatHighSev.textContent = highCount;
            }
            if (elements.coordStatPendingReqs) {
                const pendingCount = state.requests.filter(r => r.status !== 'COMPLETED').length;
                elements.coordStatPendingReqs.textContent = pendingCount;
            }
            if (elements.coordStatTeamsStatus) {
                const avail = state.teams.filter(t => t.available).length;
                const busy = state.teams.filter(t => !t.available).length;
                elements.coordStatTeamsStatus.textContent = `${avail} avail / ${busy} busy`;
            }
            if (elements.coordStatShelterUsage) {
                const occ = state.shelters.reduce((acc, s) => acc + (s.occupied || 0), 0);
                const cap = state.shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
                elements.coordStatShelterUsage.textContent = `${occ.toLocaleString()} / ${cap.toLocaleString()}`;
            }

            // Render Recent Incident Reports in Coordinator Section
            renderCoordRecentReports(state.regions, state.requests);
            populateRegionDropdowns();
        } catch (err) {
            console.error('Error loading dashboard:', err);
        }
    }

    function renderCoordRecentReports(regions, requests) {
        const tbody = elements.coordRecentReportsBody;
        if (!tbody) return;

        if (!regions || regions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-box">No incident reports logged yet.</td></tr>';
            return;
        }

        // Map requirements to regions
        const regionReqs = {};
        (requests || []).forEach(req => {
            const regId = req.region?.regionId || req.regionId;
            if (!regId) return;
            if (!regionReqs[regId]) regionReqs[regId] = [];
            regionReqs[regId].push(req);
        });

        // Take up to 6 most recent regions
        const recent = [...regions].slice(-6).reverse();

        tbody.innerHTML = recent.map(r => {
            const reqs = regionReqs[r.regionId] || [];
            let foodReq = 0, medReq = 0, teamsReq = 0, shelterReq = 0;
            reqs.forEach(rq => {
                if (rq.foodRequired) foodReq += rq.foodRequired;
                if (rq.medicineRequired) medReq += rq.medicineRequired;
                if (rq.teamsRequired) teamsReq += rq.teamsRequired;
                if (rq.peopleToRescue) shelterReq += rq.peopleToRescue;
            });

            const badges = [];
            if (foodReq > 0) badges.push('🍲 ' + foodReq + ' kits');
            if (medReq > 0) badges.push('💊 ' + medReq + ' kits');
            if (teamsReq > 0) badges.push('🚑 ' + teamsReq + ' teams');
            if (shelterReq > 0) badges.push('🏠 ' + shelterReq + ' people');
            const reqDisplay = badges.length > 0 ? badges.join(', ') : '<span style="color: #64748B;">General Monitoring</span>';

            return `
                <tr>
                    <td><strong>#${r.regionId}</strong></td>
                    <td>
                        <div><strong>${escapeHtml(r.regionName)}</strong></div>
                        <span style="font-size: 11px; color: #94A3B8;">${escapeHtml(r.disasterType || 'General Emergency')}</span>
                    </td>
                    <td>${renderSeverityBadge(r.severity)}</td>
                    <td>${(r.population || 0).toLocaleString()}</td>
                    <td>${renderRegionAccessibilityBadge(r)}</td>
                    <td><span style="font-size: 12px;">${reqDisplay}</span></td>
                    <td>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.resqOpenRegionDetail(${r.regionId})">
                            View Details →
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- Regions Data ---
    async function loadRegionsData() {
        const tbody = document.getElementById('regionsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading-box"><span class="spinner"></span> Loading regions in priority order...</td></tr>';
        }

        try {
            const isPriority = state.isRegionPriorityMode !== false;
            const [regionsResult, requestsResult] = await Promise.allSettled([
                ResqApi.getRegions(isPriority),
                ResqApi.getRequests()
            ]);

            if (regionsResult.status === 'rejected') {
                throw regionsResult.reason;
            }

            state.regions = Array.isArray(regionsResult.value) ? regionsResult.value : [];
            state.requests = (requestsResult.status === 'fulfilled' && Array.isArray(requestsResult.value))
                ? requestsResult.value
                : [];

            renderRegionsTable(state.regions);
            try { populateRegionDropdowns(); } catch (ddErr) { console.warn('Region dropdowns populate error:', ddErr); }
        } catch (err) {
            console.error('[REGIONS-ERROR] Failed to load affected regions:', err);
            if (tbody) {
                if (err && (err.message === 'BACKEND_OFFLINE' || (err.message && err.message.toLowerCase().includes('fetch')))) {
                    renderBackendOfflineView('regions');
                } else {
                    const errorMsg = err?.message || 'Failed to retrieve affected regions from database.';
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" class="empty-state-box" style="padding: 24px;">
                                <div class="empty-state-icon" style="color: var(--color-danger); font-size: 28px;">⚠️</div>
                                <p class="empty-state-title" style="color: var(--color-danger); font-size: 15px; margin: 6px 0;">Failed to Load Affected Regions</p>
                                <p class="empty-state-desc" style="color: var(--color-text-secondary); max-width: 440px; margin: 0 auto 14px; font-size: 12px;">
                                    ${escapeHtml(errorMsg)}
                                </p>
                                <button type="button" class="btn btn-primary btn-sm" onclick="window.resqRetryCurrentView()">
                                    ↻ Retry
                                </button>
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }

    // Region Search Input Handler
    const regionSearchInput = document.getElementById('regionSearchInput');
    if (regionSearchInput) {
        regionSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (!query) {
                renderRegionsTable(state.regions);
                return;
            }
            const filtered = state.regions.filter(r => 
                (r.regionName && r.regionName.toLowerCase().includes(query)) || 
                String(r.regionId ?? '').includes(query) ||
                String(r.severity ?? '').includes(query) ||
                (r.disasterType && r.disasterType.toLowerCase().includes(query))
            );
            renderRegionsTable(filtered);
        });
    }

    window.resqQuickAllocate = function(regionId) {
        navigateTo('allocation');
        setTimeout(() => {
            if (elements.allocRegionSelect) {
                elements.allocRegionSelect.value = regionId;
                elements.allocRegionSelect.dispatchEvent(new Event('change'));
            }
        }, 150);
    };

    function renderRegionsTable(regions) {
        console.log("[DEBUG-TRACE] renderRegionsTable called with count:", regions?.length);
        const tbody = document.getElementById('regionsTableBody');
        if (!tbody) return;

        if (!regions || regions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state-box">
                        <div class="empty-state-icon">⌖</div>
                        <p class="empty-state-title">No affected regions found</p>
                        <p class="empty-state-desc">No regions match the search filter or register query.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Deduplicate to guarantee each region appears exactly once
        const seenKeys = new Set();
        const uniqueRegions = regions.filter(r => {
            if (!r) return false;
            const key = String(r.regionId != null ? r.regionId : (r.regionName || Math.random())).toLowerCase();
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });

        // Map request assistance status and quantities for each region
        const regionStatusMap = {};
        const regionReqsMap = {};
        (state.requests || []).forEach(req => {
            if (!req) return;
            const regId = req.region?.regionId || req.regionId;
            if (!regId) return;
            if (!regionStatusMap[regId]) regionStatusMap[regId] = [];
            if (!regionReqsMap[regId]) regionReqsMap[regId] = [];
            if (req.status) regionStatusMap[regId].push(req.status);
            regionReqsMap[regId].push(req);
        });

        tbody.innerHTML = uniqueRegions.map(r => {
            const regId = r.regionId ?? 0;
            const regName = r.regionName || 'Unknown Region';
            const pop = Number(r.population) || 0;
            const sev = Number(r.severity) || 1;
            const disasterType = r.disasterType || 'General Emergency';

            const statuses = regionStatusMap[regId] || [];
            let statusBadge = '<span class="badge badge-low">No Demands</span>';
            if (statuses.some(s => s === 'WAITING' || s === 'PENDING')) {
                statusBadge = '<span class="badge badge-waiting">● Pending</span>';
            } else if (statuses.some(s => s === 'IN_PROGRESS' || s === 'PARTIALLY_FULFILLED')) {
                statusBadge = '<span class="badge badge-in-progress">⚡ In Progress</span>';
            } else if (statuses.length > 0 && statuses.every(s => s === 'COMPLETED')) {
                statusBadge = '<span class="badge badge-completed">✓ Completed</span>';
            }

            // Calculate requested quantities
            const reqs = regionReqsMap[regId] || [];
            let foodReq = 0, medReq = 0, teamsReq = 0, shelterPeople = 0;
            reqs.forEach(rq => {
                if (rq.foodRequired) foodReq += rq.foodRequired;
                if (rq.medicineRequired) medReq += rq.medicineRequired;
                if (rq.teamsRequired) teamsReq += rq.teamsRequired;
                if (rq.peopleToRescue) shelterPeople += rq.peopleToRescue;
            });

            const badges = [];
            if (foodReq > 0) badges.push('🍲 ' + foodReq + ' kits');
            if (medReq > 0) badges.push('💊 ' + medReq + ' kits');
            if (teamsReq > 0) badges.push('🚑 ' + teamsReq + ' teams');
            if (shelterPeople > 0) badges.push('🏠 ' + shelterPeople + ' evacuees');
            const reqDisplay = badges.length > 0 ? badges.join(' · ') : '<span style="color: #64748B;">General Monitoring</span>';

            return `
                <tr style="cursor: pointer;" onclick="window.resqOpenRegionDetail(${regId})">
                    <td><strong>#${regId}</strong></td>
                    <td>
                        <div><strong>${escapeHtml(regName)}</strong></div>
                        <span style="font-size: 11px; color: #94A3B8;">${escapeHtml(disasterType)}</span>
                    </td>
                    <td>${pop.toLocaleString()} citizens</td>
                    <td>${renderSeverityBadge(sev)}</td>
                    <td>${renderRegionAccessibilityBadge(r)}</td>
                    <td><span style="font-size: 12px; font-weight: 500;">${reqDisplay}</span></td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.resqOpenRegionDetail(${regId})">
                                View Details →
                            </button>
                            <button type="button" class="btn btn-danger btn-sm coordinator-only-action" onclick="event.stopPropagation(); window.resqQuickAllocate(${regId})">
                                Allocate
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==========================================================================
    // 4. RESOURCE ALLOCATION & PRIORITY QUEUE LOGIC
    // ==========================================================================
    async function loadAllocationData() {
        const tbody = elements.allocationTableBody || document.getElementById('allocationTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading-box"><span class="spinner"></span> Loading allocations & demands...</td></tr>';

        try {
            const [requests, regions, inventory] = await Promise.all([
                ResqApi.getRequests(),
                ResqApi.getRegions(),
                ResqApi.getInventory()
            ]);
            state.requests = requests || [];
            state.regions = regions || [];
            state.inventory = inventory || { foodKits: 0, medicineKits: 0 };

            // Update Stock Telemetry
            const foodStock = state.inventory.foodKits || 0;
            const medStock = state.inventory.medicineKits || 0;
            if (elements.allocStockFood) elements.allocStockFood.textContent = foodStock.toLocaleString();
            if (elements.allocStockMed) elements.allocStockMed.textContent = medStock.toLocaleString();

            let totalDispatched = 0;
            let totalDeficit = 0;
            let waitingSupply = 0;
            let waitingRescue = 0;

            state.requests.forEach(r => {
                if (r.requestType === 'SUPPLY') {
                    totalDispatched += (r.foodAllocated || 0) + (r.medicineAllocated || 0);
                    totalDeficit += (r.foodOutstanding || 0) + (r.medicineOutstanding || 0);
                    if (r.status === 'WAITING' || r.status === 'PENDING') waitingSupply++;
                } else {
                    if (r.status === 'WAITING' || r.status === 'PENDING') waitingRescue++;
                }
            });

            if (elements.allocTotalDispatched) elements.allocTotalDispatched.textContent = totalDispatched.toLocaleString() + ' kits';
            if (elements.allocTotalDeficit) elements.allocTotalDeficit.textContent = totalDeficit.toLocaleString() + ' kits';
            if (elements.allocQueueSupplyCount) elements.allocQueueSupplyCount.textContent = waitingSupply + ' waiting';
            if (elements.allocQueueRescueCount) elements.allocQueueRescueCount.textContent = waitingRescue + ' waiting';

            // Populate Allocation Region Select
            populateAllocRegionDropdown();

            // Render Demands Table
            renderAllocationTable(state.requests);
        } catch (err) {
            console.error('Failed to load allocation data:', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-state-box">Failed to load allocation data.</td></tr>';
        }
    }

    function populateAllocRegionDropdown() {
        const select = elements.allocRegionSelect;
        if (!select) return;

        const currentVal = select.value;
        select.innerHTML = '<option value="">Select target region...</option>';

        // Filter regions that have pending supply requests first
        const pendingMap = {};
        state.requests.forEach(r => {
            if (r.requestType === 'SUPPLY' && r.status !== 'COMPLETED') {
                const regId = r.region?.regionId || r.regionId;
                if (regId) pendingMap[regId] = r;
            }
        });

        state.regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.regionId;
            const hasPending = pendingMap[r.regionId];
            opt.textContent = `#${r.regionId} - ${r.regionName} (Severity ${r.severity}/5)${hasPending ? ' [Pending Demands]' : ''}`;
            select.appendChild(opt);
        });

        if (currentVal) select.value = currentVal;
    }

    // Allocation Region Selection Handler
    if (elements.allocRegionSelect) {
        elements.allocRegionSelect.addEventListener('change', () => {
            const regId = parseInt(elements.allocRegionSelect.value, 10);
            if (!regId) {
                if (elements.allocRegionDemandBox) elements.allocRegionDemandBox.style.display = 'none';
                if (elements.allocFoodInput) elements.allocFoodInput.value = '0';
                if (elements.allocMedInput) elements.allocMedInput.value = '0';
                return;
            }

            const region = state.regions.find(r => r.regionId === regId);
            const activeReq = state.requests.find(r => (r.region?.regionId === regId || r.regionId === regId) && r.requestType === 'SUPPLY' && r.status !== 'COMPLETED');

            const foodStock = state.inventory?.foodKits || 0;
            const medStock = state.inventory?.medicineKits || 0;

            if (elements.allocFoodHint) elements.allocFoodHint.textContent = `Available in warehouse: ${foodStock.toLocaleString()} kits`;
            if (elements.allocMedHint) elements.allocMedHint.textContent = `Available in warehouse: ${medStock.toLocaleString()} kits`;

            if (activeReq) {
                const foodRem = activeReq.foodOutstanding ?? Math.max(0, activeReq.foodRequired - (activeReq.foodAllocated || 0));
                const medRem = activeReq.medicineOutstanding ?? Math.max(0, activeReq.medicineRequired - (activeReq.medicineAllocated || 0));

                if (elements.allocRegionDemandBox) {
                    elements.allocDemandTitle.textContent = `Demand for ${region ? region.regionName : '#' + regId}:`;
                    elements.allocDemandDetails.innerHTML = `
                        <strong>Food Kits:</strong> Required ${activeReq.foodRequired}, Allocated ${activeReq.foodAllocated || 0}, <strong>Remaining Need: ${foodRem}</strong><br>
                        <strong>Medical Kits:</strong> Required ${activeReq.medicineRequired}, Allocated ${activeReq.medicineAllocated || 0}, <strong>Remaining Need: ${medRem}</strong>
                    `;
                    elements.allocRegionDemandBox.style.display = 'block';
                }

                if (elements.allocFoodInput) elements.allocFoodInput.value = Math.min(foodRem, foodStock);
                if (elements.allocMedInput) elements.allocMedInput.value = Math.min(medRem, medStock);
            } else {
                if (elements.allocRegionDemandBox) {
                    elements.allocDemandTitle.textContent = `Status for ${region ? region.regionName : '#' + regId}:`;
                    elements.allocDemandDetails.textContent = 'No unmet supply requests in queue. You can allocate supplementary buffer stock.';
                    elements.allocRegionDemandBox.style.display = 'block';
                }
                if (elements.allocFoodInput) elements.allocFoodInput.value = '0';
                if (elements.allocMedInput) elements.allocMedInput.value = '0';
            }
        });
    }

    // Direct Allocation Form Submission
    if (elements.directAllocationForm) {
        elements.directAllocationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.allocErrorBox) elements.allocErrorBox.style.display = 'none';

            const regionId = parseInt(elements.allocRegionSelect.value, 10);
            if (!regionId) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = 'Please select a target affected region.';
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }

            const foodKits = parseInt(elements.allocFoodInput.value, 10) || 0;
            const medKits = parseInt(elements.allocMedInput.value, 10) || 0;

            if (foodKits <= 0 && medKits <= 0) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = 'Please specify a positive quantity of Food Kits or Medical Kits to allocate.';
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }

            const foodStock = state.inventory?.foodKits || 0;
            const medStock = state.inventory?.medicineKits || 0;

            if (foodKits > foodStock) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = `Cannot allocate ${foodKits} food kits. Available warehouse stock is only ${foodStock}.`;
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }
            if (medKits > medStock) {
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = `Cannot allocate ${medKits} medical kits. Available warehouse stock is only ${medStock}.`;
                    elements.allocErrorBox.style.display = 'block';
                }
                return;
            }

            // Loading state
            if (elements.allocSubmitBtn) elements.allocSubmitBtn.disabled = true;
            if (elements.allocSubmitBtnText) elements.allocSubmitBtnText.textContent = 'Allocating & Dispatching...';

            try {
                const res = await ResqApi.allocateResources(regionId, foodKits, medKits);
                showToast(res.message || 'Resources allocated successfully!');
                await loadAllocationData();
                await loadInventoryData();
            } catch (err) {
                console.error('Allocation failed:', err);
                if (elements.allocErrorBox) {
                    elements.allocErrorBox.textContent = err.message || 'Failed to allocate resources. Please check parameters.';
                    elements.allocErrorBox.style.display = 'block';
                }
            } finally {
                if (elements.allocSubmitBtn) elements.allocSubmitBtn.disabled = false;
                if (elements.allocSubmitBtnText) elements.allocSubmitBtnText.textContent = 'Confirm Allocation & Dispatch';
            }
        });
    }

    function renderAllocationTable(requests) {
        const tbody = elements.allocationTableBody || document.getElementById('allocationTableBody');
        if (!tbody) return;

        if (!requests || requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state-box">No allocation records found in system.</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(req => {
            const regName = req.region?.regionName || req.regionName || 'Zone #' + (req.region?.regionId || req.regionId);
            const isSupply = req.requestType === 'SUPPLY';

            const requested = isSupply
                ? `🍲 ${req.foodRequired || 0} | 💊 ${req.medicineRequired || 0}`
                : `🚑 ${req.teamsRequired || 0} teams | 👥 ${req.peopleToRescue || 0} people`;

            const allocated = isSupply
                ? `🍲 ${req.foodAllocated || 0} | 💊 ${req.medicineAllocated || 0}`
                : (req.assignedTeamId ? `Team #${req.assignedTeamId} assigned` : 'None assigned');

            const remaining = isSupply
                ? `🍲 ${req.foodOutstanding ?? Math.max(0, (req.foodRequired || 0) - (req.foodAllocated || 0))} | 💊 ${req.medicineOutstanding ?? Math.max(0, (req.medicineRequired || 0) - (req.medicineAllocated || 0))}`
                : (req.status === 'COMPLETED' ? '0' : `${req.teamsRequired || 1} team`);

            let badge = '<span class="badge badge-waiting">● WAITING</span>';
            if (req.status === 'COMPLETED') badge = '<span class="badge badge-completed">✓ COMPLETED</span>';
            else if (req.status === 'IN_PROGRESS' || req.status === 'PARTIALLY_FULFILLED') badge = '<span class="badge badge-in-progress">⚡ IN PROGRESS</span>';

            const regId = req.region?.regionId || req.regionId;

            return `
                <tr>
                    <td><strong>#${req.requestId}</strong></td>
                    <td><strong>${escapeHtml(regName)}</strong></td>
                    <td><span class="badge ${isSupply ? 'badge-low' : 'badge-critical'}">${req.requestType}</span></td>
                    <td>${requested}</td>
                    <td>${allocated}</td>
                    <td><strong style="color: #F87171;">${remaining}</strong></td>
                    <td>${badge}</td>
                    <td class="coordinator-only-action">
                        ${isSupply && req.status !== 'COMPLETED'
                            ? `<button type="button" class="btn btn-primary btn-sm" onclick="window.resqQuickAllocate(${regId})">Allocate</button>`
                            : '-'
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }

    let activeInventoryResource = null;

    async function loadInventoryData() {
        try {
            const [inventory, requests] = await Promise.all([
                ResqApi.getInventory(),
                ResqApi.getRequests()
            ]);
            state.inventory = inventory || { foodKits: 0, medicineKits: 0 };
            state.requests = requests || [];

            if (activeInventoryResource) {
                renderSelectedResourceDetails(activeInventoryResource);
            }
        } catch (err) {
            console.error('Failed to load inventory data:', err);
        }
    }

    function showInventoryStep1() {
        activeInventoryResource = null;
        const step1 = document.getElementById('invStepBreakdown');
        const step2 = document.getElementById('invStepDetails');
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
    }

    function renderSelectedResourceDetails(resourceType) {
        activeInventoryResource = resourceType;
        const step1 = document.getElementById('invStepBreakdown');
        const step2 = document.getElementById('invStepDetails');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';

        const iconEl = document.getElementById('invSelectedIcon');
        const titleEl = document.getElementById('invSelectedTitle');
        const isFood = resourceType === 'FOOD';

        if (iconEl) iconEl.textContent = isFood ? '🍲' : '💊';
        if (titleEl) titleEl.textContent = isFood 
            ? 'Food Relief Kits — Stock & Allocation Details' 
            : 'Medical Relief Kits — Stock & Allocation Details';

        // Filter SUPPLY requests that require this resource and have not been archived
        const supplyReqs = (state.requests || []).filter(r => {
            if (r.requestType !== 'SUPPLY') return false;
            if (isFood) {
                return (r.foodRequired > 0) && !r.foodArchived;
            } else {
                return (r.medicineRequired > 0) && !r.medicineArchived;
            }
        });

        let totalRequired = 0;
        let remainingNeed = 0;
        let allocatedQuantity = 0;

        const regionRequirements = supplyReqs.map(req => {
            const required = isFood ? (req.foodRequired || 0) : (req.medicineRequired || 0);
            const remaining = isFood ? (req.foodOutstanding ?? required) : (req.medicineOutstanding ?? required);
            const allocated = Math.max(0, required - remaining);

            totalRequired += required;
            remainingNeed += remaining;
            allocatedQuantity += allocated;

            let status = 'Pending';
            let badgeClass = 'badge-waiting';
            if (remaining === 0) {
                status = 'Completed';
                badgeClass = 'badge-completed';
            } else if (allocated > 0) {
                status = 'In Progress';
                badgeClass = 'badge-in-progress';
            }

            return {
                requestId: req.requestId,
                regionName: req.region?.regionName || 'Incident Region',
                required,
                allocated,
                remaining,
                status,
                badgeClass
            };
        });

        const availableStock = isFood ? (state.inventory.foodKits ?? 0) : (state.inventory.medicineKits ?? 0);

        // Update 4 Overview Cards
        const availEl = document.getElementById('invDetailAvailable');
        const reqEl = document.getElementById('invDetailRequired');
        const allocEl = document.getElementById('invDetailAllocated');
        const remEl = document.getElementById('invDetailRemaining');

        if (availEl) availEl.textContent = availableStock.toLocaleString();
        if (reqEl) reqEl.textContent = totalRequired.toLocaleString();
        if (allocEl) allocEl.textContent = allocatedQuantity.toLocaleString();
        if (remEl) remEl.textContent = remainingNeed.toLocaleString();

        // Render Region-wise Requirements Table
        const tbody = document.getElementById('invRegionRequirementsBody');
        if (!tbody) return;

        if (regionRequirements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-box">
                        <div class="empty-state-icon">${isFood ? '🍲' : '💊'}</div>
                        <p class="empty-state-title">No active regional requirements</p>
                        <p class="empty-state-desc">All recorded ${isFood ? 'food' : 'medical'} demands have been satisfied or archived.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = regionRequirements.map(item => {
            const canDelete = item.status === 'Completed';
            return `
                <tr>
                    <td><strong>${escapeHtml(item.regionName)}</strong></td>
                    <td>${item.required.toLocaleString()} units</td>
                    <td>${item.allocated.toLocaleString()} units</td>
                    <td><strong>${item.remaining.toLocaleString()}</strong> units</td>
                    <td><span class="badge ${item.badgeClass}">${item.status}</span></td>
                    <td>
                        <button type="button" 
                                class="btn-delete-req" 
                                ${canDelete ? '' : 'disabled'} 
                                title="${canDelete ? 'Archive completed requirement' : 'Cannot delete: Requirement is not yet Completed'}"
                                onclick="window.resqDeleteRequirement(${item.requestId}, '${resourceType}', '${escapeHtml(item.regionName)}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Step 1 Selection Button Handlers
    const btnSelectFood = document.getElementById('btnSelectFood');
    const cardSelectFood = document.getElementById('cardSelectFood');
    const btnSelectMedical = document.getElementById('btnSelectMedical');
    const cardSelectMedical = document.getElementById('cardSelectMedical');
    const btnInvBack = document.getElementById('btnInvBack');

    if (btnSelectFood) btnSelectFood.addEventListener('click', () => renderSelectedResourceDetails('FOOD'));
    if (cardSelectFood) cardSelectFood.addEventListener('click', (e) => {
        if (e.target !== btnSelectFood) renderSelectedResourceDetails('FOOD');
    });

    if (btnSelectMedical) btnSelectMedical.addEventListener('click', () => renderSelectedResourceDetails('MEDICAL'));
    if (cardSelectMedical) cardSelectMedical.addEventListener('click', (e) => {
        if (e.target !== btnSelectMedical) renderSelectedResourceDetails('MEDICAL');
    });

    if (btnInvBack) btnInvBack.addEventListener('click', () => showInventoryStep1());

    // Safe Requirement Archival Action
    window.resqDeleteRequirement = function(requestId, resourceType, regionName) {
        const resourceName = resourceType === 'FOOD' ? 'Food Relief Kits' : 'Medical Relief Kits';
        showConfirmation(
            `Archive Completed ${resourceName} Requirement`,
            `Are you sure you want to remove the completed ${resourceName} requirement for "${regionName}" from active inventory tracking? Historical records, disaster logs, and request history will remain safely preserved.`,
            'Delete Requirement',
            async () => {
                try {
                    await ResqApi.archiveRequirement(requestId, resourceType);
                    showToast(`Completed ${resourceName} requirement for ${regionName} safely archived.`);
                    await loadInventoryData();
                } catch (err) {
                    showToast(err.message || 'Failed to archive requirement.', 'error');
                }
            }
        );
    };

    // --- Rescue Teams Data ---
    async function loadTeamsData() {
        const tbody = document.getElementById('teamsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="loading-box"><span class="spinner"></span> Loading rescue teams...</td></tr>';

        try {
            const [teams, requests, regions] = await Promise.all([
                ResqApi.getRescueTeams(),
                ResqApi.getRequests(),
                ResqApi.getRegions()
            ]);

            state.teams = teams || [];
            state.requests = requests || [];
            state.regions = regions || [];

            // Summary Cards
            const total = state.teams.length;
            const available = state.teams.filter(t => t.available).length;
            const busy = total - available;

            const statTotal = document.getElementById('teamStatTotal');
            const statAvail = document.getElementById('teamStatAvailable');
            const statBusy = document.getElementById('teamStatBusy');

            if (statTotal) statTotal.textContent = total;
            if (statAvail) statAvail.textContent = available;
            if (statBusy) statBusy.textContent = busy;

            // Populate Coordinator Deploy Team Dropdowns
            populateDeployTeamDropdowns();

            renderTeamsTable(state.teams);
        } catch (err) {
            if (tbody) {
                if (err.message === 'BACKEND_OFFLINE') {
                    renderBackendOfflineView('teams');
                } else {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="empty-state-box" style="padding: 24px;">
                                <p style="color: #F87171; font-weight: 600;">Failed to load rescue teams: ${escapeHtml(err.message)}</p>
                                <button class="btn btn-secondary btn-sm" onclick="loadTeamsData()" style="margin-top: 8px;">Retry</button>
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }

    function populateDeployTeamDropdowns() {
        if (elements.assignTeamSelect) {
            const availTeams = (state.teams || []).filter(t => t.available);
            elements.assignTeamSelect.innerHTML = '<option value="">Select available team...</option>' +
                availTeams.map(t => `<option value="${t.teamId}">#${t.teamId} - ${escapeHtml(t.teamName)} (${escapeHtml(t.currentLocation)})</option>`).join('');
            if (availTeams.length === 0) {
                elements.assignTeamSelect.innerHTML = '<option value="">No available teams on standby</option>';
            }
        }

        if (elements.assignRegionSelect) {
            const waitingRescueMap = {};
            (state.requests || []).forEach(r => {
                if (r.requestType === 'RESCUE' && (r.status === 'WAITING' || r.status === 'PENDING')) {
                    const regId = r.region?.regionId || r.regionId;
                    if (regId) waitingRescueMap[regId] = true;
                }
            });

            elements.assignRegionSelect.innerHTML = '<option value="">Select target region...</option>' +
                (state.regions || []).map(r => {
                    const hasReq = waitingRescueMap[r.regionId];
                    return `<option value="${r.regionId}">#${r.regionId} - ${escapeHtml(r.regionName)} (Severity ${r.severity}/5)${hasReq ? ' [Rescue Needed]' : ''}</option>`;
                }).join('');
        }
    }

    // Deploy Team Form Handler
    if (elements.assignTeamForm && !elements.assignTeamForm._resqBound) {
        elements.assignTeamForm._resqBound = true;
        elements.assignTeamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.assignTeamErrorBox) elements.assignTeamErrorBox.style.display = 'none';

            const teamId = parseInt(elements.assignTeamSelect.value, 10);
            const regionId = parseInt(elements.assignRegionSelect.value, 10);

            if (!teamId || !regionId) {
                if (elements.assignTeamErrorBox) {
                    elements.assignTeamErrorBox.textContent = 'Please select both an available rescue team and a target region.';
                    elements.assignTeamErrorBox.style.display = 'block';
                }
                return;
            }

            const team = state.teams.find(t => t.teamId === teamId);
            if (team && !team.available) {
                if (elements.assignTeamErrorBox) {
                    elements.assignTeamErrorBox.textContent = `Team #${teamId} is already busy on an active mission and cannot be deployed.`;
                    elements.assignTeamErrorBox.style.display = 'block';
                }
                return;
            }

            if (elements.btnAssignTeamSubmit) elements.btnAssignTeamSubmit.disabled = true;

            try {
                const res = await ResqApi.assignRescueTeam(teamId, regionId);
                showToast(res.message || `Team #${teamId} successfully deployed to region #${regionId}!`);
                elements.assignTeamForm.reset();
                await loadTeamsData();
                await loadDashboardData();
            } catch (err) {
                console.error('Failed to assign team:', err);
                if (elements.assignTeamErrorBox) {
                    elements.assignTeamErrorBox.textContent = err.message || 'Failed to assign rescue team.';
                    elements.assignTeamErrorBox.style.display = 'block';
                }
            } finally {
                if (elements.btnAssignTeamSubmit) elements.btnAssignTeamSubmit.disabled = false;
            }
        });
    }

    function renderTeamsTable(teams) {
        const tbody = document.getElementById('teamsTableBody');
        if (!tbody) return;

        if (!teams || teams.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-box">
                        <div class="empty-state-icon">👥</div>
                        <p class="empty-state-title">No rescue teams registered</p>
                        <p class="empty-state-desc">Personnel roster is empty.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const isPublic = state.currentUser?.role === 'PUBLIC';

        tbody.innerHTML = teams.map(t => {
            let missionText = '<span class="text-muted">Standby / Unassigned</span>';
            if (!t.available) {
                const activeReq = (state.requests || []).find(r => 
                    r.requestType === 'RESCUE' && 
                    r.status !== 'COMPLETED' && 
                    (r.assignedTeamId === t.teamId || (r.assignedTeam && r.assignedTeam.teamId === t.teamId))
                );
                if (activeReq) {
                    missionText = `<strong>Rescue Op #${activeReq.requestId}</strong> (${escapeHtml(activeReq.region?.regionName || activeReq.regionName || t.currentLocation)})`;
                } else {
                    missionText = `<strong>Deployed</strong> (${escapeHtml(t.currentLocation)})`;
                }
            }

            return `
                <tr>
                    <td><strong>#${t.teamId}</strong></td>
                    <td><strong>${escapeHtml(t.teamName)}</strong></td>
                    <td>📍 ${escapeHtml(t.currentLocation)}</td>
                    <td>
                        ${t.available 
                            ? '<span class="badge badge-available">● Available</span>' 
                            : '<span class="badge badge-busy">● Busy (Deployed)</span>'}
                    </td>
                    <td>${missionText}</td>
                    <td class="coordinator-only-action">
                        ${!isPublic ? (
                            t.available 
                                ? `<button class="btn btn-secondary btn-sm toggle-team-btn" data-id="${t.teamId}" data-status="true">Set Busy</button>`
                                : `<button class="btn btn-danger btn-sm release-team-btn" data-id="${t.teamId}">Release Team</button>`
                        ) : ''}
                    </td>
                </tr>
            `;
        }).join('');

        if (!isPublic) {
            document.querySelectorAll('.toggle-team-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const teamId = e.currentTarget.getAttribute('data-id');
                    try {
                        await ResqApi.updateTeamStatus(teamId, false);
                        showToast(`Team #${teamId} marked BUSY.`);
                        loadTeamsData();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            });

            document.querySelectorAll('.release-team-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const teamId = e.currentTarget.getAttribute('data-id');
                    try {
                        await ResqApi.releaseRescueTeam(teamId);
                        showToast(`Team #${teamId} released to Standby/Available.`);
                        await loadTeamsData();
                        await loadDashboardData();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            });
        }
    }

    // --- Shelters Data ---
    async function loadSheltersData() {
        const tbody = document.getElementById('sheltersTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="loading-box"><span class="spinner"></span> Loading shelters...</td></tr>`;

        try {
            const shelters = await ResqApi.getShelters();
            state.shelters = shelters || [];

            // Summary Cards
            const totalCount = state.shelters.length;
            let totalCapacity = 0;
            let totalOccupied = 0;

            state.shelters.forEach(s => {
                totalCapacity += (s.capacity || 0);
                totalOccupied += (s.occupied || 0);
            });

            const availableCapacity = Math.max(0, totalCapacity - totalOccupied);

            const statTotal = document.getElementById('shelterStatTotal');
            const statCap = document.getElementById('shelterStatCapacity');
            const statOcc = document.getElementById('shelterStatOccupied');
            const statAvail = document.getElementById('shelterStatAvailable');

            if (statTotal) statTotal.textContent = totalCount;
            if (statCap) statCap.textContent = totalCapacity.toLocaleString();
            if (statOcc) statOcc.textContent = totalOccupied.toLocaleString();
            if (statAvail) statAvail.textContent = availableCapacity.toLocaleString();

            renderSheltersTable(state.shelters);
        } catch (err) {
            if (tbody) {
                if (err.message === 'BACKEND_OFFLINE') {
                    renderBackendOfflineView('shelters');
                } else {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" class="empty-state-box" style="padding: 24px;">
                                <div class="empty-state-icon" style="color: var(--color-danger); font-size: 28px;">⚠️</div>
                                <p class="empty-state-title" style="color: var(--color-danger); font-size: 15px; margin: 6px 0;">Failed to Load Shelters</p>
                                <p class="empty-state-desc" style="color: var(--color-text-secondary); max-width: 440px; margin: 0 auto 14px; font-size: 12px;">
                                    ${escapeHtml(err.message)}
                                </p>
                                <button type="button" class="btn btn-primary btn-sm" onclick="window.resqRetryCurrentView()">
                                    ↻ Retry Connection
                                </button>
                            </td>
                        </tr>
                    `;
                }
            }
        }
    }

    function renderSheltersTable(shelters) {
        const tbody = document.getElementById('sheltersTableBody');
        if (!tbody) return;

        if (!shelters || shelters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state-box">
                        <div class="empty-state-icon">🏕️</div>
                        <p class="empty-state-title">No evacuation shelters registered</p>
                        <p class="empty-state-desc">Emergency shelters list is empty.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = shelters.map(s => {
            const cap = s.capacity || 1;
            const occ = s.occupied || 0;
            const avail = Math.max(0, cap - occ);
            const percent = Math.min(100, Math.round((occ / cap) * 100));

            // Status definition: Available (<80%), Nearly Full (>=80%), Full (100% or avail <= 0)
            let statusBadge = '<span class="shelter-status-badge available">Available</span>';
            let fillClass = 'status-available';

            if (percent >= 100 || avail <= 0) {
                statusBadge = '<span class="shelter-status-badge full">Full</span>';
                fillClass = 'status-full';
            } else if (percent >= 80) {
                statusBadge = '<span class="shelter-status-badge nearly-full">Nearly Full</span>';
                fillClass = 'status-nearly-full';
            }

            return `
                <tr>
                    <td><strong>#${s.shelterId}</strong></td>
                    <td><strong>${escapeHtml(s.shelterName)}</strong></td>
                    <td>📍 ${escapeHtml(s.location)}</td>
                    <td>${cap.toLocaleString()}</td>
                    <td>${occ.toLocaleString()}</td>
                    <td><strong>${avail.toLocaleString()}</strong></td>
                    <td class="capacity-progress-cell">
                        <div class="capacity-progress-bar">
                            <div class="capacity-progress-fill ${fillClass}" style="width: ${percent}%;"></div>
                        </div>
                        <span class="capacity-progress-text">${occ} / ${cap} (${percent}%)</span>
                    </td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    // ==========================================================================
    // RESPONSIVE THREE-AREA ROUTING & INTERACTIVE SVG MAP
    // ==========================================================================
    // ==========================================================================
    // RESPONSIVE THREE-AREA ROUTING & INTERACTIVE SVG MAP
    // ==========================================================================
    let selectedRoutingOrigin = 'Aruvi Village';
    let selectedRoutingDestination = null;
    let currentCandidateRoutes = [];
    let selectedRouteIndex = 0;

    // Node schematic coordinates and collision-free label placements
    const SCHEMATIC_NODE_POSITIONS = {
        'Aruvi Village': { x: 140, y: 150, lx: -18, ly: -6, anchor: 'end' },
        'Kurinji Nagar': { x: 380, y: 70, lx: 0, ly: -22, anchor: 'middle' },
        'Mullai Area': { x: 670, y: 70, lx: 0, ly: -22, anchor: 'middle' },
        'Marutham Town': { x: 740, y: 250, lx: 22, ly: 5, anchor: 'start' },
        'Neithal Colony': { x: 740, y: 430, lx: 22, ly: 5, anchor: 'start' },
        'Valley Road': { x: 420, y: 440, lx: 0, ly: 26, anchor: 'middle' },
        'River Side': { x: 450, y: 250, lx: 0, ly: -22, anchor: 'middle' },
        'Hill View': { x: 140, y: 390, lx: -18, ly: 6, anchor: 'end' },
        'Test Haven 5093': { x: 530, y: 160, lx: 0, ly: -22, anchor: 'middle' },
        'Uptown': { x: 840, y: 150, lx: -16, ly: 0, anchor: 'end' },
        'Midtown': { x: 840, y: 250, lx: -16, ly: 0, anchor: 'end' },
        'Downtown': { x: 840, y: 350, lx: -16, ly: 0, anchor: 'end' }
    };

    function getNodePosition(nodeName, allNodes = []) {
        if (SCHEMATIC_NODE_POSITIONS[nodeName]) {
            return SCHEMATIC_NODE_POSITIONS[nodeName];
        }
        // Fallback: place dynamic nodes around outer perimeter with distinct angles
        const index = allNodes.indexOf(nodeName);
        const total = Math.max(1, allNodes.length);
        const angle = (index / total) * 2 * Math.PI;
        return {
            x: Math.round(440 + 280 * Math.cos(angle)),
            y: Math.round(250 + 170 * Math.sin(angle)),
            lx: 0,
            ly: 24,
            anchor: 'middle'
        };
    }

    async function loadRoadsData() {
        const roadsTbody = document.getElementById('roadsTableBody');
        const listEl = document.getElementById('routingRegionsList');
        if (roadsTbody) roadsTbody.innerHTML = `<tr><td colspan="5" class="loading-box"><span class="spinner"></span> Loading road network...</td></tr>`;
        if (listEl) listEl.innerHTML = `<div class="loading-box"><span class="spinner"></span> Loading priority regions...</div>`;

        try {
            const [roads, regions] = await Promise.all([
                ResqApi.getRoadNetwork(),
                ResqApi.getRegions(true)
            ]);

            state.roads = roads || [];
            state.regions = regions || [];

            renderRoadsTable(state.roads);
            populateRoadRegionDropdowns();
            renderRoutingLeftPanel();
            renderInteractiveSvgMap();

            // If no destination is currently selected, auto-select first mapped region to calculate routes
            if (!selectedRoutingDestination && state.regions.length > 0) {
                const firstMapped = state.regions.find(r => r.hasRoadMapping !== false);
                if (firstMapped) {
                    selectedRoutingDestination = firstMapped.regionName;
                    renderRoutingLeftPanel();
                    executeRoutingCalculation(selectedRoutingOrigin, selectedRoutingDestination);
                }
            } else if (selectedRoutingDestination) {
                executeRoutingCalculation(selectedRoutingOrigin, selectedRoutingDestination);
            }
        } catch (err) {
            if (err.message === 'BACKEND_OFFLINE') {
                renderBackendOfflineView('roads');
            } else {
                if (roadsTbody) {
                    roadsTbody.innerHTML = `
                        <tr>
                            <td colspan="5" class="empty-state-box" style="padding: 24px;">
                                <div class="empty-state-icon" style="color: var(--color-danger); font-size: 28px;">⚠️</div>
                                <p class="empty-state-title" style="color: var(--color-danger); font-size: 15px; margin: 6px 0;">Failed to Load Road Network</p>
                                <p class="empty-state-desc" style="color: var(--color-text-secondary); max-width: 440px; margin: 0 auto 14px; font-size: 12px;">
                                    ${escapeHtml(err.message)}
                                </p>
                                <button type="button" class="btn btn-primary btn-sm" onclick="window.resqRetryCurrentView()">
                                    ↻ Retry Connection
                                </button>
                            </td>
                        </tr>
                    `;
                }
                if (listEl) {
                    listEl.innerHTML = `
                        <div class="empty-state-box" style="padding: 20px;">
                            <p style="color: var(--color-danger); margin-bottom: 8px;">⚠️ ${escapeHtml(err.message)}</p>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="window.resqRetryCurrentView()">↻ Retry</button>
                        </div>
                    `;
                }
            }
        }
    }

    function renderRoutingLeftPanel() {
        const selectEl = document.getElementById('routeStartSelect');
        const listEl = document.getElementById('routingRegionsList');

        // Exclude disconnected test nodes (Uptown, Midtown, Downtown)
        const DISCONNECTED_TEST_NODES = new Set(['uptown', 'midtown', 'downtown']);

        // Populate Start Depot selector using actual recorded road junctions
        if (selectEl) {
            const allOrigins = new Set();
            state.roads.forEach(r => {
                const s = (r.source || '').trim();
                const d = (r.destination || '').trim();
                if (s && !DISCONNECTED_TEST_NODES.has(s.toLowerCase())) allOrigins.add(s);
                if (d && !DISCONNECTED_TEST_NODES.has(d.toLowerCase())) allOrigins.add(d);
            });
            if (allOrigins.size === 0) allOrigins.add('Aruvi Village');
            if (!allOrigins.has(selectedRoutingOrigin)) {
                selectedRoutingOrigin = allOrigins.has('Aruvi Village') ? 'Aruvi Village' : Array.from(allOrigins)[0];
            }
            selectEl.innerHTML = Array.from(allOrigins).map(o => 
                `<option value="${escapeHtml(o)}" ${o === selectedRoutingOrigin ? 'selected' : ''}>${escapeHtml(o)}</option>`
            ).join('');

            selectEl.onchange = (e) => {
                selectedRoutingOrigin = e.target.value;
                if (selectedRoutingDestination) {
                    executeRoutingCalculation(selectedRoutingOrigin, selectedRoutingDestination);
                } else {
                    renderInteractiveSvgMap();
                }
            };
        }

        // Populate Priority Affected Regions
        if (listEl) {
            if (state.regions.length === 0) {
                listEl.innerHTML = `<div class="empty-state-box">No affected regions found</div>`;
                return;
            }

            // Deduplicate to guarantee each region appears once
            const seenKeys = new Set();
            const uniqueRegions = state.regions.filter(r => {
                const key = (r.regionId != null ? String(r.regionId) : r.regionName).toLowerCase();
                if (seenKeys.has(key)) return false;
                seenKeys.add(key);
                return true;
            });

            // Distinguish automated test artifacts from genuine regions
            const isTestArtifact = (name) => {
                const lower = (name || '').toLowerCase();
                return lower.startsWith('delta sector') || lower.startsWith('test haven') || lower.includes('test zone');
            };

            const disasterRegions = uniqueRegions.filter(r => !isTestArtifact(r.regionName));
            const testRegions = uniqueRegions.filter(r => isTestArtifact(r.regionName));

            // Sorted by priority: severity desc, population desc
            disasterRegions.sort((a, b) => {
                if (b.severity !== a.severity) return b.severity - a.severity;
                return (b.population || 0) - (a.population || 0);
            });

            const renderRegionItem = (r, isTest = false) => {
                const isSelected = selectedRoutingDestination === r.regionName;
                const hasRoads = r.hasRoadMapping !== false;
                let reachabilityText = '';
                let statusTag = '';

                if (!hasRoads) {
                    reachabilityText = '⚠️ Unmapped (No Road Connections)';
                    statusTag = '<span class="badge badge-low" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">Unmapped</span>';
                } else if (r.networkReachable === false) {
                    reachabilityText = '✕ Cut Off (All Routes Blocked)';
                    statusTag = '<span class="badge badge-critical">Cut Off</span>';
                } else if (r.accessible === false) {
                    reachabilityText = '✓ Open Transit (Local Hazard)';
                    statusTag = '<span class="badge badge-waiting">Local Hazard</span>';
                } else {
                    reachabilityText = '✓ Open Transit Path';
                    statusTag = '<span class="badge badge-available">Open</span>';
                }

                return `
                    <div class="routing-region-item ${isSelected ? 'active' : ''} ${!hasRoads ? 'is-unmapped' : ''}" 
                         data-region="${escapeHtml(r.regionName)}"
                         data-region-id="${r.regionId}"
                         data-has-roads="${hasRoads}">
                        <div class="routing-region-info">
                            <span class="routing-region-name">
                                <strong>#${r.regionId}</strong> ${escapeHtml(r.regionName)}
                            </span>
                            <span class="routing-region-meta">
                                ${(r.population || 0).toLocaleString()} citizens · ${reachabilityText}
                            </span>
                        </div>
                        <div class="routing-region-badges" style="display: flex; gap: 6px; align-items: center;">
                            ${statusTag}
                            ${renderSeverityBadge(r.severity)}
                        </div>
                    </div>
                `;
            };

            let listHtml = disasterRegions.map(r => renderRegionItem(r, false)).join('');

            if (testRegions.length > 0) {
                listHtml += `
                    <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #323644;">
                        <div style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 6px;">
                            Test Artifact Records in DB (${testRegions.length})
                        </div>
                        ${testRegions.map(r => renderRegionItem(r, true)).join('')}
                    </div>
                `;
            }

            listEl.innerHTML = listHtml;

            listEl.querySelectorAll('.routing-region-item').forEach(item => {
                item.addEventListener('click', () => {
                    const dest = item.getAttribute('data-region');
                    const regionId = item.getAttribute('data-region-id');
                    const hasRoads = item.getAttribute('data-has-roads') === 'true';

                    selectedRoutingDestination = dest;
                    listEl.querySelectorAll('.routing-region-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');

                    if (!hasRoads) {
                        const container = document.getElementById('routeOptionsContainer');
                        const countSubtitle = document.getElementById('routeCountSubtitle');
                        const mapSubtitle = document.getElementById('routingMapSubtitle');

                        if (countSubtitle) countSubtitle.textContent = 'Unmapped Infrastructure — No road segments connect to this region';
                        if (mapSubtitle) mapSubtitle.textContent = `Region ${dest} has no recorded road connections in the graph network`;

                        if (container) {
                            container.innerHTML = `
                                <div class="alert-banner warning" style="border-left: 4px solid #F59E0B; background: rgba(245, 158, 11, 0.1); padding: 18px; border-radius: 8px;">
                                    <div style="font-size: 16px; font-weight: 700; color: #fbbf24; margin-bottom: 8px;">
                                        ⚠️ Unmapped Infrastructure: Region #${regionId} (${escapeHtml(dest)})
                                    </div>
                                    <div style="color: #9EA3B0; line-height: 1.6; font-size: 13px;">
                                        This location is registered in the database, but <strong>no road connections</strong> have been mapped to it in the road network graph.
                                        <br><br>
                                        <strong>Action required:</strong> Use the <em>Add Road Connection</em> form below to connect <strong>${escapeHtml(dest)}</strong> to a nearby junction or depot before routes can be evaluated.
                                    </div>
                                </div>
                            `;
                        }
                        currentCandidateRoutes = [];
                        renderInteractiveSvgMap();
                        return;
                    }

                    executeRoutingCalculation(selectedRoutingOrigin, selectedRoutingDestination);
                });
            });
        }
    }

    async function executeRoutingCalculation(source, destination) {
        const container = document.getElementById('routeOptionsContainer');
        const countSubtitle = document.getElementById('routeCountSubtitle');
        const mapSubtitle = document.getElementById('routingMapSubtitle');

        if (!source || !destination) return;

        if (container) {
            container.innerHTML = `<div class="loading-box"><span class="spinner"></span> Evaluating candidate routes using Dijkstra...</div>`;
        }

        if (mapSubtitle) {
            mapSubtitle.textContent = `Analyzing evacuation paths from ${source} to ${destination}`;
        }

        if (source === destination) {
            currentCandidateRoutes = [{
                routeId: 1,
                routeName: 'Direct Access (Origin is Destination)',
                waypoints: [source],
                path: [source],
                totalTravelTime: 0,
                travelTime: 0,
                available: true,
                status: 'AVAILABLE',
                isRecommended: true
            }];
            selectedRouteIndex = 0;
            if (countSubtitle) countSubtitle.textContent = 'Origin and destination are identical (0 min travel time)';
            renderCandidateRouteCards(currentCandidateRoutes);
            renderInteractiveSvgMap();
            return;
        }

        try {
            let response = null;
            try {
                response = await ResqApi.getCandidateRoutes(source, destination);
            } catch (candErr) {
                const fallback = await ResqApi.getShortestRoute(source, destination);
                response = {
                    shortestRoute: fallback,
                    candidateRoutes: fallback && fallback.reachable ? [fallback] : []
                };
            }

            const rawList = Array.isArray(response) ? response : (response?.candidateRoutes || (response?.shortestRoute ? [response.shortestRoute] : []));

            // Check for special statuses: UNMAPPED_DESTINATION or DISCONNECTED_NETWORK
            const specialItem = rawList.find(r => r.status === 'UNMAPPED_DESTINATION' || r.status === 'DISCONNECTED_NETWORK');
            if (specialItem) {
                if (countSubtitle) {
                    countSubtitle.textContent = specialItem.status === 'UNMAPPED_DESTINATION' 
                        ? 'Unmapped Infrastructure — No roads recorded' 
                        : 'Disconnected Network — No graph path exists';
                }
                if (container) {
                    container.innerHTML = `
                        <div class="alert-banner warning" style="border-left: 4px solid #F59E0B; background: rgba(245, 158, 11, 0.1); padding: 18px; border-radius: 8px;">
                            <div style="font-size: 16px; font-weight: 700; color: #fbbf24; margin-bottom: 8px;">
                                ${specialItem.status === 'UNMAPPED_DESTINATION' ? '⚠️ Unmapped Infrastructure' : '⚠️ Disconnected Network Partition'}
                            </div>
                            <div style="color: #9EA3B0; line-height: 1.6; font-size: 13px;">
                                ${escapeHtml(specialItem.message || 'No road path connects the selected locations.')}
                            </div>
                        </div>
                    `;
                }
                currentCandidateRoutes = [];
                renderInteractiveSvgMap();
                return;
            }

            // Normal routes (Available or Blocked by closures)
            currentCandidateRoutes = rawList.map(r => ({
                ...r,
                waypoints: r.waypoints || r.path || [],
                totalTravelTime: r.totalTravelTime != null ? r.totalTravelTime : (r.travelTime != null ? r.travelTime : 'N/A'),
                status: r.status || (r.available === false ? 'BLOCKED' : 'AVAILABLE')
            })).filter(r => r.waypoints.length > 0);

            selectedRouteIndex = 0;

            const openRoutesCount = currentCandidateRoutes.filter(r => r.available !== false).length;
            const blockedRoutesCount = currentCandidateRoutes.filter(r => r.available === false).length;

            if (countSubtitle) {
                if (openRoutesCount > 0) {
                    countSubtitle.textContent = `${openRoutesCount} open viable path(s) evaluated (${blockedRoutesCount} blocked alternative(s))`;
                } else if (blockedRoutesCount > 0) {
                    countSubtitle.textContent = `All ${blockedRoutesCount} candidate path(s) are cut off by road closures`;
                } else {
                    countSubtitle.textContent = `0 viable open candidate paths evaluated`;
                }
            }

            renderCandidateRouteCards(currentCandidateRoutes);
            renderInteractiveSvgMap();
        } catch (err) {
            if (container) {
                container.innerHTML = `
                    <div class="alert-banner offline">
                        <span class="alert-banner-icon">⚠️</span>
                        <div class="alert-banner-text">
                            <strong>No Usable Route Available:</strong> No open road connects ${escapeHtml(source)} and ${escapeHtml(destination)}. Intervening road segments are closed or disconnected.
                        </div>
                    </div>
                `;
            }
            currentCandidateRoutes = [];
            if (countSubtitle) countSubtitle.textContent = '0 viable candidate paths evaluated';
            renderInteractiveSvgMap();
        }
    }

    function renderCandidateRouteCards(routes) {
        const container = document.getElementById('routeOptionsContainer');
        if (!container) return;

        if (!routes || routes.length === 0) {
            container.innerHTML = `
                <div class="alert-banner offline">
                    <span class="alert-banner-icon">⚠️</span>
                    <div class="alert-banner-text">
                        <strong>No Usable Route Available:</strong> No open road connects the starting point to the destination. Intervening segments are blocked by road closures.
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = routes.map((r, idx) => {
            const isBlocked = r.available === false || r.status === 'BLOCKED';
            const isRecommended = (idx === 0 || r.isRecommended) && !isBlocked;
            const isSelected = selectedRouteIndex === idx;

            let tagClass = 'alternative';
            let tagText = `Alternative #${idx}`;
            if (isRecommended) {
                tagClass = 'recommended';
                tagText = 'Recommended Shortest';
            } else if (isBlocked) {
                tagClass = 'blocked';
                tagText = 'Blocked by Closure';
            }

            const routeTitle = r.routeName || `Route Option #${idx + 1}`;

            const waypointsHtml = r.waypoints.map((wp, wIdx) => `
                <span class="route-step-node">${escapeHtml(wp)}</span>
                ${wIdx < r.waypoints.length - 1 ? '<span class="route-step-arrow">➔</span>' : ''}
            `).join('');

            return `
                <div class="candidate-route-card ${isSelected ? (isRecommended ? 'is-selected' : (isBlocked ? 'is-blocked-selected' : 'is-alt-selected')) : ''}" data-index="${idx}">
                    <div class="candidate-route-header">
                        <span class="candidate-route-title">${escapeHtml(routeTitle)}</span>
                        <span class="candidate-route-tag ${tagClass}">${tagText}</span>
                    </div>
                    <div class="candidate-route-path">
                        ${waypointsHtml}
                    </div>
                    <div class="candidate-route-stats">
                        <span>Travel Time: <strong>${r.totalTravelTime} mins</strong></span>
                        ${r.totalDistance != null && r.totalDistance > 0 ? `<span>Distance: <strong>${r.totalDistance} km</strong></span>` : ''}
                        <span>Status: <strong style="color: ${isBlocked ? '#DC3545' : '#28A745'};">${isBlocked ? '✕ Blocked' : '✓ Available'}</strong></span>
                    </div>
                    ${r.blockedSegment ? `
                        <div style="margin-top: 8px; font-size: 12px; color: #DC3545; background: rgba(220, 53, 69, 0.1); padding: 4px 8px; border-radius: 4px;">
                            ⛔ Blocked Segment: <strong>${escapeHtml(r.blockedSegment)}</strong>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.querySelectorAll('.candidate-route-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.getAttribute('data-index'), 10);
                selectedRouteIndex = idx;
                renderCandidateRouteCards(currentCandidateRoutes);
                renderInteractiveSvgMap();
            });
        });
    }

    function renderInteractiveSvgMap() {
        const svg = document.getElementById('roadNetworkSvg');
        if (!svg) return;

        // Disconnected test nodes to filter out from disaster map
        const DISCONNECTED_TEST_NODES = new Set(['uptown', 'midtown', 'downtown']);

        // Gather only nodes that exist in the active disaster road network
        const nodeSet = new Set();
        state.roads.forEach(r => {
            const s = (r.source || '').trim();
            const d = (r.destination || '').trim();
            if (s && !DISCONNECTED_TEST_NODES.has(s.toLowerCase())) nodeSet.add(s);
            if (d && !DISCONNECTED_TEST_NODES.has(d.toLowerCase())) nodeSet.add(d);
        });

        // Only include origin and destination if they have road connections in the graph
        if (selectedRoutingOrigin && nodeSet.has(selectedRoutingOrigin)) nodeSet.add(selectedRoutingOrigin);
        if (selectedRoutingDestination && nodeSet.has(selectedRoutingDestination)) nodeSet.add(selectedRoutingDestination);

        const allNodes = Array.from(nodeSet);

        // Precompute coordinates
        const positions = {};
        allNodes.forEach(node => {
            positions[node] = getNodePosition(node, allNodes);
        });

        // Determine active route edges
        const activeRoute = currentCandidateRoutes[selectedRouteIndex];
        const routeEdges = new Set();
        if (activeRoute && activeRoute.waypoints) {
            for (let i = 0; i < activeRoute.waypoints.length - 1; i++) {
                const u = activeRoute.waypoints[i];
                const v = activeRoute.waypoints[i + 1];
                routeEdges.add(`${u}___${v}`);
                routeEdges.add(`${v}___${u}`);
            }
        }

        let edgesSvg = '';
        let nodesSvg = '';

        // 1. Draw Edges (excluding disconnected test nodes)
        state.roads.forEach((road, rIdx) => {
            const s = (road.source || '').trim();
            const d = (road.destination || '').trim();
            if (DISCONNECTED_TEST_NODES.has(s.toLowerCase()) || DISCONNECTED_TEST_NODES.has(d.toLowerCase())) return;

            const p1 = positions[s];
            const p2 = positions[d];
            if (!p1 || !p2) return;

            const isClosed = !road.open;
            const isOnActiveRoute = routeEdges.has(`${s}___${d}`);

            let edgeClass = 'svg-edge';
            if (isClosed) {
                edgeClass += ' closed-road';
            } else if (isOnActiveRoute) {
                if (selectedRouteIndex === 0 && activeRoute.available !== false) edgeClass += ' shortest-route';
                else if (selectedRouteIndex === 1 && activeRoute.available !== false) edgeClass += ' alt-route-1';
                else if (activeRoute.available === false) edgeClass += ' closed-road';
                else edgeClass += ' alt-route-2';
            }

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            edgesSvg += `
                <g class="svg-edge-group" data-road-idx="${rIdx}" data-source="${escapeHtml(s)}" data-dest="${escapeHtml(d)}">
                    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="${edgeClass}" />
                    <rect x="${midX - 18}" y="${midY - 9}" width="36" height="16" rx="4" fill="#1C1E26" stroke="${isClosed ? '#DC3545' : '#323644'}" stroke-width="1" />
                    <text x="${midX}" y="${midY + 3}" class="svg-edge-label" fill="${isClosed ? '#DC3545' : '#9EA3B0'}">${isClosed ? '✕' : `${road.travelTime}m`}</text>
                </g>
            `;
        });

        // 2. Draw Nodes with distinct roles & readable labels
        allNodes.forEach(node => {
            const pos = positions[node];
            if (!pos) return;

            const isDepot = node === selectedRoutingOrigin;
            const isDestination = node === selectedRoutingDestination;
            const isOnRoute = activeRoute && activeRoute.waypoints && activeRoute.waypoints.includes(node);
            const isAffectedRegion = state.regions.some(reg => reg.regionName.toLowerCase() === node.toLowerCase());

            let nodeClass = 'svg-node';
            if (isDepot) nodeClass += ' is-depot';
            if (isDestination) nodeClass += ' is-destination';
            if (isOnRoute && !isDepot && !isDestination) nodeClass += ' on-shortest-route';
            if (isAffectedRegion) nodeClass += ' is-affected-region';

            const lx = pos.lx != null ? pos.lx : 0;
            const ly = pos.ly != null ? pos.ly : 24;
            const anchor = pos.anchor || 'middle';

            nodesSvg += `
                <g class="${nodeClass}" data-node="${escapeHtml(node)}" transform="translate(${pos.x}, ${pos.y})">
                    <circle r="${isDepot || isDestination ? 18 : 14}" />
                    <text x="${lx}" y="${ly}" text-anchor="${anchor}">${escapeHtml(node)}</text>
                </g>
            `;
        });

        svg.innerHTML = `
            <defs>
                <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#28A745"/>
                </filter>
            </defs>
            ${edgesSvg}
            ${nodesSvg}
        `;

        // Wire SVG Node Clicks to select destination
        svg.querySelectorAll('.svg-node').forEach(nodeEl => {
            nodeEl.addEventListener('click', () => {
                const nodeName = nodeEl.getAttribute('data-node');
                if (nodeName && nodeName !== selectedRoutingOrigin) {
                    selectedRoutingDestination = nodeName;
                    renderRoutingLeftPanel();
                    executeRoutingCalculation(selectedRoutingOrigin, selectedRoutingDestination);
                }
            });
        });

        // Wire SVG Edge Clicks
        svg.querySelectorAll('.svg-edge-group').forEach(edgeEl => {
            edgeEl.addEventListener('click', () => {
                const src = edgeEl.getAttribute('data-source');
                const dst = edgeEl.getAttribute('data-dest');
                const road = state.roads.find(r => 
                    (r.source === src && r.destination === dst) || 
                    (r.source === dst && r.destination === src)
                );
                if (road) {
                    showToast(`Road [${road.source} ↔ ${road.destination}]: ${road.travelTime} mins (${road.open ? 'OPEN' : 'CLOSED'})`);
                }
            });
        });
    }


    // Reset Map View Button
    const btnResetMapView = document.getElementById('btnResetMapView');
    if (btnResetMapView) {
        btnResetMapView.addEventListener('click', () => {
            selectedRoutingDestination = null;
            currentCandidateRoutes = [];
            selectedRouteIndex = 0;
            const container = document.getElementById('routeOptionsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="empty-route-notice">
                        <span class="empty-icon">📍</span>
                        <p>Select an affected region from the list on the left to compute and compare candidate evacuation routes.</p>
                    </div>
                `;
            }
            const countSubtitle = document.getElementById('routeCountSubtitle');
            if (countSubtitle) countSubtitle.textContent = 'Select a destination to evaluate paths';
            const mapSubtitle = document.getElementById('routingMapSubtitle');
            if (mapSubtitle) mapSubtitle.textContent = 'Click any region node or road to inspect routes and status';
            renderRoutingLeftPanel();
            renderInteractiveSvgMap();
            showToast('Map route view reset.');
        });
    }

    function renderRoadsTable(roads) {
        const tbody = document.getElementById('roadsTableBody');
        if (!tbody) return;

        if (!roads || roads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state-box">
                        <div class="empty-state-icon">🛣️</div>
                        <p class="empty-state-title">Road network empty</p>
                        <p class="empty-state-desc">Add roads between regions to enable routing analysis.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const isPublic = state.currentUser?.role === 'PUBLIC';

        tbody.innerHTML = roads.map(r => `
            <tr>
                <td><strong>${escapeHtml(r.source)}</strong></td>
                <td><strong>${escapeHtml(r.destination)}</strong></td>
                <td>⏱️ ${r.travelTime} mins</td>
                <td>
                    ${r.open 
                        ? '<span class="badge badge-open">✓ OPEN</span>' 
                        : '<span class="badge badge-closed">✕ CLOSED</span>'}
                </td>
                <td>
                    ${!isPublic ? `
                        <button type="button" class="btn btn-secondary btn-sm toggle-road-btn" 
                                data-source="${escapeHtml(r.source)}" 
                                data-destination="${escapeHtml(r.destination)}" 
                                data-open="${r.open}">
                            ${r.open ? 'Close Road' : 'Reopen Road'}
                        </button>
                    ` : '<span class="text-muted">Monitor</span>'}
                </td>
            </tr>
        `).join('');

        if (!isPublic) {
            document.querySelectorAll('.toggle-road-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const source = e.currentTarget.getAttribute('data-source');
                    const destination = e.currentTarget.getAttribute('data-destination');
                    const isOpen = e.currentTarget.getAttribute('data-open') === 'true';

                    const newStatus = !isOpen;
                    showConfirmation(
                        `${newStatus ? 'Reopen' : 'Close'} Road Connection`,
                        `Are you sure you want to mark the road between "${source}" and "${destination}" as ${newStatus ? 'OPEN' : 'CLOSED'}? Routing calculations will ${newStatus ? 'include' : 'exclude'} this road segment.`,
                        newStatus ? 'Reopen Road' : 'Close Road',
                        async () => {
                            try {
                                await ResqApi.updateRoadStatus(source, destination, newStatus);
                                showToast(`Road [${source} ↔ ${destination}] updated to ${newStatus ? 'OPEN' : 'CLOSED'}.`);
                                await loadRoadsData();
                                if (selectedRoutingDestination) {
                                    executeRoutingCalculation(selectedRoutingOrigin, selectedRoutingDestination);
                                }
                            } catch (err) {
                                showToast(err.message, 'error');
                            }
                        }
                    );
                });
            });
        }
    }

    // ==========================================================================
    // 7. OPERATIONS EVENT HANDLERS & ACTIONS
    // ==========================================================================

        // 1. Add Affected Region (Automatic Region ID Generation)
    if (elements.regionForm) {
        elements.regionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idInput = document.getElementById('regionIdInput');
            const rawId = idInput ? idInput.value.trim() : '';
            const id = (rawId && !isNaN(parseInt(rawId, 10)) && parseInt(rawId, 10) > 0)
                ? parseInt(rawId, 10)
                : 0;
            const name = document.getElementById('regionNameInput').value.trim();
            const pop = parseInt(document.getElementById('regionPopInput').value, 10);
            const sev = parseInt(document.getElementById('regionSevInput').value, 10);
            const acc = document.getElementById('regionAccInput').value === 'true';

            if (!name) {
                showToast('Region Name is required.', 'error');
                return;
            }

            if (isNaN(pop) || pop < 0) {
                showToast('Please enter a valid population number.', 'error');
                return;
            }

            if (isNaN(sev) || sev < 1 || sev > 5) {
                showToast('Severity must be between 1 and 5.', 'error');
                return;
            }

            try {
                const saved = await ResqApi.addRegion({
                    regionId: id,
                    regionName: name,
                    population: pop,
                    severity: sev,
                    accessible: acc
                });
                const assignedId = saved?.regionId || (id > 0 ? id : '');
                showToast(`Region "${name}" ${assignedId ? '(#' + assignedId + ') ' : ''}registered successfully.`);
                elements.regionForm.reset();
                await loadRegionsData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // Toggle priority order for regions
    const togglePriorityBtn = document.getElementById('togglePrioritySortBtn');
    if (togglePriorityBtn) {
        togglePriorityBtn.addEventListener('click', () => {
            state.isRegionPriorityMode = !state.isRegionPriorityMode;
            togglePriorityBtn.textContent = state.isRegionPriorityMode 
                ? 'Standard Order' 
                : 'Priority Queue Order (Severity & Pop)';
            loadRegionsData();
        });
    }

    // 2. Process Next Priority Request
    const processNextBtn = document.getElementById('processNextRequestBtn');
    if (processNextBtn) {
        processNextBtn.addEventListener('click', async () => {
            try {
                const result = await ResqApi.processNextRequest();
                showToast(result.message || 'Next priority request processed.');
                loadRequestsData();
                loadInventoryData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 3. Create Supply Request
    if (elements.supplyRequestForm) {
        elements.supplyRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const regionId = parseInt(document.getElementById('supplyRegionSelect').value, 10);
            const food = parseInt(document.getElementById('supplyFoodInput').value, 10);
            const med = parseInt(document.getElementById('supplyMedInput').value, 10);

            if (isNaN(regionId) || isNaN(food) || isNaN(med)) {
                showToast('Please fill all request fields with positive values.', 'error');
                return;
            }

            try {
                await ResqApi.createSupplyRequest({
                    regionId,
                    foodRequired: food,
                    medicineRequired: med
                });
                showToast('Supply request added to priority queue.');
                elements.supplyRequestForm.reset();
                loadRequestsData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 4. Create Rescue Request
    if (elements.rescueRequestForm) {
        elements.rescueRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const regionId = parseInt(document.getElementById('rescueRegionSelect').value, 10);
            const people = parseInt(document.getElementById('rescuePeopleInput').value, 10);
            const teams = parseInt(document.getElementById('rescueTeamsInput').value, 10);

            if (isNaN(regionId) || isNaN(people) || isNaN(teams)) {
                showToast('Please enter valid rescue parameters.', 'error');
                return;
            }

            try {
                await ResqApi.createRescueRequest({
                    regionId,
                    peopleToRescue: people,
                    teamsRequired: teams
                });
                showToast('Rescue request added to emergency queue.');
                elements.rescueRequestForm.reset();
                loadRequestsData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // Complete Mission
    if (elements.completeMissionForm) {
        elements.completeMissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reqIdInput = document.getElementById('completeMissionReqId');
            const reqId = parseInt(reqIdInput ? reqIdInput.value : '', 10);
            if (isNaN(reqId) || reqId <= 0) {
                showToast('Please enter a valid positive Rescue Request ID.', 'error');
                return;
            }

            try {
                const res = await ResqApi.completeMission(reqId);
                showToast(res?.message || `Rescue mission #${reqId} completed. Assigned teams are now available.`);
                elements.completeMissionForm.reset();
                await Promise.all([
                    loadTeamsData(),
                    loadRequestsData()
                ]);
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 5. Update Inventory
    if (elements.stockForm) {
        elements.stockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const food = parseInt(document.getElementById('addFoodStockInput').value, 10) || 0;
            const med = parseInt(document.getElementById('addMedStockInput').value, 10) || 0;

            if (food < 0 || med < 0 || (food === 0 && med === 0)) {
                showToast('Please enter positive quantities to add.', 'error');
                return;
            }

            try {
                await ResqApi.updateInventory(food, med);
                showToast('Inventory replenished successfully.');
                elements.stockForm.reset();
                loadInventoryData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 6. Add Rescue Team
    if (elements.teamForm) {
        elements.teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = parseInt(document.getElementById('teamIdInput').value, 10);
            const name = document.getElementById('teamNameInput').value.trim();
            const location = document.getElementById('teamLocationInput').value.trim();

            if (isNaN(id) || !name || !location) {
                showToast('Please provide valid team details.', 'error');
                return;
            }

            try {
                await ResqApi.addRescueTeam({
                    teamId: id,
                    teamName: name,
                    currentLocation: location
                });
                showToast(`Rescue team "${name}" registered.`);
                elements.teamForm.reset();
                loadTeamsData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 7. Add Shelter
    if (elements.shelterForm) {
        elements.shelterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = parseInt(document.getElementById('shelterIdInput').value, 10);
            const name = document.getElementById('shelterNameInput').value.trim();
            const loc = document.getElementById('shelterLocationInput').value.trim();
            const cap = parseInt(document.getElementById('shelterCapacityInput').value, 10);

            if (isNaN(id) || !name || !loc || isNaN(cap) || cap <= 0) {
                showToast('Please provide valid shelter capacity and details.', 'error');
                return;
            }

            try {
                await ResqApi.addShelter({
                    shelterId: id,
                    shelterName: name,
                    location: loc,
                    capacity: cap
                });
                showToast(`Shelter "${name}" added.`);
                elements.shelterForm.reset();
                loadSheltersData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // Allocate Shelter
    if (elements.shelterAllocForm) {
        elements.shelterAllocForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const people = parseInt(document.getElementById('shelterPeopleCountInput').value, 10);

            if (isNaN(people) || people <= 0) {
                showToast('Please specify a positive number of people to allocate.', 'error');
                return;
            }

            // Client check: prevent capacity overflow
            const totalAvailable = (state.shelters || []).reduce((acc, s) => acc + Math.max(0, (s.capacity || 0) - (s.occupied || 0)), 0);
            if (people > totalAvailable) {
                showToast(`Cannot allocate ${people} evacuees. Total available shelter capacity is only ${totalAvailable}.`, 'error');
                return;
            }

            try {
                const res = await ResqApi.allocateShelter(people);
                showToast(`Accommodated ${people} evacuees at shelter "${res.shelterName}" (${res.location}).`);
                elements.shelterAllocForm.reset();
                await loadSheltersData();
                await loadDashboardData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 8. Add Road
    if (elements.roadForm) {
        elements.roadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const source = document.getElementById('roadSourceInput').value.trim();
            const destination = document.getElementById('roadDestInput').value.trim();
            const time = parseInt(document.getElementById('roadTimeInput').value, 10);

            if (!source || !destination || isNaN(time) || time <= 0) {
                showToast('Please enter distinct regions and positive travel time.', 'error');
                return;
            }

            if (source.toLowerCase() === destination.toLowerCase()) {
                showToast('Source and destination regions must be different.', 'error');
                return;
            }

            try {
                await ResqApi.addRoad({
                    source,
                    destination,
                    travelTime: time
                });
                showToast(`Road connection added between ${source} and ${destination}.`);
                elements.roadForm.reset();
                loadRoadsData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 9. Dijkstra Shortest Route Calculation
    if (elements.routeForm) {
        elements.routeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const source = document.getElementById('routeSourceSelect').value.trim();
            const destination = document.getElementById('routeDestSelect').value.trim();
            const resultBox = document.getElementById('routeResultDisplay');

            if (!source || !destination) {
                showToast('Please select both origin and destination regions.', 'error');
                return;
            }

            if (resultBox) {
                resultBox.style.display = 'block';
                resultBox.innerHTML = `<span class="spinner"></span> Running Dijkstra algorithm...`;
            }

            try {
                const result = await ResqApi.getShortestRoute(source, destination);
                renderDijkstraResult(result);
            } catch (err) {
                if (resultBox) {
                    resultBox.innerHTML = `
                        <div class="alert-banner offline">
                            <span class="alert-banner-icon">⚠️</span>
                            <div class="alert-banner-text">
                                <strong>Routing Error:</strong> ${escapeHtml(err.message)}
                            </div>
                        </div>
                    `;
                }
            }
        });
    }

    function renderDijkstraResult(result) {
        const resultBox = document.getElementById('routeResultDisplay');
        if (!resultBox) return;

        if (!result || !result.waypoints || result.waypoints.length === 0) {
            resultBox.innerHTML = `
                <div class="alert-banner offline">
                    <span class="alert-banner-icon">⚠️</span>
                    <div class="alert-banner-text">
                        No valid route exists between the selected regions (closed roads or disconnected).
                    </div>
                </div>
            `;
            return;
        }

        const stepsHtml = result.waypoints.map((wp, idx) => `
            <span class="route-node">${escapeHtml(wp)}</span>
            ${idx < result.waypoints.length - 1 ? '<span class="route-arrow">➔</span>' : ''}
        `).join('');

        resultBox.innerHTML = `
            <div class="route-result-box">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--text-primary); font-size:15px;">Dijkstra Optimal Route Computed</strong>
                    <span class="badge badge-available">Total Travel Time: ${result.totalTravelTime} mins</span>
                </div>
                <div class="route-steps-list">
                    ${stepsHtml}
                </div>
                <p style="margin: 12px 0 0; font-size: 11px; color: var(--text-muted);">
                    Calculated using travel-time edge weights. Closed road segments were strictly excluded.
                </p>
            </div>
        `;
    }

    // 10. BFS / DFS Traversal
    if (elements.traversalForm) {
        elements.traversalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const start = document.getElementById('traversalStartSelect').value.trim();
            const algorithm = document.getElementById('traversalAlgorithmSelect').value;
            const outputBox = document.getElementById('traversalResultDisplay');

            if (!start) {
                showToast('Please select a starting region.', 'error');
                return;
            }

            if (outputBox) {
                outputBox.style.display = 'block';
                outputBox.innerHTML = `<span class="spinner"></span> Running ${algorithm.toUpperCase()} traversal...`;
            }

            try {
                const res = algorithm === 'bfs' 
                    ? await ResqApi.getBfsTraversal(start)
                    : await ResqApi.getDfsTraversal(start);

                const list = res.traversal || res.visitedOrder || res.visited || res.traversalOrder || [];
                if (outputBox) {
                    outputBox.innerHTML = `
                        <div class="route-result-box">
                            <strong>${algorithm.toUpperCase()} Traversal Order from "${escapeHtml(start)}":</strong>
                            <div class="route-steps-list" style="margin-top:10px;">
                                ${list.map((r, i) => `<span class="route-node">${i + 1}. ${escapeHtml(r)}</span>`).join('')}
                            </div>
                        </div>
                    `;
                }
            } catch (err) {
                if (outputBox) {
                    outputBox.innerHTML = `<div class="alert-banner offline">${escapeHtml(err.message)}</div>`;
                }
            }
        });
    }

    // Dropdown helpers
    function populateRegionDropdowns(errorMessage = null) {
        const supplySelect = document.getElementById('supplyRegionSelect');
        const rescueSelect = document.getElementById('rescueRegionSelect');
        const routeSource = document.getElementById('routeSourceSelect');
        const routeDest = document.getElementById('routeDestSelect');
        const traversalStart = document.getElementById('traversalStartSelect');

        if (errorMessage) {
            const errHtml = `<option value="">⚠️ Error: ${escapeHtml(errorMessage)}</option>`;
            if (supplySelect) supplySelect.innerHTML = errHtml;
            if (rescueSelect) rescueSelect.innerHTML = errHtml;
            return;
        }

        if (!state.regions || state.regions.length === 0) {
            const emptyHtml = `<option value="">⚠️ No affected regions found in database</option>`;
            if (supplySelect) supplySelect.innerHTML = emptyHtml;
            if (rescueSelect) rescueSelect.innerHTML = emptyHtml;
            return;
        }

        const prevSupply = supplySelect ? supplySelect.value : '';
        const prevRescue = rescueSelect ? rescueSelect.value : '';

        const optionsHtml = state.regions.map(r => 
            `<option value="${r.regionId}">${escapeHtml(r.regionName)} (Severity: ${r.severity}, Pop: ${r.population ? r.population.toLocaleString() : 'N/A'})</option>`
        ).join('');

        const nameOptionsHtml = state.regions.map(r => 
            `<option value="${escapeHtml(r.regionName)}">${escapeHtml(r.regionName)}</option>`
        ).join('');

        if (supplySelect) {
            supplySelect.innerHTML = `<option value="">Select region...</option>` + optionsHtml;
            if (prevSupply && state.regions.some(r => r.regionId == prevSupply)) {
                supplySelect.value = prevSupply;
            }
        }
        if (rescueSelect) {
            rescueSelect.innerHTML = `<option value="">Select region...</option>` + optionsHtml;
            if (prevRescue && state.regions.some(r => r.regionId == prevRescue)) {
                rescueSelect.value = prevRescue;
            }
        }
        if (routeSource) routeSource.innerHTML = `<option value="">Select origin...</option>` + nameOptionsHtml;
        if (routeDest) routeDest.innerHTML = `<option value="">Select destination...</option>` + nameOptionsHtml;
        if (traversalStart) traversalStart.innerHTML = `<option value="">Select starting region...</option>` + nameOptionsHtml;
    }

    function populateRoadRegionDropdowns() {
        populateRegionDropdowns();
    }

    // Badge renderers
    function renderRegionAccessibilityBadge(r) {
        if (!r) return '<span class="badge badge-low">Unknown</span>';
        if (r.hasRoadMapping === false) {
            return '<span class="badge badge-low" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);" title="Region has no connected road edges in the graph network">⚠️ Unmapped</span>';
        }
        if (r.networkReachable === false) {
            return '<span class="badge badge-critical" title="Transit Cut Off: All routes from depot are blocked by closed roads">✕ Cut Off</span>';
        }
        if (r.accessible === false) {
            return '<span class="badge badge-waiting" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3);" title="Route is open and navigable, but internal zone has a local safety hazard">⚠️ Zone Hazard</span>';
        }
        return '<span class="badge badge-available" title="Road network open and region zone accessible">✓ Open Access</span>';
    }

    function renderSeverityBadge(sev) {
        switch (sev) {
            case 5: return '<span class="badge badge-critical">● Critical (5)</span>';
            case 4: return '<span class="badge badge-high">● High (4)</span>';
            case 3: return '<span class="badge badge-medium">● Medium (3)</span>';
            case 2: return '<span class="badge badge-low">● Low (2)</span>';
            default: return '<span class="badge badge-low">● Minimal (1)</span>';
        }
    }

    function renderRequestStatusBadge(status) {
        switch (status) {
            case 'COMPLETED': return '<span class="badge badge-completed">✓ Completed</span>';
            case 'IN_PROGRESS': return '<span class="badge badge-in-progress">⚡ In Progress</span>';
            case 'PARTIALLY_FULFILLED': return '<span class="badge badge-waiting">⏳ Partially Fulfilled</span>';
            default: return '<span class="badge badge-waiting">⏳ Waiting</span>';
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    
        // ==========================================================================
    // PUBLIC EMERGENCY INCIDENT REPORT FORM & ASSISTANCE QUANTITIES
    // ==========================================================================
    const assistanceConfigs = [
        {
            key: 'FOOD',
            name: 'Food Relief Kits',
            unit: 'kits',
            check: elements.assistFoodCheck,
            item: elements.assistanceItemFood,
            container: elements.qtyContainerFood,
            input: elements.qtyFoodInput,
            error: elements.errorQtyFood
        },
        {
            key: 'MEDICAL',
            name: 'Medical Relief Kits',
            unit: 'kits',
            check: elements.assistMedCheck,
            item: elements.assistanceItemMed,
            container: elements.qtyContainerMed,
            input: elements.qtyMedInput,
            error: elements.errorQtyMed
        },
        {
            key: 'TEAMS',
            name: 'Rescue Teams',
            unit: 'teams',
            check: elements.assistTeamsCheck,
            item: elements.assistanceItemTeams,
            container: elements.qtyContainerTeams,
            input: elements.qtyTeamsInput,
            error: elements.errorQtyTeams
        },
        {
            key: 'SHELTERS',
            name: 'Shelters',
            unit: 'people',
            check: elements.assistSheltersCheck,
            item: elements.assistanceItemShelters,
            container: elements.qtyContainerShelters,
            input: elements.qtySheltersInput,
            error: elements.errorQtyShelters
        }
    ];

    function resetAssistanceQuantities() {
        assistanceConfigs.forEach(cfg => {
            if (cfg.check) cfg.check.checked = false;
            if (cfg.container) cfg.container.style.display = 'none';
            if (cfg.item) cfg.item.classList.remove('is-selected');
            if (cfg.input) {
                cfg.input.value = '';
                cfg.input.classList.remove('input-invalid');
            }
            if (cfg.error) cfg.error.style.display = 'none';
        });
    }

    // Bind change listeners to toggle quantity inputs
    assistanceConfigs.forEach(cfg => {
        if (cfg.check) {
            cfg.check.addEventListener('change', () => {
                if (cfg.check.checked) {
                    if (cfg.container) cfg.container.style.display = 'block';
                    if (cfg.item) cfg.item.classList.add('is-selected');
                    if (cfg.input) {
                        cfg.input.focus();
                    }
                } else {
                    if (cfg.container) cfg.container.style.display = 'none';
                    if (cfg.item) cfg.item.classList.remove('is-selected');
                    if (cfg.input) {
                        cfg.input.value = '';
                        cfg.input.classList.remove('input-invalid');
                    }
                    if (cfg.error) cfg.error.style.display = 'none';
                }
            });
        }

        if (cfg.input) {
            cfg.input.addEventListener('input', () => {
                const val = cfg.input.value.trim();
                const num = Number(val);
                if (val !== '' && !isNaN(num) && Number.isInteger(num) && num > 0) {
                    cfg.input.classList.remove('input-invalid');
                    if (cfg.error) cfg.error.style.display = 'none';
                }
            });
        }
    });

    if (elements.publicReportForm) {
        elements.publicReportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (elements.publicReportErrorBox) elements.publicReportErrorBox.style.display = 'none';
            if (elements.publicReportSuccessBox) elements.publicReportSuccessBox.style.display = 'none';
            if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'none';

            const regionName = elements.publicRegionName ? elements.publicRegionName.value.trim() : '';
            if (!regionName) {
                if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'block';
                if (elements.publicRegionName) elements.publicRegionName.focus();
                return;
            }

            const disasterType = elements.publicDisasterType ? elements.publicDisasterType.value : 'Flood';
            const severity = elements.publicSeverity ? parseInt(elements.publicSeverity.value, 10) : 3;
            const population = (elements.publicPopulation && elements.publicPopulation.value.trim() !== '') 
                ? parseInt(elements.publicPopulation.value.trim(), 10) : 0;
            const accessible = elements.publicAccessibility ? (elements.publicAccessibility.value === 'true') : true;
            const description = elements.publicDescription ? elements.publicDescription.value.trim() : '';

            // Validate quantities for each selected resource
            let hasValidationError = false;
            let firstInvalidInput = null;

            assistanceConfigs.forEach(cfg => {
                if (cfg.check && cfg.check.checked) {
                    const val = cfg.input ? cfg.input.value.trim() : '';
                    const num = Number(val);
                    if (!val || isNaN(num) || !Number.isInteger(num) || num <= 0) {
                        hasValidationError = true;
                        if (cfg.input) cfg.input.classList.add('input-invalid');
                        if (cfg.error) {
                            cfg.error.textContent = `Please enter a positive whole number (min 1) for ${cfg.name}.`;
                            cfg.error.style.display = 'block';
                        }
                        if (!firstInvalidInput && cfg.input) {
                            firstInvalidInput = cfg.input;
                        }
                    } else {
                        if (cfg.input) cfg.input.classList.remove('input-invalid');
                        if (cfg.error) cfg.error.style.display = 'none';
                    }
                } else {
                    if (cfg.error) cfg.error.style.display = 'none';
                    if (cfg.input) cfg.input.classList.remove('input-invalid');
                }
            });

            if (hasValidationError) {
                if (firstInvalidInput) {
                    firstInvalidInput.focus();
                }
                return;
            }

            // Collect selected assistance keys
            const assistance = [];
            assistanceConfigs.forEach(cfg => {
                if (cfg.check && cfg.check.checked) {
                    assistance.push(cfg.key);
                }
            });

            // Collect exact quantities
            const foodQuantity = (elements.assistFoodCheck && elements.assistFoodCheck.checked && elements.qtyFoodInput)
                ? parseInt(elements.qtyFoodInput.value.trim(), 10) : 0;
            const medicineQuantity = (elements.assistMedCheck && elements.assistMedCheck.checked && elements.qtyMedInput)
                ? parseInt(elements.qtyMedInput.value.trim(), 10) : 0;
            const rescueTeamsQuantity = (elements.assistTeamsCheck && elements.assistTeamsCheck.checked && elements.qtyTeamsInput)
                ? parseInt(elements.qtyTeamsInput.value.trim(), 10) : 0;
            const shelterPeopleQuantity = (elements.assistSheltersCheck && elements.assistSheltersCheck.checked && elements.qtySheltersInput)
                ? parseInt(elements.qtySheltersInput.value.trim(), 10) : 0;

            // Loading state
            if (elements.publicSubmitBtnText) {
                elements.publicSubmitBtnText.innerHTML = '<span class="spinner" style="margin-right: 8px;"></span> Submitting Report...';
            }
            if (elements.publicSubmitBtn) elements.publicSubmitBtn.disabled = true;

            try {
                const response = await ResqApi.submitPublicReport({
                    regionName,
                    disasterType,
                    severity,
                    population,
                    accessible,
                    description,
                    requiredAssistance: assistance,
                    foodQuantity,
                    medicineQuantity,
                    rescueTeamsQuantity,
                    shelterPeopleQuantity
                });

                // Show success only after backend confirms successful saving
                if (elements.publicReportSuccessBox) {
                    const assistanceDetailsList = [];
                    if (foodQuantity > 0) assistanceDetailsList.push(`Food Relief Kits (${foodQuantity.toLocaleString()} kits)`);
                    if (medicineQuantity > 0) assistanceDetailsList.push(`Medical Relief Kits (${medicineQuantity.toLocaleString()} kits)`);
                    if (rescueTeamsQuantity > 0) assistanceDetailsList.push(`Rescue Teams (${rescueTeamsQuantity.toLocaleString()} teams)`);
                    if (shelterPeopleQuantity > 0) assistanceDetailsList.push(`Shelters (${shelterPeopleQuantity.toLocaleString()} people)`);

                    const selectedLabels = assistanceDetailsList.length > 0
                        ? assistanceDetailsList.join(', ')
                        : (assistance.length > 0 ? assistance.join(', ') : 'General Monitoring (No immediate supplies)');

                    const details = '<strong>Assigned Region #' + response.regionId + ':</strong> ' + escapeHtml(response.regionName) +
                        ' | <strong>Disaster:</strong> ' + escapeHtml(response.disasterType || disasterType) +
                        ' | <strong>Severity Level:</strong> ' + response.severity + '/5' +
                        ' | <strong>Road Access:</strong> ' + (response.accessible ? 'Open' : 'Blocked') +
                        ' | <strong>Required Assistance:</strong> ' + escapeHtml(selectedLabels) +
                        '. Field Coordinators & Incident Command have received this alert.';
                    
                    if (elements.publicSuccessDetails) {
                        elements.publicSuccessDetails.innerHTML = details;
                    }
                    elements.publicReportSuccessBox.style.display = 'flex';
                }

                // Reset form
                elements.publicReportForm.reset();
                resetAssistanceQuantities();
                if (elements.publicDisasterType) elements.publicDisasterType.value = 'Flood';
                if (elements.publicSeverity) elements.publicSeverity.value = '4';
                if (elements.publicAccessibility) elements.publicAccessibility.value = 'true';

                showToast('Emergency incident report #' + response.regionId + ' submitted successfully.');
            } catch (err) {
                console.error('Failed to submit public report:', err);
                if (elements.publicReportErrorBox) {
                    if (elements.publicReportErrorMessage) {
                        elements.publicReportErrorMessage.textContent = err.message === 'BACKEND_OFFLINE'
                            ? 'Unable to submit report: Backend service is currently offline. Please ensure the server is running on port 8080.'
                            : (err.message || 'Failed to submit report. Please check input parameters and try again.');
                    }
                    elements.publicReportErrorBox.style.display = 'flex';
                }
            } finally {
                if (elements.publicSubmitBtnText) {
                    elements.publicSubmitBtnText.textContent = 'Submit Emergency Report';
                }
                if (elements.publicSubmitBtn) elements.publicSubmitBtn.disabled = false;
            }
        });
    }

    if (elements.publicReportNewBtn) {
        elements.publicReportNewBtn.addEventListener('click', () => {
            if (elements.publicReportSuccessBox) elements.publicReportSuccessBox.style.display = 'none';
            resetAssistanceQuantities();
            if (elements.publicRegionName) elements.publicRegionName.focus();
        });
    }

    if (elements.publicRegionName) {
        elements.publicRegionName.addEventListener('input', () => {
            if (elements.errorPublicRegionName) elements.errorPublicRegionName.style.display = 'none';
        });
    }

    
    // ==========================================================================
    // 8. RESPONSE MONITORING CONSOLE & SITUATIONAL LOGIC
    // ==========================================================================
    async function loadMonitoringData() {
        try {
            const [regions, requests, teams, shelters, inventory] = await Promise.all([
                ResqApi.getRegions().catch(() => []),
                ResqApi.getRequests().catch(() => []),
                ResqApi.getRescueTeams().catch(() => []),
                ResqApi.getShelters().catch(() => []),
                ResqApi.getInventory().catch(() => ({ foodKits: 0, medicineKits: 0 }))
            ]);

            state.regions = regions || [];
            state.requests = requests || [];
            state.teams = teams || [];
            state.shelters = shelters || [];
            state.inventory = inventory || { foodKits: 0, medicineKits: 0 };

            // 1. Update Telemetry Metric Cards
            if (elements.monStatRegions) {
                elements.monStatRegions.textContent = state.regions.length;
            }

            const pendingReqs = state.requests.filter(r => r.status === 'WAITING' || r.status === 'PENDING');
            if (elements.monStatPending) {
                elements.monStatPending.textContent = pendingReqs.length;
            }

            const totalTeams = state.teams.length;
            const busyTeams = state.teams.filter(t => !t.available).length;
            const teamRate = totalTeams > 0 ? Math.round((busyTeams / totalTeams) * 100) : 0;
            if (elements.monStatTeams) elements.monStatTeams.textContent = `${teamRate}%`;
            if (elements.monStatTeamsSub) elements.monStatTeamsSub.textContent = `${busyTeams} of ${totalTeams} units deployed`;

            let totalCap = 0, totalOcc = 0;
            state.shelters.forEach(s => {
                totalCap += (s.capacity || 0);
                totalOcc += (s.occupied || 0);
            });
            const shelterRate = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;
            if (elements.monStatShelter) elements.monStatShelter.textContent = `${shelterRate}%`;
            if (elements.monStatShelterSub) elements.monStatShelterSub.textContent = `${totalOcc.toLocaleString()} of ${totalCap.toLocaleString()} occupied`;

            if (elements.monLastUpdated) {
                elements.monLastUpdated.textContent = 'Synced: ' + new Date().toLocaleTimeString();
            }

            // 2. Render all 4 tab tables
            renderMonitoringPending(state.requests);
            renderMonitoringAllocations(state.requests);
            renderMonitoringTeams(state.teams);
            renderMonitoringShelters(state.shelters);
        } catch (err) {
            console.error('Failed to load monitoring data:', err);
        }
    }

    function renderMonitoringPending(requests) {
        const tbody = elements.monPendingTableBody;
        if (!tbody) return;

        const pending = (requests || []).filter(r => r.status === 'WAITING' || r.status === 'PENDING');
        if (pending.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-box">No pending demands in queue. All requests are currently fulfilled or in progress.</td></tr>';
            return;
        }

        tbody.innerHTML = pending.map(req => {
            const regName = req.region?.regionName || req.regionName || '#' + (req.region?.regionId || req.regionId);
            const regId = req.region?.regionId || req.regionId;
            const isSupply = req.requestType === 'SUPPLY';

            const reqQty = isSupply 
                ? `🍲 ${req.foodRequired || 0} food | 💊 ${req.medicineRequired || 0} med`
                : `🚑 ${req.teamsRequired || 1} team | 👥 ${req.peopleToRescue || 0} people`;

            const actionBtn = isSupply 
                ? `<button type="button" class="btn btn-primary btn-sm" onclick="window.resqQuickAllocate(${regId})">Allocate Stock</button>`
                : `<button type="button" class="btn btn-danger btn-sm" onclick="navigateTo('teams')">Deploy Team</button>`;

            return `
                <tr>
                    <td><strong>#${req.requestId}</strong></td>
                    <td><strong>${escapeHtml(regName)}</strong></td>
                    <td><span class="badge ${isSupply ? 'badge-low' : 'badge-critical'}">${req.requestType}</span></td>
                    <td>${renderSeverityBadge(req.severity || req.region?.severity || 3)}</td>
                    <td>${reqQty}</td>
                    <td><span class="badge badge-waiting">● WAITING</span></td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        }).join('');
    }

    function renderMonitoringAllocations(requests) {
        const tbody = elements.monAllocationsTableBody;
        if (!tbody) return;

        const supplyReqs = (requests || []).filter(r => r.requestType === 'SUPPLY');
        if (supplyReqs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-box">No supply allocation records found.</td></tr>';
            return;
        }

        tbody.innerHTML = supplyReqs.map(req => {
            const regName = req.region?.regionName || req.regionName || '#' + (req.region?.regionId || req.regionId);
            const foodReq = req.foodRequired || 0;
            const foodAlloc = req.foodAllocated || 0;
            const foodRem = req.foodOutstanding ?? Math.max(0, foodReq - foodAlloc);

            const medReq = req.medicineRequired || 0;
            const medAlloc = req.medicineAllocated || 0;
            const medRem = req.medicineOutstanding ?? Math.max(0, medReq - medAlloc);

            let statusBadge = '<span class="badge badge-waiting">● WAITING</span>';
            if (req.status === 'COMPLETED') statusBadge = '<span class="badge badge-completed">✓ COMPLETED</span>';
            else if (req.status === 'IN_PROGRESS' || req.status === 'PARTIALLY_FULFILLED') statusBadge = '<span class="badge badge-in-progress">⚡ IN PROGRESS</span>';

            return `
                <tr>
                    <td><strong>#${req.requestId}</strong></td>
                    <td><strong>${escapeHtml(regName)}</strong></td>
                    <td>🍲 ${foodReq} req / <strong>${foodAlloc} alloc</strong></td>
                    <td>${foodRem > 0 ? `<span style="color:#F87171; font-weight:600;">${foodRem} needed</span>` : '<span style="color:#34D399;">Fulfilled</span>'}</td>
                    <td>💊 ${medReq} req / <strong>${medAlloc} alloc</strong></td>
                    <td>${medRem > 0 ? `<span style="color:#F87171; font-weight:600;">${medRem} needed</span>` : '<span style="color:#34D399;">Fulfilled</span>'}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    function renderMonitoringTeams(teams) {
        const tbody = elements.monTeamsTableBody;
        if (!tbody) return;

        if (!teams || teams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state-box">No rescue teams registered.</td></tr>';
            return;
        }

        tbody.innerHTML = teams.map(t => {
            const isAvail = t.available;
            let mission = '<span class="text-muted">Standby at base</span>';
            if (!isAvail) {
                const activeReq = (state.requests || []).find(r => 
                    r.requestType === 'RESCUE' && 
                    r.status !== 'COMPLETED' && 
                    (r.assignedTeamId === t.teamId || (r.assignedTeam && r.assignedTeam.teamId === t.teamId))
                );
                if (activeReq) {
                    mission = `<strong>Rescue Mission #${activeReq.requestId}</strong> (${escapeHtml(activeReq.region?.regionName || activeReq.regionName || t.currentLocation)})`;
                } else {
                    mission = `<strong>Deployed</strong> (${escapeHtml(t.currentLocation)})`;
                }
            }

            return `
                <tr>
                    <td><strong>#${t.teamId}</strong></td>
                    <td><strong>${escapeHtml(t.teamName)}</strong></td>
                    <td>📍 ${escapeHtml(t.currentLocation)}</td>
                    <td>${isAvail ? '<span class="badge badge-available">● Available</span>' : '<span class="badge badge-busy">● Busy (Deployed)</span>'}</td>
                    <td>${mission}</td>
                    <td>
                        ${!isAvail 
                            ? `<button type="button" class="btn btn-danger btn-sm mon-release-btn" data-team-id="${t.teamId}">Release</button>` 
                            : '<span class="badge badge-low">Ready</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.mon-release-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const teamId = e.currentTarget.getAttribute('data-team-id');
                try {
                    await ResqApi.releaseRescueTeam(teamId);
                    showToast(`Team #${teamId} returned to standby.`);
                    await loadMonitoringData();
                    await loadTeamsData();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        });
    }

    function renderMonitoringShelters(shelters) {
        const tbody = elements.monSheltersTableBody;
        if (!tbody) return;

        if (!shelters || shelters.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state-box">No shelters registered.</td></tr>';
            return;
        }

        tbody.innerHTML = shelters.map(s => {
            const cap = s.capacity || 0;
            const occ = s.occupied || 0;
            const vac = Math.max(0, cap - occ);
            const pct = cap > 0 ? Math.min(100, Math.round((occ / cap) * 100)) : 0;

            let statusBadge = '<span class="badge badge-available">Available (&lt;80%)</span>';
            let barColor = '#10B981';
            if (pct >= 100) {
                statusBadge = '<span class="badge badge-busy">Full (100%)</span>';
                barColor = '#EF4444';
            } else if (pct >= 80) {
                statusBadge = '<span class="badge badge-waiting">Nearly Full (&ge;80%)</span>';
                barColor = '#F59E0B';
            }

            return `
                <tr>
                    <td><strong>#${s.shelterId}</strong></td>
                    <td><strong>${escapeHtml(s.shelterName)}</strong></td>
                    <td>📍 ${escapeHtml(s.location)}</td>
                    <td>${cap.toLocaleString()}</td>
                    <td>${occ.toLocaleString()}</td>
                    <td><strong>${vac.toLocaleString()}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="flex: 1; height: 8px; background: #2F3342; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>
                            </div>
                            <span style="font-size: 11px; min-width: 32px;">${pct}%</span>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    // Monitoring Tab Switcher Setup
    function setupMonitoringTabs() {
        const tabs = [
            { btn: elements.tabMonPending, content: elements.monTabContentPending },
            { btn: elements.tabMonAllocations, content: elements.monTabContentAllocations },
            { btn: elements.tabMonTeams, content: elements.monTabContentTeams },
            { btn: elements.tabMonShelters, content: elements.monTabContentShelters }
        ];

        tabs.forEach(({ btn, content }) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                tabs.forEach(t => {
                    if (t.btn) t.btn.classList.remove('active');
                    if (t.content) t.content.style.display = 'none';
                });
                btn.classList.add('active');
                if (content) content.style.display = 'block';
            });
        });

        if (elements.btnRefreshMonitoring) {
            elements.btnRefreshMonitoring.addEventListener('click', () => {
                loadMonitoringData();
                showToast('Monitoring data refreshed.');
            });
        }
    }
    setupMonitoringTabs();

    // Boot Session on startup
    initSession();

    // Periodic background status check for active dashboard session
    let lastKnownConnected = null;
    setInterval(async () => {
        if (state.currentUser) {
            const isConnected = await checkBackendConnection();
            if (lastKnownConnected === false && isConnected === true) {
                // Connection just recovered: automatically reload view data
                showToast('Backend connection restored. Synchronizing live data...');
                await refreshCurrentViewData();
            }
            lastKnownConnected = isConnected;
        }
    }, 10000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResQApp);
} else {
    initResQApp();
}
