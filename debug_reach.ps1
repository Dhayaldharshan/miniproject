$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/signin" -Method Post -Body '{"email":"admin@crisis-sync.gov","password":"admin@123","role":"ADMIN"}' -ContentType "application/json"
$h = @{ Authorization = "Bearer " + $loginRes.token }
$res = Invoke-RestMethod -Uri "http://localhost:8080/api/roads/reachability?depot=Aruvi Village" -Method Get -Headers $h
Write-Host "Keys in response: $($res.psobject.properties.name -join ', ')"
Write-Host "Depot: $($res.depot)"
Write-Host "Regions item count: $($res.regions.Count)"
$res.regions | Select-Object -First 3 | ConvertTo-Json
