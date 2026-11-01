$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$mvnCmd = Join-Path $PSScriptRoot "..\.tools\apache-maven-3.9.9\bin\mvn.cmd"
if (-not (Test-Path $mvnCmd)) {
    $mvnCmd = "mvn"
}
Write-Host "Using Java: $(& java -version 2>&1 | Select-Object -First 1)"
Write-Host "Compiling project..."
& $mvnCmd compile
Write-Host "Compile exit code: $LASTEXITCODE"
