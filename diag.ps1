$auth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"admin@crisis-sync.gov","password":"Admin@123"}'
$headers = @{ "Authorization" = "Bearer $($auth.token)" }

$reqs = Invoke-RestMethod -Uri "http://localhost:8080/api/requests" -Method Get -Headers $headers
Write-Host "Total requests count: $($reqs.Count)"
$last = $reqs[-1]
Write-Host "Last request: ID=$($last.requestId), type=$($last.requestType), status=$($last.status)"

$inProg = $reqs | Where-Object { $_.status -eq "IN_PROGRESS" }
Write-Host "In progress count: $($inProg.Count)"
foreach ($ip in $inProg) {
    Write-Host "  IN_PROGRESS: ID=$($ip.requestId), type=$($ip.requestType), region=$($ip.region.regionName)"
}

$teams = Invoke-RestMethod -Uri "http://localhost:8080/api/rescue-teams" -Method Get -Headers $headers
Write-Host "Total teams: $($teams.Count)"
foreach ($t in $teams) {
    Write-Host "  Team: ID=$($t.teamId), name=$($t.teamName), loc=$($t.currentLocation), available=$($t.available)"
}
