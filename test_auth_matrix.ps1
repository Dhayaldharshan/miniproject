$baseUrl = "http://localhost:8080"

$testCases = @(
    @{ email = "admin@crisis-sync.gov"; pass = "Admin@123"; role = "ADMIN"; desc = "Official Admin Email + Admin@123" },
    @{ email = "admin@crisis-sync.gov"; pass = "admin@123"; role = "ADMIN"; desc = "Official Admin Email + admin@123 (lowercase)" },
    @{ email = "usr-admin-01"; pass = "Admin@123"; role = "ADMIN"; desc = "Admin ID usr-admin-01 + Admin@123" },
    @{ email = "usr-admin-01"; pass = "admin@123"; role = "ADMIN"; desc = "Admin ID usr-admin-01 + admin@123" },
    @{ email = "admin"; pass = "Admin@123"; role = "ADMIN"; desc = "Username 'admin' + Admin@123" },
    @{ email = "admin"; pass = "admin"; role = "ADMIN"; desc = "Username 'admin' + 'admin'" },
    @{ email = "admin@resq.gov"; pass = "Admin@123"; role = "ADMIN"; desc = "admin@resq.gov + Admin@123" },
    @{ email = "admin@resq.gov"; pass = "admin"; role = "ADMIN"; desc = "admin@resq.gov + 'admin'" },
    @{ email = "coordinator@crisis-sync.gov"; pass = "Coordinator@123"; role = "COORDINATOR"; desc = "Coordinator + Coordinator@123" },
    @{ email = "citizen@crisis-sync.gov"; pass = "Citizen@123"; role = "PUBLIC"; desc = "Public Citizen + Citizen@123" },
    @{ email = "dharshinivenkatesan02@gmail.com"; pass = "123456"; role = "COORDINATOR"; desc = "Dharshini V + 123456 (COORDINATOR)" },
    @{ email = "dharsh@gmail.com"; pass = "123456"; role = "COORDINATOR"; desc = "dharsh + 123456 (COORDINATOR)" },
    @{ email = "invalid@example.com"; pass = "wrongpass"; role = "ADMIN"; desc = "Invalid credentials test" }
)

foreach ($tc in $testCases) {
    $payload = @{
        email = $tc.email
        password = $tc.pass
        accountType = $tc.role
    } | ConvertTo-Json
    
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method Post -ContentType "application/json" -Body $payload
        Write-Host "PASS: [$($tc.desc)] -> Token received, Role: $($res.role), Email: $($res.email)" -ForegroundColor Green
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $msg = $reader.ReadToEnd()
        Write-Host "FAIL ($status): [$($tc.desc)] -> $msg" -ForegroundColor Red
    }
}
