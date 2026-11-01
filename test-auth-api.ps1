# ResQ-Allocate - REST API Automated Verification Script
# Tests health probe, signin, signup, invalid credentials, and role enforcement

$baseUrl = "http://localhost:8080/api"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ResQ-Allocate Backend Authentication Verification Suite  " -ForegroundColor Cyan
Write-Host "==========================================================`n" -ForegroundColor Cyan

# Test 1: GET /api/health
Write-Host "[1/6] Testing GET /api/health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "  [PASS] Status: $($health.status) | Service: $($health.service)" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Health endpoint unreachable. Is the backend running? ($($_.Exception.Message))" -ForegroundColor Red
    exit 1
}

# Test 2: Invalid Credentials
Write-Host "`n[2/6] Testing POST /api/auth/signin with invalid password (Expect 401)..." -ForegroundColor Yellow
$badLogin = @{
    email = "admin@crisis-sync.gov"
    password = "WrongPassword999"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -Body $badLogin -ContentType "application/json"
    Write-Host "  [FAIL] Expected 401 Unauthorized but received 200 OK!" -ForegroundColor Red
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    if ($code -eq 401) {
        Write-Host "  [PASS] Correctly rejected with HTTP 401 Unauthorized" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Expected 401 but received HTTP $code ($($_.Exception.Message))" -ForegroundColor Red
    }
}

# Test 3: Sign In as Administrator
Write-Host "`n[3/6] Testing POST /api/auth/signin as ADMIN..." -ForegroundColor Yellow
$adminLogin = @{
    email = "admin@crisis-sync.gov"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -Body $adminLogin -ContentType "application/json"
    Write-Host "  [PASS] Signed in as: $($adminRes.fullName)" -ForegroundColor Green
    Write-Host "         Verified Role: $($adminRes.role)" -ForegroundColor Green
    Write-Host "         JWT Token generated: $($adminRes.token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "  [FAIL] Admin sign-in failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Enforce No Public ADMIN Registration
Write-Host "`n[4/6] Testing POST /api/auth/signup attempting ADMIN role (Expect 403 Forbidden)..." -ForegroundColor Yellow
$hackerSignup = @{
    fullName = "Malicious Operator"
    email = "hacker@evil.com"
    password = "SecretPassword123"
    role = "ADMIN"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $hackerSignup -ContentType "application/json"
    Write-Host "  [FAIL] Security vulnerability: User successfully self-assigned ADMIN role!" -ForegroundColor Red
} catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    if ($code -eq 403) {
        Write-Host "  [PASS] Correctly rejected privilege escalation with HTTP 403 Forbidden" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Expected 403 but received HTTP $code ($($_.Exception.Message))" -ForegroundColor Red
    }
}

# Test 5: Valid Self-Registration as COORDINATOR
Write-Host "`n[5/6] Testing POST /api/auth/signup with valid COORDINATOR role..." -ForegroundColor Yellow
$randId = Get-Random -Minimum 1000 -Maximum 9999
$newEmail = "officer$randId@crisis-sync.gov"
$validSignup = @{
    fullName = "Officer Sarah Jenkins"
    email = $newEmail
    password = "OfficerPass@123"
    role = "COORDINATOR"
} | ConvertTo-Json

try {
    $signupRes = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -Body $validSignup -ContentType "application/json"
    Write-Host "  [PASS] Account created: $($signupRes.fullName) ($($signupRes.role))" -ForegroundColor Green
    Write-Host "         JWT Token: $($signupRes.token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "  [FAIL] Registration failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Sign In with Newly Created Account
Write-Host "`n[6/6] Testing POST /api/auth/signin with newly created account..." -ForegroundColor Yellow
$newLogin = @{
    email = $newEmail
    password = "OfficerPass@123"
} | ConvertTo-Json

try {
    $newLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -Body $newLogin -ContentType "application/json"
    Write-Host "  [PASS] Successfully authenticated new user: $($newLoginRes.email)" -ForegroundColor Green
    Write-Host "         Verified Role: $($newLoginRes.role)" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Sign-in with new account failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " All Automated Authentication Checks Completed!           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
