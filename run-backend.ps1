# ResQ-Allocate - Emergency Command & Control Center Backend Launcher
# Runs the Spring Boot REST API on port 8080 with Java 21/25

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ResQ-Allocate - Starting Spring Boot Backend Service     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check and Configure Java installation (Java 21/25 required)
$modernJdkCandidates = @(
    "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot",
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Java\jdk-21*"
)
foreach ($candidate in $modernJdkCandidates) {
    $found = Resolve-Path $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found -and (Test-Path (Join-Path $found.Path "bin\java.exe"))) {
        $env:JAVA_HOME = $found.Path
        $env:Path = "$($found.Path)\bin;$env:Path"
        break
    }
}

try {
    $javaVersion = & java -version 2>&1
    Write-Host "[+] Java Runtime detected:" -ForegroundColor Green
    $javaVersion | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} catch {
    Write-Error "Java is not installed or not in PATH. Please install Java 21 or newer."
    exit 1
}

# 2. Check for Maven
$mvnCmd = "mvn"
$hasMaven = (Get-Command mvn -ErrorAction SilentlyContinue)

if (-not $hasMaven) {
    $toolsDir = Join-Path $PSScriptRoot ".tools"
    $mavenHome = Join-Path $toolsDir "apache-maven-3.9.9"
    $localMvn = Join-Path $mavenHome "bin\mvn.cmd"

    if (Test-Path $localMvn) {
        $mvnCmd = $localMvn
        Write-Host "[+] Using local portable Maven at: $mvnCmd" -ForegroundColor Green
    } else {
        Write-Host "[!] 'mvn' is not installed in system PATH." -ForegroundColor Yellow
        Write-Host "[*] Downloading standalone Apache Maven 3.9.9 (one-time setup)..." -ForegroundColor Yellow

        if (-not (Test-Path $toolsDir)) {
            New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
        }

        $zipPath = Join-Path $toolsDir "maven.zip"
        $mavenUrls = @(
            "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip",
            "https://dlcdn.apache.org/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip"
        )

        $downloadSuccess = $false
        foreach ($url in $mavenUrls) {
            try {
                [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                Write-Host "[*] Fetching from $url..." -ForegroundColor Gray
                Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -TimeoutSec 60
                Write-Host "[+] Download complete. Extracting..." -ForegroundColor Green
                Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
                Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
                $mvnCmd = $localMvn
                Write-Host "[+] Portable Maven configured successfully." -ForegroundColor Green
                $downloadSuccess = $true
                break
            } catch {
                Write-Host "[!] Mirror failed: $_" -ForegroundColor Yellow
            }
        }

        if (-not $downloadSuccess) {
            Write-Error "Failed to download Maven from all mirrors."
            Write-Host "Please install Apache Maven manually or run with an existing mvn installation." -ForegroundColor Red
            exit 1
        }
    }
}

# 3. Check and Ensure XAMPP MariaDB / MySQL is running on port 3306
$mysqlPort3306 = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $mysqlPort3306) {
    Write-Host "[!] MariaDB/MySQL service is not running on port 3306." -ForegroundColor Yellow
    $xamppMysqld = "C:\xampp\mysql\bin\mysqld.exe"
    $xamppIni = "C:\xampp\mysql\bin\my.ini"

    if ((Test-Path $xamppMysqld) -and (Test-Path $xamppIni)) {
        Write-Host "[*] Automatically starting XAMPP MariaDB service..." -ForegroundColor Cyan
        Start-Process -FilePath $xamppMysqld -ArgumentList "--defaults-file=`"$xamppIni`" --standalone" -WorkingDirectory "C:\xampp\mysql" -WindowStyle Hidden
        $retries = 15
        while ($retries -gt 0) {
            Start-Sleep -Seconds 1
            $mysqlPort3306 = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($mysqlPort3306) {
                Write-Host "[+] XAMPP MariaDB started successfully on port 3306." -ForegroundColor Green
                break
            }
            $retries--
        }
        if (-not $mysqlPort3306) {
            Write-Host "[!] Warning: MariaDB failed to respond on port 3306 within 15 seconds. Please start MySQL from the XAMPP Control Panel." -ForegroundColor Red
        }
    } else {
        Write-Host "[!] Warning: XAMPP MariaDB executable not found at '$xamppMysqld'. Ensure MySQL is running on port 3306." -ForegroundColor Red
    }
} else {
    Write-Host "[+] MariaDB / MySQL is active and listening on port 3306." -ForegroundColor Green
}

# 4. Check for existing processes on port 8080 to prevent startup collisions
$existingPort8080 = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingPort8080) {
    $existingPid = $existingPort8080.OwningProcess
    $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    Write-Host "[!] Port 8080 is already in use by process: $($proc.ProcessName) (PID: $existingPid)" -ForegroundColor Yellow
    if ($proc.ProcessName -match "java") {
        Write-Host "[*] Terminating previous Spring Boot Java process (PID: $existingPid) to release port 8080..." -ForegroundColor Yellow
        Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "[+] Port 8080 released successfully." -ForegroundColor Green
    } else {
        Write-Host "[!] Warning: Non-Java process '$($proc.ProcessName)' is holding port 8080." -ForegroundColor Red
    }
}

# 5. Launch Spring Boot application
Write-Host "`n[*] Starting Spring Boot application on http://localhost:8080..." -ForegroundColor Cyan
Write-Host "[*] Press Ctrl+C at any time to stop the server.`n" -ForegroundColor Gray

& $mvnCmd spring-boot:run
