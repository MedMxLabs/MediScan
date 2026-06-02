# Copy SUPABASE_URL + SUPABASE_ANON_KEY from backend/.env → frontend/.env (VITE_*)
$backend = Join-Path $PSScriptRoot "..\backend\.env"
$frontend = Join-Path $PSScriptRoot "..\frontend\.env"

if (-not (Test-Path $backend)) {
  Write-Error "Missing backend/.env"
  exit 1
}

$url = $null
$anon = $null
Get-Content $backend | ForEach-Object {
  if ($_ -match '^SUPABASE_URL=(.+)$') { $url = $matches[1].Trim() }
  if ($_ -match '^SUPABASE_ANON_KEY=(.+)$') { $anon = $matches[1].Trim() }
}

if (-not $url -or -not $anon) {
  Write-Error "SUPABASE_URL and SUPABASE_ANON_KEY required in backend/.env"
  exit 1
}

$map = @{}
if (Test-Path $frontend) {
  Get-Content $frontend | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') { $map[$matches[1].Trim()] = $matches[2].Trim() }
  }
}
$map['VITE_SUPABASE_URL'] = $url
$map['VITE_SUPABASE_ANON_KEY'] = $anon

$map.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Set-Content $frontend -Encoding utf8
Write-Host "Updated frontend/.env with VITE_SUPABASE_*"
