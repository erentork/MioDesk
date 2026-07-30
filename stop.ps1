[CmdletBinding()]
param(
    [switch]$KeepDatabase
)

$ErrorActionPreference = "SilentlyContinue"
$Root = $PSScriptRoot

foreach ($port in @(5088, 5173)) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen
    foreach ($connection in $connections) {
        Stop-Process -Id $connection.OwningProcess -Force
    }
}

if (-not $KeepDatabase) {
    Push-Location $Root
    docker compose stop database
    Pop-Location
}

Write-Host "MioDesk servisleri durduruldu." -ForegroundColor Yellow
