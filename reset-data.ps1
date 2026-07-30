[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Push-Location $Root
try {
    Write-Warning "Bu işlem MioDesk veritabanındaki tüm yerel verileri silecektir."
    $answer = Read-Host "Devam etmek için EVET yazın"
    if ($answer -cne "EVET") { Write-Host "İşlem iptal edildi."; exit 0 }
    docker compose down -v
    docker compose up -d database
    Write-Host "Veritabanı sıfırlandı. API ilk açılışta demo veriyi yeniden oluşturacak." -ForegroundColor Green
}
finally { Pop-Location }
