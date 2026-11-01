# ==============================================================================
# ResQ-Allocate — Full CRUD & Post-Restart Persistence Verification Script
# ==============================================================================

$baseUrl = "http://localhost:8080/api"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   ResQ-Allocate COMPREHENSIVE CRUD & PERSISTENCE TEST SUITE      " -ForegroundColor Cyan
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

# 1. Authenticate as ADMIN
$adminToken = ""
try {
    $adminCreds = @{ email = "admin@crisis-sync.gov"; password = "Admin@123" } | ConvertTo-Json
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -Body $adminCreds -ContentType "application/json"
    $adminToken = $adminRes.token
    Report-Result "Admin Authentication (JWT Obtained)" ($adminRes.role -eq "ADMIN" -and $adminToken) "Token: $($adminToken.Substring(0, 25))..."
} catch {
    Report-Result "Admin Authentication" $false $_.Exception.Message
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

$randId = Get-Random -Minimum 10000 -Maximum 99999

# --- 2. CRUD: AFFECTED REGIONS ---
Write-Host "`n[1/6] CRUD: Affected Regions..." -ForegroundColor Yellow
$testRegionId = 0
try {
    # CREATE
    $newReg = @{ regionName = "Persistence Test Region $randId"; population = 25000; severity = 7; accessible = $true } | ConvertTo-Json
    $createdReg = Invoke-RestMethod -Uri "$baseUrl/regions" -Method Post -Headers $headers -Body $newReg
    $testRegionId = $createdReg.regionId
    Report-Result "CREATE: POST /api/regions" ($createdReg.regionName -match "Persistence Test Region") "Region ID: $testRegionId"

    # READ
    $getReg = Invoke-RestMethod -Uri "$baseUrl/regions/$testRegionId" -Method Get -Headers $headers
    Report-Result "READ: GET /api/regions/$testRegionId" ($getReg.regionId -eq $testRegionId) "Name: $($getReg.regionName), Sev: $($getReg.severity)"

    # UPDATE
    $updateReg = @{ population = 30000; severity = 9; accessible = $false } | ConvertTo-Json
    $updatedReg = Invoke-RestMethod -Uri "$baseUrl/regions/$testRegionId" -Method Put -Headers $headers -Body $updateReg
    Report-Result "UPDATE: PUT /api/regions/$testRegionId" ($updatedReg.severity -eq 9 -and $updatedReg.accessible -eq $false) "New Severity: $($updatedReg.severity)"
} catch {
    Report-Result "Affected Regions CRUD" $false $_.Exception.Message
}

# --- 3. CRUD: RESCUE TEAMS ---
Write-Host "`n[2/6] CRUD: Rescue Teams..." -ForegroundColor Yellow
$testTeamId = 0
try {
    # CREATE
    $newTeam = @{ teamName = "Alpha Rescue Unit $randId"; currentLocation = "Test Base Alpha" } | ConvertTo-Json
    $createdTeam = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Post -Headers $headers -Body $newTeam
    $testTeamId = $createdTeam.teamId
    Report-Result "CREATE: POST /api/rescue-teams" ($createdTeam.teamName -match "Alpha Rescue Unit") "Team ID: $testTeamId"

    # READ
    $getTeam = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$testTeamId" -Method Get -Headers $headers
    Report-Result "READ: GET /api/rescue-teams/$testTeamId" ($getTeam.teamId -eq $testTeamId) "Name: $($getTeam.teamName)"

    # UPDATE
    $statusUpdate = @{ available = $false } | ConvertTo-Json
    $updatedTeam = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$testTeamId/status" -Method Put -Headers $headers -Body $statusUpdate
    Report-Result "UPDATE: PUT /api/rescue-teams/$testTeamId/status" ($updatedTeam.available -eq $false) "Status: Busy"
} catch {
    Report-Result "Rescue Teams CRUD" $false $_.Exception.Message
}

# --- 4. CRUD: SHELTERS ---
Write-Host "`n[3/6] CRUD: Shelters..." -ForegroundColor Yellow
$testShelterId = 0
try {
    # CREATE
    $newShelter = @{ shelterName = "Haven Shelter $randId"; location = "Sector 7G"; capacity = 350 } | ConvertTo-Json
    $createdShelter = Invoke-RestMethod -Uri "$baseUrl/shelters" -Method Post -Headers $headers -Body $newShelter
    $testShelterId = $createdShelter.shelterId
    Report-Result "CREATE: POST /api/shelters" ($createdShelter.shelterName -match "Haven Shelter") "Shelter ID: $testShelterId"

    # READ
    $getShelter = Invoke-RestMethod -Uri "$baseUrl/shelters/$testShelterId" -Method Get -Headers $headers
    Report-Result "READ: GET /api/shelters/$testShelterId" ($getShelter.shelterId -eq $testShelterId) "Name: $($getShelter.shelterName), Cap: $($getShelter.capacity)"
} catch {
    Report-Result "Shelters CRUD" $false $_.Exception.Message
}

# --- 5. CRUD: ROADS ---
Write-Host "`n[4/6] CRUD: Roads & Routing..." -ForegroundColor Yellow
$roadSrc = "TestPointA$randId"
$roadDst = "TestPointB$randId"
try {
    # CREATE
    $newRoad = @{ source = $roadSrc; destination = $roadDst; travelTime = 18 } | ConvertTo-Json
    $createdRoad = Invoke-RestMethod -Uri "$baseUrl/roads" -Method Post -Headers $headers -Body $newRoad
    Report-Result "CREATE: POST /api/roads" ($createdRoad.source -eq $roadSrc) "$roadSrc <-> $roadDst (18 mins)"

    # UPDATE
    $updateRoad = @{ source = $roadSrc; destination = $roadDst; open = $false } | ConvertTo-Json
    $updatedRoad = Invoke-RestMethod -Uri "$baseUrl/roads/status" -Method Put -Headers $headers -Body $updateRoad
    Report-Result "UPDATE: PUT /api/roads/status" ($updatedRoad.open -eq $false) "Status: CLOSED"
} catch {
    Report-Result "Roads CRUD" $false $_.Exception.Message
}

# --- 6. CRUD: INVENTORY ---
Write-Host "`n[5/6] CRUD: Resource Inventory..." -ForegroundColor Yellow
try {
    $invBefore = Invoke-RestMethod -Uri "$baseUrl/inventory" -Method Get -Headers $headers
    $addStock = @{ foodQuantity = 100; medicineQuantity = 50 } | ConvertTo-Json
    $invAfter = Invoke-RestMethod -Uri "$baseUrl/inventory" -Method Post -Headers $headers -Body $addStock
    Report-Result "UPDATE & READ: POST /api/inventory" ($invAfter.foodKits -eq ($invBefore.foodKits + 100) -and $invAfter.medicineKits -eq ($invBefore.medicineKits + 50)) "Food: $($invAfter.foodKits), Meds: $($invAfter.medicineKits)"
} catch {
    Report-Result "Inventory CRUD" $false $_.Exception.Message
}

# --- 7. CRUD: REQUESTS ---
Write-Host "`n[6/6] CRUD: Priority Requests..." -ForegroundColor Yellow
$testReqId = 0
try {
    # CREATE SUPPLY REQUEST
    $newReq = @{ regionId = $testRegionId; regionName = "Persistence Test Region $randId"; foodRequired = 50; medicineRequired = 25 } | ConvertTo-Json
    $createdReq = Invoke-RestMethod -Uri "$baseUrl/requests/supply" -Method Post -Headers $headers -Body $newReq
    $testReqId = $createdReq.requestId
    Report-Result "CREATE: POST /api/requests/supply" ($createdReq.requestId -gt 0) "Request ID: $testReqId"

    # READ ALL
    $allReqs = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers
    $found = ($allReqs | Where-Object { $_.requestId -eq $testReqId })
    Report-Result "READ: GET /api/requests" ($null -ne $found) "Found Request #$testReqId in queue"
} catch {
    Report-Result "Requests CRUD" $false $_.Exception.Message
}

# Summary of Pre-Restart Tests
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host " PRE-RESTART TEST RESULTS: $passCount PASSED, $failCount FAILED" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "==================================================================" -ForegroundColor Cyan

# Output created IDs for persistence validation script
$persistedData = @{
    randId = $randId
    regionId = $testRegionId
    regionName = "Persistence Test Region $randId"
    teamId = $testTeamId
    shelterId = $testShelterId
    roadSrc = $roadSrc
    roadDst = $roadDst
    requestId = $testReqId
} | ConvertTo-Json

$persistedData | Out-File -FilePath "persistence-test-meta.json" -Encoding UTF8
Write-Host "`nPersisted test metadata saved to persistence-test-meta.json" -ForegroundColor Green
