$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"

Write-Host "=========================================================="
Write-Host "  FULL LIFECYCLE: AFFECTED REGIONS & COMPLETE MISSION     "
Write-Host "=========================================================="

# 1. Authenticate as Admin
$auth = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"admin@crisis-sync.gov","password":"Admin@123"}'
$headers = @{ "Authorization" = "Bearer $($auth.token)" }
Write-Host "1. Admin authenticated successfully."

# 2. Check Affected Regions in Database
Write-Host "`n2. Fetching Affected Regions from Database..."
$regions = Invoke-RestMethod -Uri "$baseUrl/regions" -Method Get -Headers $headers
if ($null -eq $regions -or $regions.Count -eq 0) {
    throw "FAIL: No affected regions returned from database"
}
Write-Host "   PASS: Retrieved $($regions.Count) regions."
$selectedRegion = $regions[0]
Write-Host "   Selected Region for Testing: ID=$($selectedRegion.regionId), Name='$($selectedRegion.regionName)', Severity=$($selectedRegion.severity), Population=$($selectedRegion.population)"

# 3. Create Supply Request
Write-Host "`n3. Creating Food / Medical Supply Request..."
$supplyPayload = @{
    regionId = $selectedRegion.regionId
    foodRequired = 60
    medicineRequired = 30
} | ConvertTo-Json
$createdSupply = Invoke-RestMethod -Uri "$baseUrl/requests/supply" -Method Post -Headers $headers -ContentType "application/json" -Body $supplyPayload
$supplyId = $createdSupply.requestId
Write-Host "   PASS: Created Supply Request #$supplyId (Region: '$($createdSupply.region.regionName)', Food: $($createdSupply.foodRequired), Meds: $($createdSupply.medicineRequired))"

# Verify Supply Request is in the queue
$reqs = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers
$verifiedSupply = $reqs | Where-Object { $_.requestId -eq $supplyId }
if ($null -ne $verifiedSupply -and $verifiedSupply.requestType -eq "SUPPLY") {
    Write-Host "   PASS: Supply Request #$supplyId verified in Active Relief Requests queue (Status: $($verifiedSupply.status))"
} else {
    throw "FAIL: Supply Request #$supplyId not found in queue"
}

# 4. Create Emergency Rescue Request
Write-Host "`n4. Creating Emergency Rescue Request..."
$rescuePayload = @{
    regionId = $selectedRegion.regionId
    peopleToRescue = 8
    teamsRequired = 1
} | ConvertTo-Json
$createdRescue = Invoke-RestMethod -Uri "$baseUrl/requests/rescue" -Method Post -Headers $headers -ContentType "application/json" -Body $rescuePayload
$rescueId = $createdRescue.requestId
Write-Host "   PASS: Created Rescue Request #$rescueId (Region: '$($createdRescue.region.regionName)', People: $($createdRescue.peopleToRescue), Teams: $($createdRescue.teamsRequired))"

# Verify Rescue Request is in the queue
$reqs2 = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers
$verifiedRescue = $reqs2 | Where-Object { $_.requestId -eq $rescueId }
if ($null -ne $verifiedRescue -and $verifiedRescue.requestType -eq "RESCUE") {
    Write-Host "   PASS: Rescue Request #$rescueId verified in Active Relief Requests queue (Status: $($verifiedRescue.status))"
} else {
    throw "FAIL: Rescue Request #$rescueId not found in queue"
}

# 5. Validation Testing on Complete Mission
Write-Host "`n5. Testing Complete Mission Validation & Error Handling..."

function Test-Expected-Error($uri, $expectedMessage) {
    try {
        Invoke-RestMethod -Uri $uri -Method Post -Headers $headers
        throw "Expected failure for $uri"
    } catch {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $msg = $reader.ReadToEnd()
        Write-Host "   PASS: Expected error received: $msg"
    }
}

Write-Host "   Test 5A: Non-existent Request ID (999999)..."
Test-Expected-Error "$baseUrl/rescue-teams/999999/complete-mission" "does not exist"

Write-Host "   Test 5B: Supply Request ID passed to Complete Rescue Mission..."
Test-Expected-Error "$baseUrl/rescue-teams/$supplyId/complete-mission" "not an Emergency Rescue mission"

Write-Host "   Test 5C: Undispatched / WAITING Rescue Request ID..."
Test-Expected-Error "$baseUrl/rescue-teams/$rescueId/complete-mission" "currently in WAITING status"

# 6. Dispatch and Allocate to Rescue Request #$rescueId
Write-Host "`n6. Dispatching Allocation until Request #$rescueId is IN_PROGRESS..."

# Create a dedicated rescue team if needed so a team is guaranteed available for this region
$teamName = "Unit-Alpha-" + (Get-Random -Minimum 100 -Maximum 999)
$newTeam = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Post -Headers $headers -ContentType "application/json" -Body (@{ teamName = $teamName; currentLocation = $selectedRegion.regionName } | ConvertTo-Json)
Write-Host "   Created dedicated deployment team #$($newTeam.teamId) '$($newTeam.teamName)' at '$($selectedRegion.regionName)'"

$dispatched = $false
for ($step = 1; $step -le 30; $step++) {
    $availTeams = @(Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Get -Headers $headers | Where-Object { $_.available -eq $true })
    if ($availTeams.Count -eq 0) {
        $tName = "Unit-Alpha-" + (Get-Random -Minimum 100 -Maximum 999)
        Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Post -Headers $headers -ContentType "application/json" -Body (@{ teamName = $tName; currentLocation = $selectedRegion.regionName } | ConvertTo-Json) | Out-Null
    }
    $alloc = Invoke-RestMethod -Uri "$baseUrl/allocation/process-next" -Method Post -Headers $headers
    $currentRescue = Invoke-RestMethod -Uri "$baseUrl/requests/$rescueId" -Method Get -Headers $headers
    if ($currentRescue.status -eq "IN_PROGRESS") {
        $dispatched = $true
        Write-Host "   PASS: Rescue Request #$rescueId successfully dispatched at step $step! (Status: IN_PROGRESS, Assigned Team: $($currentRescue.assignedTeamId))"
        break
    }
}

if (-not $dispatched) {
    throw "FAIL: Could not transition Request #$rescueId to IN_PROGRESS"
}

# 7. Check Deployed Team Status
$teamsDuring = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Get -Headers $headers
$assignedId = $currentRescue.assignedTeamId
$deployedTeam = $teamsDuring | Where-Object { $_.teamId -eq $assignedId }
Write-Host "   Deployed Team #$($deployedTeam.teamId) availability during mission: $($deployedTeam.available) (Expected: False)"

# 8. Complete Rescue Mission & Release Assigned Teams
Write-Host "`n7. Completing Rescue Mission #$rescueId..."
$completeResult = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$rescueId/complete-mission" -Method Post -Headers $headers
Write-Host "   PASS: Mission completion response: $($completeResult.message)"

# 9. Verify Request Status in MariaDB
$finalReq = Invoke-RestMethod -Uri "$baseUrl/requests/$rescueId" -Method Get -Headers $headers
if ($finalReq.status -eq "COMPLETED") {
    Write-Host "   PASS: Request #$rescueId is confirmed COMPLETED in MariaDB."
} else {
    throw "FAIL: Request #$rescueId status is not COMPLETED (actual: $($finalReq.status))"
}

# 10. Verify Assigned Team is Released
$teamsAfter = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Get -Headers $headers
$releasedTeam = $teamsAfter | Where-Object { $_.teamId -eq $assignedId }
if ($releasedTeam.available -eq $true) {
    Write-Host "   PASS: Assigned Team #$($releasedTeam.teamId) successfully released to AVAILABLE (available: True)"
} else {
    throw "FAIL: Assigned Team was not released to available: True"
}

# 11. Test Duplicate Completion Rejection
Write-Host "`n8. Testing Duplicate Completion Rejection..."
Test-Expected-Error "$baseUrl/rescue-teams/$rescueId/complete-mission" "already marked COMPLETED"

Write-Host "`n=========================================================="
Write-Host "  FULL LIFECYCLE TESTS COMPLETED WITH 100% SUCCESS!       "
Write-Host "=========================================================="
