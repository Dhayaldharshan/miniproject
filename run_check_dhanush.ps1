$cpList = @()
Get-ChildItem -Path "target\classes" | ForEach-Object { $cpList += $_.FullName }
Get-ChildItem -Path "$env:USERPROFILE\.m2\repository" -Recurse -Filter "*.jar" | Where-Object { $_.Name -match "spring-security-crypto|spring-jcl" } | ForEach-Object { $cpList += $_.FullName }
$cp = ($cpList -join ";")

$javaBin = "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot\bin"
& "$javaBin\javac.exe" -cp $cp scratch\TestHashes.java
& "$javaBin\java.exe" -cp ("scratch;" + $cp) TestHashes

