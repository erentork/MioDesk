[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = $PSScriptRoot

function Write-Step([string]$Text) {
    Write-Host "`n==> $Text" -ForegroundColor Cyan
}

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "'$Name' bulunamadı. Kurulumu kontrol edip tekrar deneyin."
    }
}

Push-Location $Root
try {
    Write-Step "Gerekli araçlar kontrol ediliyor"
    Require-Command "dotnet"
    Require-Command "node"
    Require-Command "npm"
    Require-Command "docker"

    Write-Host "dotnet: $(dotnet --version)"
    Write-Host "node:   $(node --version)"
    Write-Host "npm:    $(npm --version)"
    Write-Host "docker: $(docker --version)"

    Write-Step "PostgreSQL Docker konteyneri başlatılıyor"
    docker compose up -d database
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose başlatılamadı." }

    Write-Host "Veritabanının hazır olması bekleniyor" -NoNewline
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 2
        $status = docker inspect --format "{{.State.Health.Status}}" miodesk-postgres 2>$null
        if ($status -eq "healthy") { $ready = $true; break }
        Write-Host "." -NoNewline
    }
    Write-Host ""
    if (-not $ready) {
        throw "PostgreSQL zamanında hazır olmadı. 'docker logs miodesk-postgres' ile logları kontrol edin."
    }

    Write-Step ".NET paketleri geri yükleniyor"
    dotnet restore "$Root\MioDesk.sln"
    if ($LASTEXITCODE -ne 0) { throw ".NET paketleri geri yüklenemedi." }

    Write-Step "Frontend paketleri kuruluyor"
    if (-not (Test-Path "$Root\frontend\.env")) {
        Copy-Item "$Root\frontend\.env.example" "$Root\frontend\.env"
    }

    Push-Location "$Root\frontend"
    try {
        npm install
        if ($LASTEXITCODE -ne 0) { throw "Frontend paketleri kurulamadı." }
    }
    finally {
        Pop-Location
    }

    Write-Step "Proje derlenerek doğrulanıyor"
    dotnet build "$Root\MioDesk.sln" --no-restore
    if ($LASTEXITCODE -ne 0) { throw "Backend derlenemedi." }

    Push-Location "$Root\frontend"
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Frontend derlenemedi." }
    }
    finally {
        Pop-Location
    }

    Write-Step "Kurulum tamamlandı"
    Write-Host "Projeyi başlatmak için:" -ForegroundColor Green
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\start.ps1"
    Write-Host "Demo hesap: demo@miodesk.local / Demo123!"
}
finally {
    Pop-Location
}
