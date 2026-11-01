$tests = @(
    @{ Url = "http://localhost:8080/frontend/index.html"; Method = "GET"; Headers = @{}; Name = "Frontend index.html" },
    @{ Url = "http://localhost:8080/frontend/app.js"; Method = "GET"; Headers = @{}; Name = "Frontend app.js" },
    @{ Url = "http://localhost:8080/frontend/api.js"; Method = "GET"; Headers = @{}; Name = "Frontend api.js" },
    @{ Url = "http://localhost:8080/frontend/style.css"; Method = "GET"; Headers = @{}; Name = "Frontend style.css" }
)

Write-Host "Testing Static Asset Delivery & CORS:" -ForegroundColor Cyan

foreach ($t in $tests) {
    try {
        $res = Invoke-WebRequest -Uri $t.Url -Method $t.Method -Headers $t.Headers -UseBasicParsing -TimeoutSec 5
        Write-Host "[PASS] $($t.Name) -> HTTP $($res.StatusCode), Size: $($res.RawContentLength) bytes" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $($t.Name) -> $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test CORS Preflight from Live Server (port 5500)
try {
    $corsHeaders = @{
        "Origin" = "http://127.0.0.1:5500"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type,Accept"
    }
    $optRes = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/signin" -Method OPTIONS -Headers $corsHeaders -UseBasicParsing -TimeoutSec 5
    $allowOrigin = $optRes.Headers["Access-Control-Allow-Origin"]
    Write-Host "[PASS] CORS Preflight OPTIONS -> HTTP $($optRes.StatusCode), Allow-Origin: $allowOrigin" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] CORS Preflight -> $($_.Exception.Message)" -ForegroundColor Red
}

# Test CORS POST from Live Server (port 5500)
try {
    $postHeaders = @{
        "Origin" = "http://127.0.0.1:5500"
    }
    $postBody = '{"email":"admin","password":"admin","accountType":"ADMIN"}'
    $postRes = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/signin" -Method POST -Body $postBody -ContentType "application/json" -Headers $postHeaders -UseBasicParsing -TimeoutSec 5
    $allowOrigin = $postRes.Headers["Access-Control-Allow-Origin"]
    Write-Host "[PASS] CORS Actual POST -> HTTP $($postRes.StatusCode), Allow-Origin: $allowOrigin" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] CORS Actual POST -> $($_.Exception.Message)" -ForegroundColor Red
}
