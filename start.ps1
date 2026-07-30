[CmdletBinding()]
param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Push-Location $Root
try {
    Write-Host "MioDesk başlatılıyor..." -ForegroundColor Magenta
    docker compose up -d database
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL başlatılamadı." }

    $backendCommand = "Set-Location '$Root\backend\MioDesk.API'; `$Host.UI.RawUI.WindowTitle = 'MioDesk API'; dotnet run"
    $frontendCommand = "Set-Location '$Root\frontend'; `$Host.UI.RawUI.WindowTitle = 'MioDesk Web'; npm run dev"

    Start-Process powershell -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand)
    Start-Sleep -Seconds 2
    Start-Process powershell -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand)

    if (-not $NoBrowser) {
        Start-Sleep -Seconds 5
        Start-Process "http://localhost:5173"
    }

    Write-Host "Web:     http://localhost:5173" -ForegroundColor Green
    Write-Host "Swagger: http://localhost:5088/swagger" -ForegroundColor Green
}
finally {
    Pop-Location
}
