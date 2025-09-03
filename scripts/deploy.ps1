<# Deploy Notāre to Cloud Run using deployment.ini (git-ignored) #>

$iniPath = Resolve-Path "../deployment.ini"

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

Write-Host "Deploying $service to $region…" -ForegroundColor Cyan

# Auth check
if (-not (gcloud auth list --filter="status:ACTIVE" --format="value(account)")) {
  Write-Error "Run 'gcloud init' to authenticate with Google Cloud before deployment."; exit 1
}

$account = $cfg['ACCOUNT']
if ($account) { & gcloud config set account $account | Out-Null }

$port    = $cfg['PORT']
$unauth  = $cfg['ALLOW_UNAUTH']

$gcloudArgs = @('run','deploy',$service,'--source','..','--region',$region,'--project',$project,'--memory',$memory,'--cpu',$cpu)
if ($port)   { $gcloudArgs += @('--port',$port) }
if ($unauth -eq 'true') { $gcloudArgs += '--allow-unauthenticated' }

& gcloud @gcloudArgs