/**
 * ResQ Centralized REST API Client
 * Connects the frontend to the Spring Boot Disaster Management REST API.
 */
const ResqApi = (() => {
    // Dynamically match frontend host (localhost vs 127.0.0.1) to avoid cross-origin host mismatch
    const host = (window.location.hostname && window.location.hostname !== '')
        ? window.location.hostname
        : 'localhost';
    const API_BASE = window.location.port === '8080' 
        ? `${window.location.origin}/api` 
        : `${window.location.protocol === 'https:' ? 'https:' : 'http:'}//${host}:8080/api`;

    let isBackendConnected = false;

    /**
     * Helper for making HTTP requests with JSON serialization and robust error handling.
     */
    async function request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const token = sessionStorage.getItem('crisis_sync_token');
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            isBackendConnected = true;

            const contentType = response.headers.get('content-type');
            let data = null;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = text ? { message: text } : {};
            }

            if (!response.ok) {
                if (response.status === 401 && !endpoint.startsWith('/auth/')) {
                    sessionStorage.removeItem('crisis_sync_session');
                    sessionStorage.removeItem('crisis_sync_token');
                    window.dispatchEvent(new CustomEvent('resq:unauthorized'));
                }
                const errorMessage = data?.message || data?.error || `HTTP ${response.status}: Request failed`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            if (error.name === 'TypeError' || (error.message && error.message.toLowerCase().includes('fetch'))) {
                isBackendConnected = false;
                throw new Error('BACKEND_OFFLINE');
            }
            throw error;
        }
    }

    return {
        getBaseUrl: () => API_BASE,
        isConnected: () => isBackendConnected,

        // System Health
        async checkHealth() {
            try {
                await request('/health');
                isBackendConnected = true;
                return true;
            } catch (err) {
                // If /health isn't mapped specifically, probe /regions
                try {
                    await request('/regions');
                    isBackendConnected = true;
                    return true;
                } catch (fallbackErr) {
                    isBackendConnected = false;
                    return false;
                }
            }
        },

        // Dashboard Summary
        async getDashboardStats() {
            return request('/dashboard/stats');
        },

        // Affected Regions
        async getRegions(prioritySorted = false) {
            const endpoint = prioritySorted ? '/regions/priority' : '/regions';
            return request(endpoint);
        },

        async addRegion(regionData) {
            return request('/regions', {
                method: 'POST',
                body: JSON.stringify(regionData)
            });
        },

        async submitPublicReport(reportData) {
            return request('/regions/public-report', {
                method: 'POST',
                body: JSON.stringify(reportData)
            });
        },

        async getHighestNeedRegion() {
            return request('/regions/highest-need');
        },

        // Priority Relief Requests
        async getRequests() {
            return request('/requests');
        },

        async createSupplyRequest(requestData) {
            return request('/requests/supply', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
        },

        async createRescueRequest(requestData) {
            return request('/requests/rescue', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
        },

        async processNextRequest() {
            return request('/requests/process-next', {
                method: 'POST'
            });
        },

        // Resource Stock Inventory
        async getInventory() {
            return request('/inventory');
        },

        async updateInventory(foodQuantity, medicineQuantity) {
            return request('/inventory', {
                method: 'POST',
                body: JSON.stringify({ foodQuantity, medicineQuantity })
            });
        },

        // Rescue Teams
        async getRescueTeams() {
            return request('/rescue-teams');
        },

        async addRescueTeam(teamData) {
            return request('/rescue-teams', {
                method: 'POST',
                body: JSON.stringify(teamData)
            });
        },

        async updateTeamStatus(teamId, available) {
            return request(`/rescue-teams/${teamId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ available })
            });
        },

        async completeMission(requestId) {
            return request(`/rescue-teams/${requestId}/complete-mission`, {
                method: 'POST'
            });
        },

        // Shelters
        async getShelters() {
            return request('/shelters');
        },

        async addShelter(shelterData) {
            return request('/shelters', {
                method: 'POST',
                body: JSON.stringify(shelterData)
            });
        },

        async allocateShelter(people) {
            return request('/shelters/allocate', {
                method: 'POST',
                body: JSON.stringify({ people })
            });
        },

        // Road Network & Route Analysis
        async getRoadNetwork() {
            return request('/roads/network');
        },

        async addRoad(roadData) {
            return request('/roads', {
                method: 'POST',
                body: JSON.stringify(roadData)
            });
        },

        async updateRoadStatus(source, destination, open) {
            return request('/roads/status', {
                method: 'PUT',
                body: JSON.stringify({ source, destination, open })
            });
        },

        async getShortestRoute(source, destination) {
            const params = new URLSearchParams({ source, destination });
            return request(`/routes/shortest-time?${params.toString()}`);
        },

        async getBfsTraversal(start) {
            const params = new URLSearchParams({ start });
            return request(`/regions/traverse/bfs?${params.toString()}`);
        },

        async getDfsTraversal(start) {
            const params = new URLSearchParams({ start });
            return request(`/regions/traverse/dfs?${params.toString()}`);
        },

        async getCandidateRoutes(source, destination) {
            const params = new URLSearchParams({ source, destination });
            return request(`/routes/candidate-routes?${params.toString()}`);
        },

        async archiveRequirement(requestId, resource) {
            const params = new URLSearchParams({ resource });
            return request(`/requests/${requestId}/requirements?${params.toString()}`, {
                method: 'DELETE'
            });
        },

        // Coordinator Direct Operations: Resource Allocation & Team Assignment
        async allocateResources(regionId, foodKits, medicalKits) {
            return request('/allocation/allocate', {
                method: 'POST',
                body: JSON.stringify({ regionId, foodKits, medicalKits })
            });
        },

        async assignRescueTeam(teamId, regionId) {
            return request(`/rescue-teams/${teamId}/assign`, {
                method: 'POST',
                body: JSON.stringify({ regionId })
            });
        },

        async releaseRescueTeam(teamId) {
            return request(`/rescue-teams/${teamId}/release`, {
                method: 'POST'
            });
        },

        // Authentication Endpoints
        async signIn(email, password, accountType) {
            const payload = { email, password };
            if (accountType) {
                payload.accountType = accountType;
            }
            return request('/auth/signin', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        },

        async signUp(userData) {
            return request('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        async provisionAdmin(userData) {
            return request('/auth/admin-provision', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        async resetAdmin() {
            return request('/auth/reset-admin', {
                method: 'POST'
            });
        }
    };
})();

// Export globally under both ResqApi and CrisisSyncApi
window.ResqApi = ResqApi;
window.CrisisSyncApi = ResqApi;
