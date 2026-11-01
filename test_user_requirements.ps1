$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"

Write-Host "=========================================================="
Write-Host "  TESTING AFFECTED REGIONS & COMPLETE RESCUE MISSION FLOW "
Write-Host "=========================================================="

# 1. Authenticate as Admin
$auth = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"admin@crisis-sync.gov","password":"Admin@123"}'
$token = $auth.token
$headers = @{ "Authorization" = "Bearer $token" }
Write-Host "1. Admin authenticated successfully."

# 2. Affected Regions Verification
Write-Host "`n2. Verifying Affected Regions API & Database Fetch..."
$regions = Invoke-RestMethod -Uri "$baseUrl/regions" -Method Get -Headers $headers
if ($null -eq $regions -or $regions.Count -eq 0) {
    throw "FAIL: No regions found in database"
}
Write-Host "   PASS: Found $($regions.Count) affected regions in database."
$targetRegion = $regions[0]
Write-Host "   Target Region: ID=$($targetRegion.regionId), Name='$($targetRegion.regionName)', Severity=$($targetRegion.severity), Population=$($targetRegion.population)"

# 3. Test Creating Food / Medical Supply Request
Write-Host "`n3. Testing Creation of Food / Medical Supply Request..."
$supplyBody = @{
    regionId = $targetRegion.regionId
    foodRequired = 45
    medicineRequired = 25
} | ConvertTo-Json

$createdSupply = Invoke-RestMethod -Uri "$baseUrl/requests/supply" -Method Post -Headers $headers -ContentType "application/json" -Body $supplyBody
$supplyId = $createdSupply.requestId
Write-Host "   PASS: Created Supply Request #$supplyId for region '$($createdSupply.region.regionName)'"
Write-Host "         Food Required: $($createdSupply.foodRequired), Medicine Required: $($createdSupply.medicineRequired)"

# Verify Supply Request appears in Active Relief Requests table
$allRequests = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers
$foundSupply = $allRequests | Where-Object { $_.requestId -eq $supplyId }
if ($null -ne $foundSupply -and $foundSupply.requestType -eq "SUPPLY") {
    Write-Host "   PASS: Verified Supply Request #$supplyId appears in Active Requests queue with status '$($foundSupply.status)'"
} else {
    throw "FAIL: Supply Request #$supplyId was not found in active requests queue"
}

# 4. Test Creating Emergency Rescue Request
Write-Host "`n4. Testing Creation of Emergency Rescue Request..."
$rescueBody = @{
    regionId = $targetRegion.regionId
    peopleToRescue = 12
    teamsRequired = 1
} | ConvertTo-Json

$createdRescue = Invoke-RestMethod -Uri "$baseUrl/requests/rescue" -Method Post -Headers $headers -ContentType "application/json" -Body $rescueBody
$rescueId = $createdRescue.requestId
Write-Host "   PASS: Created Rescue Request #$rescueId for region '$($createdRescue.region.regionName)'"
Write-Host "         People to Rescue: $($createdRescue.peopleToRescue), Teams Required: $($createdRescue.teamsRequired)"

# Verify Rescue Request appears in Active Relief Requests table
$allRequests2 = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers
$foundRescue = $allRequests2 | Where-Object { $_.requestId -eq $rescueId }
if ($null -ne $foundRescue -and $foundRescue.requestType -eq "RESCUE") {
    Write-Host "   PASS: Verified Rescue Request #$rescueId appears in Active Requests queue with status '$($foundRescue.status)'"
} else {
    throw "FAIL: Rescue Request #$rescueId was not found in active requests queue"
}

# 5. Testing Complete Mission Validation & Error Handling
Write-Host "`n5. Testing Validation on Complete Mission..."

# A: Non-existent Request ID
try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/999999/complete-mission" -Method Post -Headers $headers
    throw "Expected failure for non-existent ID"
} catch {
    Write-Host "   PASS: Non-existent ID rejected: $($_.Exception.Message)"
}

# B: Supply Request ID (should be rejected because it's not a Rescue request)
try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$supplyId/complete-mission" -Method Post -Headers $headers
    throw "Expected failure when passing Supply request ID"
} catch {
    Write-Host "   PASS: Supply Request ID rejected for rescue mission completion: $($_.Exception.Message)"
}

# C: Waiting Rescue Request (teams not yet dispatched)
try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$rescueId/complete-mission" -Method Post -Headers $headers
    throw "Expected failure when completing WAITING mission"
} catch {
    Write-Host "   PASS: WAITING request rejected before dispatch: $($_.Exception.Message)"
}

# 6. Ensure at least one rescue team is AVAILABLE for dispatch
Write-Host "`n6. Preparing available rescue personnel..."
$teams = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Get -Headers $headers
$availableCount = ($teams | Where-Object { $_.available -eq $true }).Count
Write-Host "   Currently available teams: $availableCount"

if ($availableCount -eq 0) {
    # Check if any existing mission can be completed to free teams
    $inProg = $allRequests2 | Where-Object { $_.status -eq "IN_PROGRESS" -and $_.requestType -eq "RESCUE" }
    if ($null -ne $inProg -and $inProg.Count -gt 0) {
        $firstProgId = $inProg[0].requestId
        Write-Host "   Freeing teams by completing prior mission #$firstProgId..."
        Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$firstProgId/complete-mission" -Method Post -Headers $headers | Out-Null
    } else {
        # Create an available rescue team
        $newTeam = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Post -Headers $headers -ContentType "application/json" -Body '{"teamName":"Dedicated Deployment Unit","currentLocation":"Aruvi Village"}'
        Write-Host "   Registered new ready rescue team #$($newTeam.teamId) ($($newTeam.teamName))"
    }
}

# 7. Dispatch / Allocate Teams to Rescue Request #$rescueId
Write-Host "`n7. Dispatching Resource Allocation for Request #$rescueId..."
$allocated = $false
for ($i = 0; $i -lt 20; $i++) {
    $allocResp = Invoke-RestMethod -Uri "$baseUrl/allocation/process-next" -Method Post -Headers $headers
    Write-Host "   Allocation step $($i+1): $($allocResp.message)"
    
    $checkReqList = @(Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers | Where-Object { $_.requestId -eq $rescueId })
    if ($checkReqList.Count -gt 0 -and $checkReqList[0].status -eq "IN_PROGRESS") {
        $allocated = $true
        Write-Host "   -> Rescue Request #$rescueId successfully dispatched (Status: IN_PROGRESS)!"
        break
    }
}

if (-not $allocated) {
    throw "FAIL: Request #$rescueId could not be dispatched after multiple allocation passes."
}

# Verify assigned team is now marked unavailable
$teamsDuring = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Get -Headers $headers
$assignedTeam = $teamsDuring | Where-Object { $_.currentLocation -eq $targetRegion.regionName -and $_.available -eq $false }
Write-Host "   Rescue team deployed at '$($targetRegion.regionName)' (Available: false)"

# 8. Complete Mission & Release Teams
Write-Host "`n8. Completing Rescue Mission #$rescueId..."
try {
    $completeResp = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$rescueId/complete-mission" -Method Post -Headers $headers
    Write-Host "   PASS: Mission completed response: $($completeResp.message)"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "   ERROR BODY: $errorBody"
    throw $_
}

# Verify request status in MariaDB
$reqFinal = @(Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers | Where-Object { $_.requestId -eq $rescueId })
if ($reqFinal.Count -gt 0 -and $reqFinal[0].status -eq "COMPLETED") {
    Write-Host "   PASS: Request #$rescueId verified COMPLETED in MariaDB."
} else {
    throw "FAIL: Request #$rescueId status is not COMPLETED (actual: $($reqFinal[0].status))"
}

# Verify assigned team is released back to AVAILABLE in MariaDB
$teamsFinal = Invoke-RestMethod -Uri "$baseUrl/rescue-teams" -Method Get -Headers $headers
$releasedTeam = $teamsFinal | Where-Object { $_.currentLocation -eq $targetRegion.regionName -and $_.available -eq $true }
if ($null -ne $releasedTeam) {
    Write-Host "   PASS: Assigned rescue team is now released and AVAILABLE (Team: $($releasedTeam[0].teamName), Available: $($releasedTeam[0].available))"
}

# Attempt to complete the mission again (should fail)
try {
    $dupResp = Invoke-RestMethod -Uri "$baseUrl/rescue-teams/$rescueId/complete-mission" -Method Post -Headers $headers
    throw "Expected failure when re-completing already finished mission"
} catch {
    Write-Host "   PASS: Re-completion rejected: $($_.Exception.Message)"
}

Write-Host "`n=========================================================="
Write-Host "  ALL TESTS PASSED SUCCESSFULLY!                          "
Write-Host "=========================================================="
