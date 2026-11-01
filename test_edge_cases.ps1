$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
$auth = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"admin@crisis-sync.gov","password":"Admin@123"}'
$headers = @{ "Authorization" = "Bearer $($auth.token)" }

Write-Host "--- TEST EDGE CASE 1: Shelter Capacity Shortage ---"
# Create a rescue request requiring 99999 evacuees (more than total shelter capacity)
$largeRescue = Invoke-RestMethod -Uri "$baseUrl/requests/rescue" -Method Post -Headers $headers -ContentType "application/json" -Body '{"regionId":1,"severity":5,"affectedPopulation":99999,"peopleToRescue":99999,"teamsRequired":1}'
Write-Host "Created rescue request #$($largeRescue.requestId) with 99999 people to rescue"

$allocResp = Invoke-RestMethod -Uri "$baseUrl/allocation/process-next" -Method Post -Headers $headers
Write-Host "Allocation response: $($allocResp.message)"

$reqCheck = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers | Where-Object { $_.requestId -eq $largeRescue.requestId }
if ($reqCheck.status -eq "WAITING") {
    Write-Host "PASS: Request with excess evacuees was rejected from allocation and kept in WAITING status"
} else {
    throw "FAIL: Request was improperly allocated despite insufficient shelter capacity"
}

Write-Host "`n--- TEST EDGE CASE 2: Team Shortage ---"
# Create a rescue request requiring 50 rescue teams (more than total teams)
$hugeTeamRescue = Invoke-RestMethod -Uri "$baseUrl/requests/rescue" -Method Post -Headers $headers -ContentType "application/json" -Body '{"regionId":1,"severity":5,"affectedPopulation":10,"peopleToRescue":10,"teamsRequired":50}'
Write-Host "Created rescue request #$($hugeTeamRescue.requestId) requiring 50 rescue teams"

$allocResp2 = Invoke-RestMethod -Uri "$baseUrl/allocation/process-next" -Method Post -Headers $headers
Write-Host "Allocation response: $($allocResp2.message)"
$reqCheck2 = Invoke-RestMethod -Uri "$baseUrl/requests" -Method Get -Headers $headers | Where-Object { $_.requestId -eq $hugeTeamRescue.requestId }
if ($reqCheck2.status -eq "WAITING") {
    Write-Host "PASS: Request requiring 50 teams stayed in WAITING status due to insufficient teams"
} else {
    throw "FAIL: Request was improperly allocated despite team shortage"
}

Write-Host "`n--- TEST EDGE CASE 3: Dijkstra Unreachable Destination ---"
$unreachable = Invoke-RestMethod -Uri "$baseUrl/routes/shortest-time?source=Kurinji%20Nagar&destination=NonExistentIsland" -Method Get -Headers $headers
Write-Host "Route result: reachable=$($unreachable.reachable), totalTravelTime=$($unreachable.totalTravelTime)"
if ($unreachable.reachable -eq $false -and $unreachable.totalTravelTime -lt 0) {
    Write-Host "PASS: Unreachable route correctly returned reachable=false, totalTravelTime=-1"
} else {
    throw "FAIL: Unreachable route did not return structured error"
}

Write-Host "`n--- ALL EDGE CASES PASSED! ---"
