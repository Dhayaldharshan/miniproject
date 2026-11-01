$path = "C:\Users\hemad\.gemini\antigravity-ide\brain\19071129-92e8-44bf-8720-cafd9e5e1f2f\.system_generated\logs\transcript.jsonl"
$lines = Get-Content $path
for ($i = 1235; $i -lt [Math]::Min(1250, $lines.Length); $i++) {
    Write-Host "--- LINE $i ---"
    Write-Host $lines[$i].Substring(0, [Math]::Min(300, $lines[$i].Length))
}
