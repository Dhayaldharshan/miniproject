# ==============================================================================
# ResQ-Allocate — End-to-End Comprehensive REST API Verification Script
# Validates All 8 Modules with Bearer JWT Authorization and Business Logic
# ==============================================================================

$baseUrl = "http://localhost:8080/api"

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "   ResQ-Allocate FULL-STACK END-TO-END REST API VERIFICATION SUITE  " -ForegroundColor Cyan
Write-Host "==================================================================`n" -ForegroundColor Cyan

$passCount = 0
$failCount = 0

function Report-Result($testName, $isSuccess, $detail = "") {
    if ($isSuccess) {
        $script:passCount++
        Write-Host "  [PASS] $testName" -ForegroundColor Green
        if ($detail) { Write-Host "         $detail" -ForegroundColor Gray }
    } else {
        $script:failCount++
        Write-Host "  [FAIL] $testName" -ForegroundColor Red
        if ($detail) { Write-Host "         $detail" -ForegroundColor Magenta }
    }
}

# --- MODULE 1: HEALTH CHECK ---
Write-Host "[1/8] Verifying Health & Heartbeat Endpoints..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 5
    Report-Result "GET /api/health" ($health.status -eq "UP") "Service: $($health.service)"
} catch {
    Report-Result "GET /api/health" $false $_.Exception.Message
    Write-Host "`nCRITICAL: Backend not reachable on $baseUrl. Please start the backend with .\run-backend.bat or .\run-backend.ps1" -ForegroundColor Red
    exit 1
}

# --- MODULE 2: AUTHENTICATION & RBAC ---
Write-Host "`n[2/8] Verifying Authentication & Role-Based Access Control..." -ForegroundColor Yellow

# 2.1 Sign in with invalid credentials
try {
    $bad = @{ email = "admin@crisis-sync.gov"; password = "BadPassword123" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -Body $bad -ContentType "application/json"
    Report-Result "POST /api/auth/signin (Invalid credentials rejected)" $false "Expected 401 Unauthorized"
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Report-Result "POST /api/auth/signin (Invalid credentials rejected)" ($code -eq 401) "HTTP $code"
}

# 2.2 Sign in as Administrator
$adminToken = ""
try {
    $adminCreds = @{ email = "admin@crisis-sync.gov"; password = "Admin@123" } | ConvertTo-Json
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -Body $adminCreds -ContentType "application/json"
    $adminToken = $adminRes.token
    Report-Result "POST /api/auth/signin (Admin authenticated)" ($adminRes.role -eq "ADMIN" -and $adminToken) "Role: $($adminRes.role)"
} catch {
    Report-Result "POST /api/auth/signin (Admin authenticated)" $false $_.Exception.Message
}

$authHeaders = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# 2.3 Enforce restriction: No public ADMIN registration
try {
    $hacker = @{ fullName = "Intruder"; email = "intruder@bad.com"; password = "Password@123"; role = "ADMIN" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $hacker -ContentType "application/json"
    Report-Result "POST /api/auth/signup (Public ADMIN self-registration blocked)" $false "Expected 403 Forbidden"
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    Report-Result "POST /api/auth/signup (Public ADMIN self-registration blocked)" ($code -eq 403) "HTTP $code"
}

# 2.4 Authorized Admin Provisioning (Admin creating another Admin)
try {
    $randNum = Get-Random -Minimum 1000 -Maximum 9999
    $newAdmin = @{ fullName = "Commander Sarah Connor"; email = "commander$randNum@crisis-sync.gov"; password = "AdminPass@123"; role = "ADMIN" } | ConvertTo-Json
    $provRes = Invoke-RestMethod -Uri "$baseUrl/auth/admin-provision" -Method Post -Headers $authHeaders -Body $newAdmin
    Report-Result "POST /api/auth/admin-provision (Authorized Admin creation)" ($provRes.role -eq "ADMIN") "New Admin: $($provRes.email)"
} catch {
    Report-Result "POST /api/auth/admin-provision (Authorized Admin creation)" $false $_.Exception.Message
}

# --- MODULE 3: DASHBOARD METRICS ---
Write-Host "`n[3/8] Verifying Dashboard Statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/dashboard/stats" -Method Get -Headers $authHeaders
    $hasStats = ($null -ne $stats.totalRegions -and $null -ne $stats.availableTeams -and $null -ne $stats.pendingRequests)
    Report-Result "GET /api/dashboard/stats" $hasStats "Regions: $($stats.totalRegions), Pending Requests: $($stats.pendingRequests)"
} catch {
    Report-Result "GET /api/dashboard/stats" $false $_.Exception.Message
}

# --- MODULE 4: AFFECTED REGIONS ---
Write-Host "`n[4/8] Verifying Affected Regions Module..." -ForegroundColor Yellow
try {
    $regions = Invoke-RestMethod -Uri "$baseUrl/regions" -Method Get -Headers $authHeaders
    Report-Result "GET /api/regions" ($regions.Count -gt 0) "Retrieved $($regions.Count) regions"
} catch {
    Report-Result "GET /api/regions" $false $_.Exception.Message
}

try {
    $priority = Invoke-RestMethod -Uri "$baseUrl/regions/priority" -Method Get -Headers $authHeaders
    Report-Result "GET /api/regions/priority" ($priority.Count -gt 0) "Top priority: $($priority[0].regionName) (Severity: $($priority[0].severity))"
} catch {
    Report-Result "GET /api/regions/priority" $false $_.Exception.Message
}

try {
    $highest = Invoke-RestMethod -Uri "$baseUrl/regions/highest-need" -Method Get -Headers $authHeaders
    Report-Result "GET /api/regions/highest-need" ($null -ne $highest.regionName) "Highest need: $($highest.regionName)"
} catch {
    Report-Result "GET /api/regions/highest-need" $false $_.Exception.Message
}

try {
    $newRegion = @{ regionName = "Delta Sector $randNum"; population = 45000; severity = 8; accessible = $true } | ConvertTo-Json
    $createdRegion = Invoke-RestMethod -Uri "$baseUrl/regions" -Method Post -Headers $authHeaders -Body $newRegion
    Report-Result "POST /api/regions" ($createdRegion.regionName -match "Delta Sector") "Created: $($createdRegion.regionName)"
} catch {
    Report-Result "POST /api/regions" $false $_.Exception.Message
}

# --- MODULE 5: RESOURCE INVENTORY ---
Write-Host "`n[5/8] Verifying Resource Inventory Module..." -ForegroundColor Yellow
try {
    $inv = Invoke-RestMethod -Uri "$baseUrl/inventory" -Method Get -Headers $authHeaders
    Report-Result "GET /api/inventory" ($null -ne $inv.foodKits -and $null -ne $inv.medicineKits) "Food: $($inv.foodKits), Medicine: $($inv.medicineKits)"
} catch {
    Report-Result "GET /api/inventory" $false $_.Exception.Message
}

try {
    $addInv = @{ foodQuantity = 500; medicineQuantity = 250 } | ConvertTo-Json
    $updatedInv = Invoke-RestMethod -Uri "$baseUrl/inventory" -Method Post -Headers $authHeaders -Body $addInv
    Report-Result "POST /api/inventory" ($updatedInv.foodKits -ge 500) "Updated Food: $($updatedInv.foodKits), Meds: $($updatedInv.medicineKits)"
} catch {
    Report-Result "POST /api/inventory" $false $_.Exception.Message
}

# --- MODULE 6: RESCUE TEAMS & SHELTERS ---
Write-Host "`n[6/8] Verifying Rescue Teams & Shelters Modules..." -ForegroundColor Yellow
$teamId = 1
try {
    $teams = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Get -Headers $authHeaders
    Report-Result "GET /api/rescue-teams" ($teams.Count -gt 0) "Retrieved $($teams.Count) rescue teams"
    if ($teams.Count -gt 0) { $teamId = $teams[0].teamId }
} catch {
    Report-Result "GET /api/rescue-teams" $false $_.Exception.Message
}

try {
    $statusUpdate = @{ available = $false } | ConvertTo-Json
    $teamRes = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$teamId/status" -Method Put -Headers $authHeaders -Body $statusUpdate
    Report-Result "PUT /api/rescue-teams/$teamId/status" ($teamRes.available -eq $false) "Team $teamId marked busy"
    
    # Restore availability
    $statusRestore = @{ available = $true } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$teamId/status" -Method Put -Headers $authHeaders -Body $statusRestore | Out-Null
} catch {
    Report-Result "PUT /api/rescue-teams/$teamId/status" $false $_.Exception.Message
}

try {
    $shelters = Invoke-RestMethod -Uri "$baseUrl/shelters" -Method Get -Headers $authHeaders
    Report-Result "GET /api/shelters" ($shelters.Count -gt 0) "Retrieved $($shelters.Count) emergency shelters"
} catch {
    Report-Result "GET /api/shelters" $false $_.Exception.Message
}

try {
    $allocReq = @{ people = 50 } | ConvertTo-Json
    $allocRes = Invoke-RestMethod -Uri "$baseUrl/shelters/allocate" -Method Post -Headers $authHeaders -Body $allocReq
    Report-Result "POST /api/shelters/allocate" ($allocRes.success -eq $true) "Shelter allocation status: $($allocRes.message)"
} catch {
    Report-Result "POST /api/shelters/allocate" $false $_.Exception.Message
}

# --- MODULE 7: ROADS & GRAPH ROUTING ---
Write-Host "`n[7/8] Verifying Roads, Routes & Graph Algorithms (Dijkstra, BFS, DFS)..." -ForegroundColor Yellow
try {
    $roads = Invoke-RestMethod -Uri "$baseUrl/roads/network" -Method Get -Headers $authHeaders
    Report-Result "GET /api/roads/network" ($roads.Count -gt 0) "Network contains $($roads.Count) road segments"
} catch {
    Report-Result "GET /api/roads/network" $false $_.Exception.Message
}

try {
    $dijkstra = Invoke-RestMethod -Uri "$baseUrl/routes/shortest-time?source=Uptown&destination=Downtown" -Method Get -Headers $authHeaders
    Report-Result "GET /api/routes/shortest-time (Dijkstra)" ($dijkstra.reachable -eq $true) "Travel time: $($dijkstra.travelTime) mins | Path: $($dijkstra.path -join ' -> ')"
} catch {
    Report-Result "GET /api/routes/shortest-time (Dijkstra)" $false $_.Exception.Message
}

try {
    $bfs = Invoke-RestMethod -Uri "$baseUrl/regions/traverse/bfs?start=Uptown" -Method Get -Headers $authHeaders
    Report-Result "GET /api/regions/traverse/bfs (BFS Traversal)" ($bfs.traversalOrder.Count -gt 0) "Order: $($bfs.traversalOrder -join ', ')"
} catch {
    Report-Result "GET /api/regions/traverse/bfs (BFS Traversal)" $false $_.Exception.Message
}

try {
    $dfs = Invoke-RestMethod -Uri "$baseUrl/regions/traverse/dfs?start=Uptown" -Method Get -Headers $authHeaders
    Report-Result "GET /api/regions/traverse/dfs (DFS Traversal)" ($dfs.traversalOrder.Count -gt 0) "Order: $($dfs.traversalOrder -join ', ')"
} catch {
    Report-Result "GET /api/regions/traverse/dfs (DFS Traversal)" $false $_.Exception.Message
}

# --- MODULE 8: RELIEF & RESCUE REQUESTS ---
Write-Host "`n[8/8] Verifying Priority Requests & Dispatch Management..." -ForegroundColor Yellow
try {
    $supply = @{ regionId = 1; regionName = "Aruvi Village"; foodRequired = 100; medicineRequired = 50 } | ConvertTo-Json
    $supRes = Invoke-RestMethod -Uri "$baseUrl/requests/supply" -Method Post -Headers $authHeaders -Body $supply
    Report-Result "POST /api/requests/supply" ($supRes.requestId -gt 0) "Created Supply Request #$($supRes.requestId)"
} catch {
    Report-Result "POST /api/requests/supply" $false $_.Exception.Message
}

try {
    $rescue = @{ regionId = 1; regionName = "Aruvi Village"; peopleToRescue = 45; teamsRequired = 2 } | ConvertTo-Json
    $rescRes = Invoke-RestMethod -Uri "$baseUrl/requests/rescue" -Method Post -Headers $authHeaders -Body $rescue
    Report-Result "POST /api/requests/rescue" ($rescRes.requestId -gt 0) "Created Rescue Request #$($rescRes.requestId)"
} catch {
    Report-Result "POST /api/requests/rescue" $false $_.Exception.Message
}

try {
    $reqs = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $authHeaders
    Report-Result "GET /api/requests" ($reqs.Count -gt 0) "Pending Queue contains $($reqs.Count) requests"
} catch {
    Report-Result "GET /api/requests" $false $_.Exception.Message
}

try {
    $procRes = Invoke-RestMethod -Uri "$baseUrl/requests/process-next" -Method Post -Headers $authHeaders
    Report-Result "POST /api/requests/process-next" ($procRes.processed -eq $true) "Processed Request #$($procRes.request.requestId): $($procRes.message)"
} catch {
    Report-Result "POST /api/requests/process-next" $false $_.Exception.Message
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host " VERIFICATION SUMMARY: $passCount PASSED, $failCount FAILED       " -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "==================================================================`n" -ForegroundColor Cyan
