# Run MedMx mobile against local Flask backend (same as web).
# 1. Start backend: cd medscan\backend && .\venv\Scripts\python.exe run.py
# 2. Replace YOUR_PC_IP with ipconfig IPv4 (not localhost on a physical phone).

param(
    [string]$ApiUrl = "http://10.0.2.2:5000",
    [string]$ApiKey = "",
    [switch]$PhysicalDevice
)

if ($PhysicalDevice) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notlike '169.254.*'
    } | Select-Object -First 1).IPAddress
    if ($ip) { $ApiUrl = "http://${ip}:5000" }
}

Write-Host "API_BASE_URL=$ApiUrl"
Set-Location (Split-Path $PSScriptRoot -Parent)
$defines = @("--dart-define=API_BASE_URL=$ApiUrl")
if ($ApiKey) { $defines += "--dart-define=MEDSCAN_API_KEY=$ApiKey" }
flutter run @defines
