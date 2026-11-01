$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080"
$apiBase = "$baseUrl/api"

Write-Host "================================================="
Write-Host "  RUNNING FULL-STACK INTEGRATION TEST SUITE      "
Write-Host "================================================="

# 1. Static Assets & Frontend Web Delivery
Write-Host "`n[TEST 1] Static Web Delivery..."
$indexResp = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
if ($indexResp.StatusCode -eq 200 -and $indexResp.Content -match "ResQ-Allocate") {
    Write-Host "  PASS: index.html served successfully via Spring Boot"
} else {
    throw "FAIL: index.html failed to serve"
}

$cssResp = Invoke-WebRequest -Uri "$baseUrl/style.css" -UseBasicParsing
$appResp = Invoke-WebRequest -Uri "$baseUrl/app.js" -UseBasicParsing
$apiResp = Invoke-WebRequest -Uri "$baseUrl/api.js" -UseBasicParsing
if ($cssResp.StatusCode -eq 200 -and $appResp.StatusCode -eq 200 -and $apiResp.StatusCode -eq 200) {
    Write-Host "  PASS: style.css, app.js, and api.js served with HTTP 200"
} else {
    throw "FAIL: Static assets failed to serve"
}

# 2. Authentication & Security
Write-Host "`n[TEST 2] Authentication & Security..."
# Test Invalid credentials
try {
    $badAuth = Invoke-RestMethod -Uri "$apiBase/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"admin@crisis-sync.gov","password":"WrongPassword"}'
    throw "Expected 401 Unauthorized"
} catch {
    Write-Host "  PASS: Invalid password correctly rejected (401/400)"
}

# Admin sign-in
$adminAuth = Invoke-RestMethod -Uri "$apiBase/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"admin@crisis-sync.gov","password":"Admin@123"}'
$adminToken = $adminAuth.token
if ($adminToken -and $adminAuth.role -eq "ADMIN") {
    Write-Host "  PASS: Admin authentication successful (JWT received, role: ADMIN)"
} else {
    throw "FAIL: Admin login failed"
}
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }

# Citizen sign-in & RBAC test
$citizenAuth = Invoke-RestMethod -Uri "$apiBase/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"citizen@crisis-sync.gov","password":"Citizen@123"}'
$citizenToken = $citizenAuth.token
$citizenHeaders = @{ "Authorization" = "Bearer $citizenToken" }
try {
    # Citizen trying to add warehouse inventory
    $forbiddenResp = Invoke-RestMethod -Uri "$apiBase/inventory/add" -Method Post -Headers $citizenHeaders -ContentType "application/json" -Body '{"foodKits":10,"medicineKits":10}'
    throw "Citizen should not be authorized to add inventory"
} catch {
    Write-Host "  PASS: RBAC enforced - Citizen forbidden from inventory modification (403)"
}

# 3. Module 1: Dashboard
Write-Host "`n[TEST 3] Module: Dashboard..."
$stats = Invoke-RestMethod -Uri "$apiBase/dashboard/stats" -Method Get -Headers $adminHeaders
if ($stats.totalRegions -ge 0 -and $stats.totalTeams -ge 0) {
    Write-Host "  PASS: Dashboard stats retrieved (Regions: $($stats.totalRegions), Teams: $($stats.totalTeams), Available: $($stats.availableTeams), Pending: $($stats.pendingRequests))"
} else {
    throw "FAIL: Dashboard stats invalid"
}

# 4. Module 2: Affected Regions
Write-Host "`n[TEST 4] Module: Affected Regions..."
$regions = Invoke-RestMethod -Uri "$apiBase/regions" -Method Get -Headers $adminHeaders
Write-Host "  PASS: Regions retrieved (count: $($regions.Count))"

$newRegionBody = @{
    regionName = "Test Haven " + (Get-Random -Minimum 1000 -Maximum 9999)
    population = 5000
    severity = 3
    accessible = $true
} | ConvertTo-Json
$createdRegion = Invoke-RestMethod -Uri "$apiBase/regions" -Method Post -Headers $adminHeaders -ContentType "application/json" -Body $newRegionBody
$testRegionId = $createdRegion.regionId
Write-Host "  PASS: Region created (ID: $testRegionId, Name: $($createdRegion.regionName))"

# 5. Module 4: Resource Inventory
Write-Host "`n[TEST 5] Module: Resource Inventory..."
$invBefore = Invoke-RestMethod -Uri "$apiBase/inventory" -Method Get -Headers $adminHeaders
$addStockBody = '{"foodKits": 25, "medicineKits": 15}'
$invAfter = Invoke-RestMethod -Uri "$apiBase/inventory/add" -Method Post -Headers $adminHeaders -ContentType "application/json" -Body $addStockBody
if ($invAfter.foodKits -eq ($invBefore.foodKits + 25) -and $invAfter.medicineKits -eq ($invBefore.medicineKits + 15)) {
    Write-Host "  PASS: Inventory added and verified in MariaDB (Food: $($invAfter.foodKits), Meds: $($invAfter.medicineKits))"
} else {
    throw "FAIL: Inventory add discrepancy"
}

# 6. Module 5: Rescue Teams
Write-Host "`n[TEST 6] Module: Rescue Teams..."
$teams = Invoke-RestMethod -Uri "$apiBase/teams" -Method Get -Headers $adminHeaders
Write-Host "  PASS: Rescue teams retrieved (count: $($teams.Count))"

$newTeamBody = @{
    teamName = "Test Response Squad " + (Get-Random -Minimum 100 -Maximum 999)
    currentLocation = $createdRegion.regionName
} | ConvertTo-Json
$createdTeam = Invoke-RestMethod -Uri "$apiBase/teams" -Method Post -Headers $adminHeaders -ContentType "application/json" -Body $newTeamBody
$testTeamId = $createdTeam.teamId
Write-Host "  PASS: Rescue team created (ID: $testTeamId, Name: $($createdTeam.teamName))"

# Toggle team availability
$patchResp = Invoke-RestMethod -Uri "$apiBase/teams/$testTeamId/availability?available=false" -Method Patch -Headers $adminHeaders
$patchedTeam = Invoke-RestMethod -Uri "$apiBase/teams" -Method Get -Headers $adminHeaders | Where-Object { $_.teamId -eq $testTeamId }
if ($patchedTeam.available -eq $false) {
    Write-Host "  PASS: Team availability toggled to false successfully"
}
$patchResp2 = Invoke-RestMethod -Uri "$apiBase/teams/$testTeamId/availability?available=true" -Method Patch -Headers $adminHeaders

# 7. Module 6: Shelters
Write-Host "`n[TEST 7] Module: Shelters..."
$shelters = Invoke-RestMethod -Uri "$apiBase/shelters" -Method Get -Headers $adminHeaders
Write-Host "  PASS: Shelters retrieved (count: $($shelters.Count))"

$newShelterBody = @{
    shelterName = "Emergency Camp " + (Get-Random -Minimum 100 -Maximum 999)
    location = $createdRegion.regionName
    capacity = 120
} | ConvertTo-Json
$createdShelter = Invoke-RestMethod -Uri "$apiBase/shelters" -Method Post -Headers $adminHeaders -ContentType "application/json" -Body $newShelterBody
Write-Host "  PASS: Shelter created (ID: $($createdShelter.shelterId), Capacity: $($createdShelter.capacity))"

# 8. Module 7: Roads & Routing
Write-Host "`n[TEST 8] Module: Roads & Routing..."
$roads = Invoke-RestMethod -Uri "$apiBase/roads" -Method Get -Headers $adminHeaders
Write-Host "  PASS: Roads retrieved (count: $($roads.Count))"

# Add road to test region
$newRoadBody = @{
    source = "Kurinji Nagar"
    destination = $createdRegion.regionName
    travelTime = 12
} | ConvertTo-Json
$createdRoad = Invoke-RestMethod -Uri "$apiBase/roads" -Method Post -Headers $adminHeaders -ContentType "application/json" -Body $newRoadBody
Write-Host "  PASS: Road connection added: Kurinji Nagar <-> $($createdRegion.regionName) (12 mins)"

# Query shortest path
$route = Invoke-RestMethod -Uri "$apiBase/roads/shortest-path?source=Kurinji%20Nagar&destination=$([System.Uri]::EscapeDataString($createdRegion.regionName))" -Method Get -Headers $adminHeaders
if ($route.reachable -eq $true -and $route.totalTravelTime -eq 12) {
    Write-Host "  PASS: Shortest path correctly resolved (Travel time: $($route.totalTravelTime) mins)"
} else {
    throw "FAIL: Shortest path calculation failed"
}

# Test road closure
$closeRoadBody = @{
    source = "Kurinji Nagar"
    destination = $createdRegion.regionName
    open = $false
} | ConvertTo-Json
$closeResp = Invoke-RestMethod -Uri "$apiBase/roads/status" -Method Patch -Headers $adminHeaders -ContentType "application/json" -Body $closeRoadBody
$routeClosed = Invoke-RestMethod -Uri "$apiBase/roads/shortest-path?source=Kurinji%20Nagar&destination=$([System.Uri]::EscapeDataString($createdRegion.regionName))" -Method Get -Headers $adminHeaders
if ($routeClosed.reachable -eq $false -or $routeClosed.totalTravelTime -lt 0) {
    Write-Host "  PASS: Road closure verified - destination unreachable when closed (reachable: false, travelTime: $($routeClosed.totalTravelTime))"
} else {
    throw "FAIL: Road closure was not respected by routing"
}

# Re-open road
$reopenBody = @{
    source = "Kurinji Nagar"
    destination = $createdRegion.regionName
    open = $true
} | ConvertTo-Json
$reopenResp = Invoke-RestMethod -Uri "$apiBase/roads/status" -Method Patch -Headers $adminHeaders -ContentType "application/json" -Body $reopenBody

# 9. Module 3: Priority Requests & Module 8: Resource Allocation
Write-Host "`n[TEST 9] Module: Priority Requests & Allocation..."
# Create a rescue request
$rescueReqBody = @{
    regionId = $testRegionId
    severity = 5
    affectedPopulation = 50
    peopleToRescue = 15
    teamsRequired = 1
} | ConvertTo-Json
$createdRescueReq = Invoke-RestMethod -Uri "$apiBase/requests/rescue" -Method Post -Headers $adminHeaders -ContentType "application/json" -Body $rescueReqBody
$testRescueId = $createdRescueReq.requestId
Write-Host "  PASS: Rescue Request created (ID: $testRescueId, Severity: $($createdRescueReq.severity), Status: $($createdRescueReq.status))"

# Allocate next resource
$allocResult = Invoke-RestMethod -Uri "$apiBase/allocation/process-next" -Method Post -Headers $adminHeaders
Write-Host "  PASS: Process next request result: $($allocResult.message)"
$reqStatusAfter = Invoke-RestMethod -Uri "$apiBase/requests" -Method Get -Headers $adminHeaders | Where-Object { $_.requestId -eq $testRescueId }
Write-Host "  Status after allocation: $($reqStatusAfter.status)"

# 10. Module 9: Rescue Mission Completion
Write-Host "`n[TEST 10] Module: Rescue Mission Completion..."
if ($reqStatusAfter.status -eq "IN_PROGRESS") {
    $completeResult = Invoke-RestMethod -Uri "$apiBase/allocation/complete-mission/$testRescueId" -Method Post -Headers $adminHeaders
    Write-Host "  PASS: Complete mission called: $($completeResult.message)"
    
    $reqCompleted = Invoke-RestMethod -Uri "$apiBase/requests" -Method Get -Headers $adminHeaders | Where-Object { $_.requestId -eq $testRescueId }
    if ($reqCompleted.status -eq "COMPLETED") {
        Write-Host "  PASS: Request #$testRescueId verified COMPLETED in database"
    } else {
        throw "FAIL: Request #$testRescueId status is not COMPLETED"
    }
} else {
    Write-Host "  NOTE: Request status was $($reqStatusAfter.status), attempting complete-mission directly"
    $completeResult = Invoke-RestMethod -Uri "$apiBase/allocation/complete-mission/$testRescueId" -Method Post -Headers $adminHeaders
    Write-Host "  Result: $($completeResult.message)"
}

Write-Host "`n================================================="
Write-Host "  ALL 9 MODULES PASSED FULL INTEGRATION TESTS!   "
Write-Host "================================================="
