<# Deploy Notāre to Cloud Run using deployment.ini (git-ignored) #>

param(
    [string]$ConfigPath = "../deployment.ini"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$iniPath = Join-Path $scriptDir $ConfigPath
if (-not (Test-Path $iniPath)) {
    Write-Error "deployment.ini not found at '$iniPath'. Create it from deployment.sample.ini or specify -ConfigPath."; return
}

# Parse key=value lines into hashtable
$cfg = @{}
Get-Content $iniPath | ForEach-Object {
    if ($_ -match '^[\s]*([^#=]+?)\s*=\s*(.+)$') {
        $cfg[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$service = $cfg['SERVICE_NAME']
$region  = $cfg['REGION']
$memory  = $cfg['MEMORY']
$cpu     = $cfg['CPU']
$project = $cfg['PROJECT_ID']

$required = @('SERVICE_NAME','REGION','PROJECT_ID')
foreach ($k in $required) {
    if (-not $cfg[$k]) { Write-Error "Missing '$k' in deployment.ini"; return }
}

Write-Host "Deploying $service to $region…" -ForegroundColor Cyan

# Detect active account
$activeAcct = gcloud auth list --filter="status=ACTIVE" --format="value(account)"
if (-not $activeAcct) {
    Write-Host "No active gcloud account detected." -ForegroundColor Yellow
    $loginAns = Read-Host "Start login flow now? (y/N)"
    if ($loginAns -in @('y','Y')) {
        Write-Host "Running 'gcloud auth login --no-launch-browser' (copy URL to browser)…" -ForegroundColor Yellow
        & gcloud auth login --no-launch-browser
        $activeAcct = gcloud auth list --filter="status=ACTIVE" --format="value(account)"
        if (-not $activeAcct) { Write-Error "Authentication failed. Aborting."; return }
    } else {
        Write-Host "Deployment cancelled."; return
    }
}
$activeProj = gcloud config get-value project --quiet
Write-Host "Active gcloud account : $activeAcct" -ForegroundColor Green
Write-Host "Active gcloud project : $activeProj" -ForegroundColor Green

$account = $cfg['ACCOUNT']
if ($account -and ($activeAcct -ne $account)) {
    Write-Warning "deployment.ini ACCOUNT ($account) differs from active gcloud account ($activeAcct)."
    $acctAns = Read-Host "Switch to $account? (y/N)"
    if ($acctAns -in @('y','Y')) { & gcloud config set account $account | Out-Null } else { Write-Host "Cancelled."; return }
}

if ($activeProj -ne $project) {
    Write-Warning "deployment.ini PROJECT_ID ($project) differs from active gcloud project ($activeProj)."
    $projAns = Read-Host "Switch project to $project? (y/N)"
    if ($projAns -in @('y','Y')) { & gcloud config set project $project | Out-Null } else { Write-Host "Cancelled."; return }
}

# Calculate repo root and gcloudArgs early
$repoRoot  = Resolve-Path (Join-Path $scriptDir '..')
$sizeMB    = [Math]::Round(((Get-ChildItem -Recurse -Force -EA SilentlyContinue $repoRoot | Measure-Object Length -Sum).Sum / 1MB),1)

$gcloudArgs = @('run','deploy',$service,'--source',$repoRoot,'--region',$region,'--project',$project,'--memory',$memory,'--cpu',$cpu)
if ($port)   { $gcloudArgs += @('--port',$port) }
if ($unauth -eq 'true') { $gcloudArgs += '--allow-unauthenticated' }

Write-Host "\nSource directory : $repoRoot" -ForegroundColor Cyan
Write-Host "Approx upload size : $sizeMB MB" -ForegroundColor Cyan
Write-Host "gcloud command    : gcloud $($gcloudArgs -join ' ')" -ForegroundColor Yellow

$answer = Read-Host "\nProceed with deployment? (y/N)"
if ($answer -notin @('y','Y')) { Write-Host "Deployment cancelled."; return }

# Public unauth confirm
if ($cfg['ALLOW_UNAUTH'] -eq 'true') {
    $unauthConfirm = Read-Host "WARNING: Service will be publicly accessible (allow-unauthenticated). Continue? (y/N)"
    if ($unauthConfirm -notin @('y','Y')) { Write-Host "Deployment cancelled."; return }
}

$port    = $cfg['PORT']
$unauth  = $cfg['ALLOW_UNAUTH']

# Determine repo root (parent of script dir)
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
Write-Host "Source directory resolved to $repoRoot" -ForegroundColor Green
Write-Host "Using source directory: $repoRoot" -ForegroundColor Cyan
$size = (Get-ChildItem -Recurse -Force -ErrorAction SilentlyContinue $repoRoot | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("Approx upload size: {0:N1} MB" -f $size) -ForegroundColor Cyan

$gcloudArgs = @('run','deploy',$service,'--source',$repoRoot,'--region',$region,'--project',$project,'--memory',$memory,'--cpu',$cpu)
if ($port)   { $gcloudArgs += @('--port',$port) }
if ($unauth -eq 'true') { $gcloudArgs += '--allow-unauthenticated' }

Write-Host "\nRunning gcloud command:" -ForegroundColor Yellow
Write-Host "gcloud $($gcloudArgs -join ' ')" -ForegroundColor Yellow
Write-Host "\n=== Uploading sources → Build → Deploy ===" -ForegroundColor Green

& gcloud @gcloudArgs