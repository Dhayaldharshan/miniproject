# Inspect users table in MariaDB via MySQL command line if available or through Spring Boot
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
if (Test-Path $mysqlPath) {
    & $mysqlPath -u root -e "USE resq_allocate; SELECT id, email, full_name, role, password_hash FROM users;"
} else {
    Write-Host "MySQL CLI not found at $mysqlPath. Trying mysql in PATH..."
    mysql -u root -e "USE resq_allocate; SELECT id, email, full_name, role, password_hash FROM users;"
}
