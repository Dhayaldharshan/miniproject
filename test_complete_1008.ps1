$auth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signin" -Method Post -ContentType "application/json" -Body '{"email":"admin@crisis-sync.gov","password":"Admin@123"}'
$headers = @{ "Authorization" = "Bearer $($auth.token)" }

Write-Host "Attempting to complete active rescue mission #1008..."
$res = Invoke-RestMethod -Uri "http://localhost:8080/api/rescue-teams/1008/complete-mission" -Method Post -Headers $headers
Write-Host "Response: $($res.message)"

$req1008 = Invoke-RestMethod -Uri "http://localhost:8080/api/requests/1008" -Method Get -Headers $headers
Write-Host "Request #1008 status in database: $($req1008.status)"

$teams = Invoke-RestMethod -Uri "http://localhost:8080/api/rescue-teams" -Method Get -Headers $headers
foreach ($t in $teams) {
    Write-Host "  Team: ID=$($t.teamId), name=$($t.teamName), available=$($t.available)"
}
