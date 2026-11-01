$baseUrl = "http://localhost:8080"

$origins = @("http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000", "null")

foreach ($orig in $origins) {
    Write-Host "Testing Origin: $orig" -ForegroundColor Cyan
    $headers = @{
        "Origin" = $orig
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type,Authorization"
    }
    
    try {
        $res = Invoke-WebRequest -Uri "$baseUrl/api/auth/signin" -Method Options -Headers $headers
        Write-Host "  OPTIONS Preflight Status: $($res.StatusCode)" -ForegroundColor Green
        Write-Host "  Allow-Origin: $($res.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    } catch {
        Write-Host "  OPTIONS Preflight FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}
