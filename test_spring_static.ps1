$wc = New-Object System.Net.WebClient
try {
    $html = $wc.DownloadString("http://localhost:8080/frontend/index.html")
    Write-Host "Spring Boot served /frontend/index.html! Length: $($html.Length) chars" -ForegroundColor Green
} catch {
    Write-Host "Failed to get /frontend/index.html from Spring Boot: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $rootHtml = $wc.DownloadString("http://localhost:8080/index.html")
    Write-Host "Spring Boot served /index.html! Length: $($rootHtml.Length) chars" -ForegroundColor Green
} catch {
    Write-Host "Failed to get /index.html from Spring Boot: $($_.Exception.Message)" -ForegroundColor Red
}
