$baseUrl = "http://localhost:8080"
$payload = @{
    email = "dharshinivenkatesan02@gmail.com"
    password = "123456"
    accountType = "ADMIN"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method Post -ContentType "application/json" -Body $payload
    Write-Host "Success: $($res.email)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $msg = $reader.ReadToEnd()
    Write-Host "Error status $status : $msg" -ForegroundColor Red
}
