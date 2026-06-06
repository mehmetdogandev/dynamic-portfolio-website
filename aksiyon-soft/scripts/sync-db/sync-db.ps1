#Requires -Version 5.1
<#
.SYNOPSIS
  Yerel DB reset (POSTGRES_DB) + ssh aksiyon1 uzak pg_dump / scp + redis + pnpm db:push / db:seed
#>

$ScriptDir = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path
$EnvFile = Join-Path $RepoRoot '.env'

function Write-BannerLine {
  param([string]$Text)
  Write-Host $Text -ForegroundColor Cyan
}

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Dosya bulunamadi: $Path (kök .env gerekli)"
  }
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.TrimEnd()
    if ($line -match '^\s*#' -or $line -match '^\s*$') { return }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $key = $Matches[1]
      $val = $Matches[2].Trim()
      if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
        $val = $val.Substring(1, $val.Length - 2)
      }
      Set-Item -Path "Env:$key" -Value $val
    }
  }
}

function Get-EnvOrEmpty {
  param([string]$Name)
  $v = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ($null -eq $v) { return '' }
  return $v
}

function Get-StepChoice {
  param(
    [string]$StepTitle,
    [string]$StepDetail
  )
  if ($script:SyncDbAutoRunRest) { return 'run' }
  if ($script:SyncDbAutoSkipRest) { return 'skip' }
  while ($true) {
    Write-Host ''
    Write-Host '----------------------------------------' -ForegroundColor DarkGray
    Write-Host $StepTitle -ForegroundColor Yellow
    if ($StepDetail) { Write-Host $StepDetail }
    Write-Host '  [1] Bu adimi calistir (sonrakilerde tekrar sor)' -ForegroundColor Green
    Write-Host '  [2] Bu adimi atla (sonrakilerde tekrar sor)' -ForegroundColor DarkYellow
    Write-Host '  [3] Tum islemi iptal et' -ForegroundColor Red
    Write-Host '  [4] Bu adimi calistir; sonraki tum adimlari sorulmadan calistir' -ForegroundColor Cyan
    Write-Host '  [5] Bu adimi calistir; sonraki tum adimlari sorulmadan atla' -ForegroundColor DarkYellow
    $c = Read-Host 'Seciminiz (1-5)'
    switch ($c) {
      '1' { return 'run' }
      '2' { return 'skip' }
      '3' { return 'abort' }
      '4' {
        $script:SyncDbAutoRunRest = $true
        Write-Host '[OK] Bu adim ve sonrasindaki tum adimlar sorulmadan calistirilacak.' -ForegroundColor Cyan
        return 'run'
      }
      '5' {
        $script:SyncDbAutoSkipRest = $true
        Write-Host '[OK] Bu adim calistirilacak; sonraki adimlar sorulmadan atlanacak.' -ForegroundColor DarkYellow
        return 'run'
      }
      default { Write-Host 'Gecersiz. 1-5 arasi girin.' -ForegroundColor Red }
    }
  }
}

function Invoke-Checked {
  param(
    [string]$Label,
    [scriptblock]$Action
  )
  Write-Host ">> $Label" -ForegroundColor DarkCyan
  & $Action
  $exit = $LASTEXITCODE
  if ($null -ne $exit -and $exit -ne 0) {
    throw "[ERR] Komut basarisiz (exit $exit): $Label"
  }
}

function Invoke-RedisFlush {
  param([string]$ComposeAbs)
  $rp = Get-EnvOrEmpty -Name 'REDIS_PASSWORD'
  if ([string]::IsNullOrWhiteSpace($rp)) {
    docker compose -f $ComposeAbs exec -T redis redis-cli FLUSHALL
  } else {
    docker compose -f $ComposeAbs exec -T redis redis-cli -a $rp FLUSHALL
  }
}

try {
  Write-BannerLine '========================================'
  Write-BannerLine ' AKSIYON SOFT DB RESET + REMOTE SYNC'
  Write-BannerLine '========================================'
  Write-Host ''

  Import-DotEnv -Path $EnvFile

  # ssh aksiyon1 / scp aksiyon1 — Host "aksiyon1" ~/.ssh/config icinde
  $SshTarget = 'aksiyon1'
  $rpc = Get-EnvOrEmpty -Name 'SYNC_REMOTE_PG_CONTAINER'
  if ([string]::IsNullOrWhiteSpace($rpc)) {
    $remotePgContainer = 'aksiyon-soft-postgres-1'
  } else {
    $remotePgContainer = $rpc.Trim()
  }
  $localComposeFile = 'docker-compose.dev.yml'
  $LocalComposeAbs = Join-Path $RepoRoot $localComposeFile
  if (-not (Test-Path -LiteralPath $LocalComposeAbs)) {
    throw "Compose dosyasi yok: $LocalComposeAbs"
  }

  $dbRaw = Get-EnvOrEmpty -Name 'POSTGRES_DB'
  if ([string]::IsNullOrWhiteSpace($dbRaw)) {
    $dbName = 'aksiyonsoft'
  } else {
    $dbName = $dbRaw.Trim()
    if ([string]::IsNullOrWhiteSpace($dbName)) {
      $dbName = 'aksiyonsoft'
    }
  }

  Write-Host 'SSH hedefi: aksiyon1 (~/.ssh/config Host)' -ForegroundColor Yellow
  Write-Host "Yerel compose: $localComposeFile | Uzak PG container: $remotePgContainer | DB: $dbName (.env POSTGRES_DB)" -ForegroundColor DarkGray
  Write-Host ''
  Write-Host "[OK] Uzak: ssh/scp $SshTarget" -ForegroundColor Green
  Write-Host ''

  $backupPath = Join-Path $RepoRoot 'backup.sql'
  $skipped = [System.Collections.Generic.List[string]]::new()
  $script:SyncDbAutoRunRest = $false
  $script:SyncDbAutoSkipRest = $false

  # --- Adim 1 ---
  $d1 = Get-StepChoice -StepTitle "ADIM 1: Yerel veritabanini sifirla (DROP + CREATE $dbName)" -StepDetail ''
  if ($d1 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d1 -eq 'skip') {
    $skipped.Add('Adim 1 (local DB reset)')
    Write-Host '[SKIP] Adim 1 atlandi.' -ForegroundColor DarkYellow
  } else {
    Invoke-Checked 'DROP DATABASE' {
      docker compose -f $LocalComposeAbs exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS `"$dbName`";"
    }
    Invoke-Checked 'CREATE DATABASE' {
      docker compose -f $LocalComposeAbs exec -T postgres psql -U postgres -c "CREATE DATABASE `"$dbName`";"
    }
    Write-Host '[OK] Yerel DB yeniden olusturuldu.' -ForegroundColor Green
  }

  # --- Adim 2 ---
  $d2 = Get-StepChoice -StepTitle 'ADIM 2: Uzak sunucuda pg_dump (backup.sql)' -StepDetail "ssh $SshTarget"
  if ($d2 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d2 -eq 'skip') {
    $skipped.Add('Adim 2 (remote pg_dump)')
    Write-Host '[SKIP] Adim 2 atlandi.' -ForegroundColor DarkYellow
  } else {
    Invoke-Checked 'Remote pg_dump' {
      ssh $SshTarget "docker exec -t $remotePgContainer pg_dump -U postgres -d $dbName -F p > backup.sql"
    }
    Write-Host '[OK] Uzak yedek alindi.' -ForegroundColor Green
  }

  # --- Adim 3 ---
  $d3 = Get-StepChoice -StepTitle 'ADIM 3: backup.sql dosyasini yerine cek (scp)' -StepDetail "scp ${SshTarget}:backup.sql"
  if ($d3 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d3 -eq 'skip') {
    $skipped.Add('Adim 3 (scp)')
    Write-Host '[SKIP] Adim 3 atlandi.' -ForegroundColor DarkYellow
  } else {
    Invoke-Checked 'SCP backup' { scp "${SshTarget}:backup.sql" $backupPath }
    Write-Host '[OK] backup.sql yerelde.' -ForegroundColor Green
  }

  # --- Adim 4 ---
  $d4 = Get-StepChoice -StepTitle "ADIM 4: Yerel restore (backup.sql -> $dbName)" -StepDetail ''
  if ($d4 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d4 -eq 'skip') {
    $skipped.Add('Adim 4 (restore)')
    Write-Host '[SKIP] Adim 4 atlandi.' -ForegroundColor DarkYellow
  } else {
    if (-not (Test-Path -LiteralPath $backupPath)) {
      throw "[ERR] backup.sql bulunamadi: $backupPath (Adim 2 ve 3 gerekli)"
    }
    Invoke-Checked 'Local restore' {
      Get-Content -LiteralPath $backupPath -Raw | docker compose -f $LocalComposeAbs exec -T postgres psql -U postgres -d $dbName -v ON_ERROR_STOP=1
    }
    Write-Host '[OK] Restore tamamlandi.' -ForegroundColor Green
  }

  # --- Adim 5 ---
  $d5 = Get-StepChoice -StepTitle 'ADIM 5: Uzak sunucuda backup.sql sil' -StepDetail "ssh $SshTarget rm ~/backup.sql"
  if ($d5 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d5 -eq 'skip') {
    $skipped.Add('Adim 5 (remote rm)')
    Write-Host '[SKIP] Adim 5 atlandi.' -ForegroundColor DarkYellow
  } else {
    Invoke-Checked 'Remote rm backup' { ssh $SshTarget "rm -f ~/backup.sql" }
    Write-Host '[OK] Uzak backup silindi.' -ForegroundColor Green
  }

  # --- Adim 6 ---
  $d6 = Get-StepChoice -StepTitle 'ADIM 6: Yerel backup.sql sil' -StepDetail ''
  if ($d6 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d6 -eq 'skip') {
    $skipped.Add('Adim 6 (local del backup)')
    Write-Host '[SKIP] Adim 6 atlandi.' -ForegroundColor DarkYellow
  } else {
    if (Test-Path -LiteralPath $backupPath) { Remove-Item -LiteralPath $backupPath -Force }
    Write-Host '[OK] Yerel backup silindi.' -ForegroundColor Green
  }

  # --- Adim 7 ---
  $d8 = Get-StepChoice -StepTitle 'ADIM 7: Redis FLUSHALL' -StepDetail ''
  if ($d8 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d8 -eq 'skip') {
    $skipped.Add('Adim 7 (redis flush)')
    Write-Host '[SKIP] Adim 7 atlandi.' -ForegroundColor DarkYellow
  } else {
    Invoke-Checked 'Redis flush' { Invoke-RedisFlush -ComposeAbs $LocalComposeAbs }
    Write-Host '[OK] Redis temizlendi.' -ForegroundColor Green
  }

  # --- Adim 8 ---
  $d9 = Get-StepChoice -StepTitle 'ADIM 8: pnpm db:push' -StepDetail "Dizin: $RepoRoot"
  if ($d9 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d9 -eq 'skip') {
    $skipped.Add('Adim 8 (db:push)')
    Write-Host '[SKIP] Adim 8 atlandi.' -ForegroundColor DarkYellow
  } else {
    Push-Location $RepoRoot
    try {
      Invoke-Checked 'pnpm db:push' { pnpm db:push }
    } finally {
      Pop-Location
    }
    Write-Host '[OK] db:push tamamlandi.' -ForegroundColor Green
  }

  # --- Adim 9 ---
  $d10 = Get-StepChoice -StepTitle 'ADIM 9: pnpm db:seed' -StepDetail ''
  if ($d10 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d10 -eq 'skip') {
    $skipped.Add('Adim 9 (db:seed)')
    Write-Host '[SKIP] Adim 9 atlandi.' -ForegroundColor DarkYellow
  } else {
    Push-Location $RepoRoot
    try {
      Invoke-Checked 'pnpm db:seed' { pnpm db:seed }
    } finally {
      Pop-Location
    }
    Write-Host '[OK] db:seed tamamlandi.' -ForegroundColor Green
  }

  # --- Adim 10 ---
  $d11 = Get-StepChoice -StepTitle 'ADIM 10: Redis FLUSHALL (post-seed)' -StepDetail ''
  if ($d11 -eq 'abort') { Write-Host '[ABORT] Kullanici iptal etti.' -ForegroundColor Red; exit 2 }
  if ($d11 -eq 'skip') {
    $skipped.Add('Adim 10 (redis final)')
    Write-Host '[SKIP] Adim 10 atlandi.' -ForegroundColor DarkYellow
  } else {
    Invoke-Checked 'Redis final flush' { Invoke-RedisFlush -ComposeAbs $LocalComposeAbs }
    Write-Host '[OK] Redis final temizlendi.' -ForegroundColor Green
  }

  Write-BannerLine '========================================'
  Write-Host '[OK] Is akisi tamamlandi.' -ForegroundColor Green
  if ($skipped.Count -gt 0) {
    Write-Host ''
    Write-Host 'Atlanan adimlar:' -ForegroundColor DarkYellow
    $skipped | ForEach-Object { Write-Host "  - $_" }
  }
  Write-BannerLine '========================================'
  exit 0
} catch {
  Write-Host ''
  Write-Host "[ERR] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
