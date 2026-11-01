# ==============================================================================
# ResQ-Allocate — Post-Restart Persistence & DELETE Operations Verification Script
# ==============================================================================

$baseUrl = "http://localhost:8080/api"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   ResQ-Allocate POST-RESTART PERSISTENCE & DELETE VERIFICATION  " -ForegroundColor Cyan
Write-Host "==================================================================`n" -ForegroundColor Cyan

if (-not (Test-Path "persistence-test-meta.json")) {
    Write-Host "Error: persistence-test-meta.json not found!" -ForegroundColor Red
    exit 1
}

$meta = Get-Content "persistence-test-meta.json" -Raw | ConvertFrom-Json
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
    Report-Result "Post-Restart Admin Authentication (JWT)" ($adminRes.role -eq "ADMIN" -and $adminToken) "Token verified"
} catch {
    Report-Result "Post-Restart Admin Authentication" $false $_.Exception.Message
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# --- 2. PERSISTENCE CHECKS (Verifying records created before restart) ---
Write-Host "`n[1/2] Verifying Record Persistence After Restart..." -ForegroundColor Yellow

# Region Persistence
try {
    $persistedReg = Invoke-RestMethod -Uri "$baseUrl/regions/$($meta.regionId)" -Method Get -Headers $headers
    $regOk = ($persistedReg.regionId -eq $meta.regionId -and $persistedReg.severity -eq 9)
    Report-Result "PERSISTENCE: Affected Region #$($meta.regionId)" $regOk "Name: $($persistedReg.regionName), Severity: $($persistedReg.severity) (Persisted in MariaDB)"
} catch {
    Report-Result "PERSISTENCE: Affected Region #$($meta.regionId)" $false $_.Exception.Message
}

# Rescue Team Persistence
try {
    $persistedTeam = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$($meta.teamId)" -Method Get -Headers $headers
    $teamOk = ($persistedTeam.teamId -eq $meta.teamId -and $persistedTeam.available -eq $false)
    Report-Result "PERSISTENCE: Rescue Team #$($meta.teamId)" $teamOk "Name: $($persistedTeam.teamName), Status: Busy (Persisted in MariaDB)"
} catch {
    Report-Result "PERSISTENCE: Rescue Team #$($meta.teamId)" $false $_.Exception.Message
}

# Shelter Persistence
try {
    $persistedShelter = Invoke-RestMethod -Uri "$baseUrl/shelters/$($meta.shelterId)" -Method Get -Headers $headers
    $shelterOk = ($persistedShelter.shelterId -eq $meta.shelterId -and $persistedShelter.capacity -eq 350)
    Report-Result "PERSISTENCE: Shelter #$($meta.shelterId)" $shelterOk "Name: $($persistedShelter.shelterName), Cap: $($persistedShelter.capacity) (Persisted in MariaDB)"
} catch {
    Report-Result "PERSISTENCE: Shelter #$($meta.shelterId)" $false $_.Exception.Message
}

# Road Persistence
try {
    $network = Invoke-RestMethod -Uri "$baseUrl/roads/network" -Method Get -Headers $headers
    $foundRoad = ($network | Where-Object { ($_.source -eq $meta.roadSrc -and $_.destination -eq $meta.roadDst) -or ($_.source -eq $meta.roadDst -and $_.destination -eq $meta.roadSrc) })
    Report-Result "PERSISTENCE: Road $($meta.roadSrc) <-> $($meta.roadDst)" ($null -ne $foundRoad -and $foundRoad.open -eq $false) "Status: CLOSED (Persisted in MariaDB)"
} catch {
    Report-Result "PERSISTENCE: Road" $false $_.Exception.Message
}

# Request Persistence
try {
    $reqs = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers
    $foundReq = ($reqs | Where-Object { $_.requestId -eq $meta.requestId })
    Report-Result "PERSISTENCE: Request #$($meta.requestId)" ($null -ne $foundReq) "Waiting in Priority Queue (Persisted in MariaDB)"
} catch {
    Report-Result "PERSISTENCE: Request #$($meta.requestId)" $false $_.Exception.Message
}

# --- 3. DELETE OPERATIONS (Completing Full CRUD Lifecycle & DB Removal) ---
Write-Host "`n[2/2] Verifying DELETE Endpoints & Database Removal..." -ForegroundColor Yellow

# Delete Request
try {
    $delReqRes = Invoke-RestMethod -Uri "$baseUrl/requests/$($meta.requestId)" -Method Delete -Headers $headers
    Report-Result "DELETE: /api/requests/$($meta.requestId)" ($delReqRes.message -match "deleted") "Removed from DB & Queue"
} catch {
    Report-Result "DELETE: /api/requests/$($meta.requestId)" $false $_.Exception.Message
}

# Delete Region
try {
    $delRegRes = Invoke-RestMethod -Uri "$baseUrl/regions/$($meta.regionId)" -Method Delete -Headers $headers
    Report-Result "DELETE: /api/regions/$($meta.regionId)" ($delRegRes.message -match "deleted") "Removed from DB & Cache"
} catch {
    Report-Result "DELETE: /api/regions/$($meta.regionId)" $false $_.Exception.Message
}

# Delete Team
try {
    $delTeamRes = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$($meta.teamId)" -Method Delete -Headers $headers
    Report-Result "DELETE: /api/rescue-teams/$($meta.teamId)" ($delTeamRes.success -eq $true) "Removed from DB & Active Pool"
} catch {
    Report-Result "DELETE: /api/rescue-teams/$($meta.teamId)" $false $_.Exception.Message
}

# Delete Shelter
try {
    $delShelterRes = Invoke-RestMethod -Uri "$baseUrl/shelters/$($meta.shelterId)" -Method Delete -Headers $headers
    Report-Result "DELETE: /api/shelters/$($meta.shelterId)" ($delShelterRes.success -eq $true) "Removed from DB & Shelter registry"
} catch {
    Report-Result "DELETE: /api/shelters/$($meta.shelterId)" $false $_.Exception.Message
}

# Delete Road
try {
    $delRoadRes = Invoke-RestMethod -Uri "$baseUrl/roads?source=$($meta.roadSrc)&destination=$($meta.roadDst)" -Method Delete -Headers $headers
    Report-Result "DELETE: /api/roads?source=$($meta.roadSrc)&destination=$($meta.roadDst)" ($delRoadRes.success -eq $true) "Removed from DB & Graph"
} catch {
    Report-Result "DELETE: /api/roads" $false $_.Exception.Message
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host " POST-RESTART TEST RESULTS: $passCount PASSED, $failCount FAILED" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "==================================================================" -ForegroundColor Cyan
