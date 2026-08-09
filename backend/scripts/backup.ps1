param(
    [string]$Destino = "$PSScriptRoot\..\backups",
    [int]$RetencaoDias = 14
)

$pastaDestino = [System.IO.Path]::GetFullPath($Destino)
New-Item -ItemType Directory -Force -Path $pastaDestino | Out-Null
$arquivo = Join-Path $pastaDestino ("listaweb_{0}.dump" -f (Get-Date -Format "yyyyMMdd_HHmmss"))

& pg_dump --format=custom --file=$arquivo `
    --host=$env:DB_HOST --port=$env:DB_PORT --username=$env:DB_USER $env:DB_NAME

if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar backup do banco." }

Get-ChildItem -LiteralPath $pastaDestino -Filter "listaweb_*.dump" -File |
    Where-Object LastWriteTime -lt (Get-Date).AddDays(-$RetencaoDias) |
    Remove-Item -Force

Write-Output "Backup criado em $arquivo"
