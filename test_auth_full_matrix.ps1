$baseUrl = "http://localhost:8080/api/auth/signin"

function Test-SignIn {
    param (
        [string]$testName,
        [string]$email,
        [string]$password,
        [string]$accountType,
        [int]$expectedStatus
    )

    $bodyObj = @{
        email = $email
        password = $password
    }
    if ($accountType) {
        $bodyObj.accountType = $accountType
    }
    $json = $bodyObj | ConvertTo-Json -Compress

    try {
        $res = Invoke-WebRequest -Uri $baseUrl -Method POST -Body $json -ContentType "application/json" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $code = [int]$res.StatusCode
        $content = $res.Content | ConvertFrom-Json
        $passed = ($code -eq $expectedStatus)
        if ($passed) {
            Write-Host "[PASS] $testName -> Status: $code, Role: $($content.role), Token: $([bool]$content.token)" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $testName -> Expected $expectedStatus, got $code" -ForegroundColor Red
        }
        return $passed
    } catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $code = [int]$resp.StatusCode
            $passed = ($code -eq $expectedStatus)
            if ($passed) {
                Write-Host "[PASS] $testName -> Status $code returned as expected." -ForegroundColor Green
            } else {
                Write-Host "[FAIL] $testName -> Expected $expectedStatus, got status $code" -ForegroundColor Red
            }
            return $passed
        } else {
            Write-Host "[ERROR] $testName -> Exception: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " RUNNING COMPREHENSIVE AUTHENTICATION VERIFICATION SUITE " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$results = @()

# 1. Default Admin Logins
$results += Test-SignIn -testName "1. Admin with email & Admin@123" -email "admin@crisis-sync.gov" -password "Admin@123" -accountType "ADMIN" -expectedStatus 200
$results += Test-SignIn -testName "2. Admin with usr-admin-01 & Admin@123" -email "usr-admin-01" -password "Admin@123" -accountType "ADMIN" -expectedStatus 200
$results += Test-SignIn -testName "3. Admin with identifier 'admin' & 'admin'" -email "admin" -password "admin" -accountType "ADMIN" -expectedStatus 200
$results += Test-SignIn -testName "4. Admin with identifier 'admin' & 'admin123'" -email "admin" -password "admin123" -accountType "ADMIN" -expectedStatus 200
$results += Test-SignIn -testName "5. Admin with 'admin@123' identifier" -email "admin@123" -password "Admin@123" -accountType "ADMIN" -expectedStatus 200

# 2. Default Pre-seeded Coordinator & Public Logins
$results += Test-SignIn -testName "6. Coordinator default account" -email "coordinator@crisis-sync.gov" -password "Coordinator@123" -accountType "COORDINATOR" -expectedStatus 200
$results += Test-SignIn -testName "7. Public Citizen default account" -email "citizen@crisis-sync.gov" -password "Citizen@123" -accountType "PUBLIC" -expectedStatus 200

# 3. Real Existing MariaDB User Accounts
$results += Test-SignIn -testName "8. Real user dharshinivenkatesan02@gmail.com" -email "dharshinivenkatesan02@gmail.com" -password "123456" -accountType "COORDINATOR" -expectedStatus 200
$results += Test-SignIn -testName "9. Real user dharsh@gmail.com" -email "dharsh@gmail.com" -password "123456" -accountType "COORDINATOR" -expectedStatus 200

# 4. Strict Invalid Credentials Rejections
$results += Test-SignIn -testName "10. Reject Admin with wrong password" -email "admin@crisis-sync.gov" -password "WrongPassword999" -accountType "ADMIN" -expectedStatus 401
$results += Test-SignIn -testName "11. Reject Non-existent user" -email "nonexistent.user@random.org" -password "Secret123" -accountType "PUBLIC" -expectedStatus 401
$results += Test-SignIn -testName "12. Reject real user with incorrect password" -email "dharsh@gmail.com" -password "Wrong123" -accountType "COORDINATOR" -expectedStatus 401

# 5. Role Mismatch Enforcement
$results += Test-SignIn -testName "13. Reject Coordinator attempting ADMIN login" -email "dharshinivenkatesan02@gmail.com" -password "123456" -accountType "ADMIN" -expectedStatus 403

$total = $results.Count
$passedCount = ($results | Where-Object { $_ -eq $true }).Count
$color = if ($passedCount -eq $total) { "Green" } else { "Red" }
Write-Host "`n--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " SUMMARY: $passedCount / $total Tests Passed" -ForegroundColor $color
Write-Host "--------------------------------------------------------`n" -ForegroundColor Cyan
