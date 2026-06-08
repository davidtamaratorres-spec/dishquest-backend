# run-seed.ps1 — Ejecuta seed.js con DATABASE_URL de producción
# La URL nunca se guarda en disco.

Set-Location $PSScriptRoot

# Intenta obtener DATABASE_URL desde el entorno actual
$dbUrl = $env:DATABASE_URL

# Si no está, intenta con Render CLI
if (-not $dbUrl) {
    if (Get-Command "render" -ErrorAction SilentlyContinue) {
        Write-Host "🔍 Intentando obtener DATABASE_URL desde Render CLI..." -ForegroundColor Cyan
        try {
            $dbUrl = render env get DATABASE_URL 2>$null
        } catch {}
    }
}

# Si todavía no está, pedir al usuario que la pegue
if (-not $dbUrl) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "  No se encontró DATABASE_URL en el entorno." -ForegroundColor Yellow
    Write-Host "  Encuéntrala en: Render Dashboard → tu servicio → Environment" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    $dbUrl = Read-Host "  Pega aquí tu DATABASE_URL (no se guardará en disco)"
    Write-Host ""
}

if (-not $dbUrl -or $dbUrl.Trim() -eq "") {
    Write-Host "❌ DATABASE_URL vacía. Abortando." -ForegroundColor Red
    exit 1
}

# Validar que parece una URL de Postgres
if ($dbUrl -notmatch "^postgres") {
    Write-Host "⚠️  Advertencia: la URL no empieza con 'postgres'. ¿Estás seguro?" -ForegroundColor Yellow
}

# Setear como variable de entorno temporal (solo este proceso)
$env:DATABASE_URL = $dbUrl.Trim()

Write-Host "🚀 Ejecutando seed.js contra producción..." -ForegroundColor Green
Write-Host ""

node "$PSScriptRoot\seed.js"
$exitCode = $LASTEXITCODE

# Limpiar la variable del entorno del proceso
$env:DATABASE_URL = ""
Remove-Variable -Name dbUrl -ErrorAction SilentlyContinue

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Seed ejecutado correctamente." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ El seed falló con código $exitCode." -ForegroundColor Red
    exit $exitCode
}
