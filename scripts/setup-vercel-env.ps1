# Sube las variables de entorno de .env a Vercel (produccion + preview).
# Uso:  npm run vercel:env
#
# Lee los valores de .env local y los manda a Vercel. Dos diferencias a proposito:
#   - MONGODB_URI se reescribe a formato SRV (Vercel corre Linux y resuelve SRV bien;
#     los shards directos del .env son el workaround del bug de DNS en Windows).
#   - La base de datos apunta a produccion, no a la de desarrollo del .env.

$PROD_DB  = 'reporte-tecnico'                 # produccion (local usa -dev)
$SRV_HOST = 'cluster0.astms5i.mongodb.net'
$ENV_FILE = Join-Path $PSScriptRoot '..\.env'

# --- parseo: aqui si queremos que un error corte el script ---
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ENV_FILE)) { throw "No se encontro .env en $ENV_FILE" }

$vals = @{}
foreach ($line in Get-Content $ENV_FILE) {
  if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
  $i = $line.IndexOf('=')
  $vals[$line.Substring(0, $i).Trim()] = $line.Substring($i + 1).Trim()
}

$localUri = $vals['MONGODB_URI']
if ($localUri -notmatch '^mongodb://([^@]+)@') { throw 'MONGODB_URI del .env no tiene el formato esperado.' }
$creds  = $Matches[1]
$srvUri = "mongodb+srv://$creds@$SRV_HOST/$PROD_DB" + '?retryWrites=true&w=majority'

$toPush = [ordered]@{
  MONGODB_URI          = $srvUri
  JWT_SECRET           = $vals['JWT_SECRET']
  NODE_ENV             = 'production'
  SEED_USERNAME        = $vals['SEED_USERNAME']
  SEED_PASSWORD        = $vals['SEED_PASSWORD']
  SEED_DISPLAY_NAME    = $vals['SEED_DISPLAY_NAME']
  SEED_EMPLOYEE_NUMBER = $vals['SEED_EMPLOYEE_NUMBER']
}

# --- llamadas al CLI ---
# Vercel CLI escribe su banner por stderr. En PowerShell 5.1, redirigir stderr de un .exe
# (2>&1) envuelve cada linea en un ErrorRecord y dispara NativeCommandError aunque el exit
# code sea 0. Por eso: nada de 2>&1, y el exito se mide con $LASTEXITCODE, no con $?.
$ErrorActionPreference = 'Continue'

# Pre-flight: sin sesion, los 14 add fallan con un exit 1 identico y sin pista.
# Ojo: una consola abierta "como Administrador" usa otro perfil y NO hereda el login.
Write-Host "Verificando sesion de Vercel..." -ForegroundColor Cyan
$quien = (npx vercel whoami 2>$null | Select-Object -Last 1)
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "No hay sesion de Vercel en esta terminal." -ForegroundColor Red
  Write-Host "Corre primero:  npx vercel login" -ForegroundColor Yellow
  Write-Host "(Si abriste PowerShell como Administrador, prueba en una terminal normal.)" -ForegroundColor Yellow
  exit 1
}
Write-Host "Sesion activa: $quien" -ForegroundColor Green

$fallos = 0
$errFile = [System.IO.Path]::GetTempFileName()
foreach ($target in @('production', 'preview')) {
  Write-Host ""
  Write-Host "== $target ==" -ForegroundColor Cyan
  foreach ($k in $toPush.Keys) {
    $v = $toPush[$k]
    if ([string]::IsNullOrWhiteSpace($v)) {
      Write-Host "  [omitido] $k (vacio en .env)" -ForegroundColor Yellow
      continue
    }
    # stderr va a archivo (no a 2>&1, que en PS 5.1 dispara NativeCommandError)
    # para poder mostrar la causa real si algo falla.
    $v | npx vercel env add $k $target --force 2>$errFile | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  [ok] $k" -ForegroundColor Green
    } else {
      Write-Host "  [FALLO] $k (exit $LASTEXITCODE)" -ForegroundColor Red
      $motivo = (Get-Content $errFile -ErrorAction SilentlyContinue |
                 Where-Object { $_ -and $_ -notmatch 'Vercel CLI' } | Select-Object -First 2)
      foreach ($m in $motivo) { Write-Host "         $m" -ForegroundColor DarkGray }
      $fallos++
    }
  }
}
Remove-Item $errFile -ErrorAction SilentlyContinue

Write-Host ""
if ($fallos -gt 0) {
  Write-Host "Terminado con $fallos fallo(s)." -ForegroundColor Red
} else {
  Write-Host "Listo, las 14 variables (7 x 2 entornos) quedaron cargadas." -ForegroundColor Green
}
Write-Host "Vercel oculta los valores; solo se listan los nombres:" -ForegroundColor Cyan
npx vercel env ls
