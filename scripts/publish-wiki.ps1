# Publish wiki/ to the GitHub Wiki remote.
# Prerequisite: create the first wiki page once in the GitHub UI
#   (Wiki → Create the first page → title Home → Save).
# That creates https://github.com/MedMxLabs/MediScan.wiki.git

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$WikiSrc = Join-Path $RepoRoot "wiki"
$Tmp = Join-Path $env:TEMP "MediScan.wiki"

if (-not (Test-Path $WikiSrc)) { throw "Missing $WikiSrc" }

$token = (gh auth token).Trim()
if (-not $token) { throw "gh auth token failed — run gh auth login" }

$remote = "https://x-access-token:${token}@github.com/MedMxLabs/MediScan.wiki.git"

if (Test-Path $Tmp) { Remove-Item -Recurse -Force $Tmp }

Write-Host "Cloning wiki remote…"
try {
  git clone $remote $Tmp
} catch {
  throw @"
Could not clone the wiki remote. Create the first page in the GitHub UI first:
  https://github.com/MedMxLabs/MediScan/wiki
Then re-run: pwsh scripts/publish-wiki.ps1
"@
}

Copy-Item -Path (Join-Path $WikiSrc "*") -Destination $Tmp -Force
Push-Location $Tmp
try {
  git add -A
  $pending = git status --porcelain
  if (-not $pending) {
    Write-Host "Wiki already up to date."
    return
  }
  git -c user.email="wiki-bot@users.noreply.github.com" -c user.name="MedScan Wiki" commit -m "Sync wiki from repo wiki/ folder"
  git push origin HEAD:master
  Write-Host "Published: https://github.com/MedMxLabs/MediScan/wiki"
} finally {
  Pop-Location
}
