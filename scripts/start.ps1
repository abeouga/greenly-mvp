param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$expectedAssetIds = @('tree_oak', 'shrub_boxwood', 'brick_paver', 'bench_wood')

function Import-LocalDatabaseSettings {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }

  $allowedNames = @('GREENLY_DB_USER', 'GREENLY_DB_PASSWORD', 'GREENLY_DB_URL')
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*(GREENLY_DB_USER|GREENLY_DB_PASSWORD|GREENLY_DB_URL)\s*=\s*(.*?)\s*$') {
      $name = $Matches[1]
      $value = $Matches[2]
      if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[-1] -eq '"') -or ($value[0] -eq "'" -and $value[-1] -eq "'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      if ($allowedNames -contains $name -and [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name, 'Process'))) {
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
      }
    }
  }
}

function Test-LoopbackPortAvailable {
  param([int]$Port)

  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  try {
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    $listener.Stop()
  }
}

function Test-GreenlyApi {
  param([int]$Port)

  try {
    $assets = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/assets" -TimeoutSec 3
    $ids = @($assets | ForEach-Object { $_.id })
    return @($expectedAssetIds | Where-Object { $ids -notcontains $_ }).Count -eq 0
  } catch {
    return $false
  }
}

function Get-AvailablePort {
  param([int[]]$Ports)

  foreach ($port in $Ports) {
    if (Test-LoopbackPortAvailable -Port $port) { return $port }
  }
  return $null
}

function ConvertTo-EncodedPowerShellCommand {
  param([string]$Command)

  return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
}

function Start-GreenlyProcess {
  param([string]$Command)

  $encodedCommand = ConvertTo-EncodedPowerShellCommand -Command $Command
  return Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoLogo', '-NoProfile', '-EncodedCommand', $encodedCommand) `
    -WorkingDirectory $repoRoot -NoNewWindow -PassThru
}

function Stop-GreenlyProcessTree {
  param([System.Diagnostics.Process]$Process)

  if ($null -eq $Process) { return }
  try {
    if ($Process.HasExited) { return }
    $taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'
    & $taskkill /PID $Process.Id /T /F 2>$null | Out-Null
  } catch {
    Write-Warning "プロセス停止に失敗しました (PID $($Process.Id)): $($_.Exception.Message)"
  }
}

function Wait-ForGreenlyApi {
  param(
    [int]$Port,
    [System.Diagnostics.Process]$Process
  )

  for ($attempt = 0; $attempt -lt 120; $attempt++) {
    if (Test-GreenlyApi -Port $Port) { return }
    if ($script:greenlyStopRequested) { throw 'API起動待ちを中断しました。' }
    if ($Process.HasExited) {
      throw 'APIプロセスが起動中に終了しました。直前のAPIログを確認してください。'
    }
    Start-Sleep -Seconds 1
  }
  throw 'APIが120秒以内に起動しませんでした。このコンソールのAPIログを確認してください。MySQLの起動状態、GREENLY_DB_USER、GREENLY_DB_PASSWORDも確認してください。'
}

function Wait-ForGreenlyWeb {
  param(
    [int]$Port,
    [System.Diagnostics.Process]$Process
  )

  for ($attempt = 0; $attempt -lt 45; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -TimeoutSec 2 -UseBasicParsing
      if ($response.StatusCode -eq 200) { return }
    } catch { }
    if ($script:greenlyStopRequested) { throw 'Web起動待ちを中断しました。' }
    if ($Process.HasExited) {
      throw 'Webプロセスが起動中に終了しました。直前のWebログを確認してください。'
    }
    Start-Sleep -Seconds 1
  }
  throw 'Web画面が45秒以内に起動しませんでした。このコンソールのWebログを確認してください。'
}

foreach ($required in @('node.exe', 'npm.cmd', 'java.exe')) {
  if (-not (Get-Command $required -ErrorAction SilentlyContinue)) {
    throw "$required がPATH上にありません。READMEの必要環境を確認してください。"
  }
}
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules') -PathType Container)) {
  throw "JavaScript依存関係がありません。次を実行してください: npm install (場所: $repoRoot)"
}
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'backend\mvnw.cmd') -PathType Leaf)) {
  throw "Maven Wrapperが見つかりません: $repoRoot\backend\mvnw.cmd"
}

$modelDir = Join-Path $repoRoot 'frontend\public\models'
$modelFiles = @('tree-oak.glb', 'shrub-boxwood.glb', 'brick-paver.glb', 'bench-wood.glb')
if (@($modelFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $modelDir $_) -PathType Leaf) }).Count -gt 0) {
  Write-Host 'GLBが不足しているため、同梱アセットを生成します。'
  Push-Location $repoRoot
  try { npm run assets:generate } finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw '開発用GLBの生成に失敗しました。' }
}

$apiPort = $null
$reuseApi = $false
foreach ($port in @(8080, 18081, 18082)) {
  if (Test-LoopbackPortAvailable -Port $port) {
    $apiPort = $port
    break
  }
  if (Test-GreenlyApi -Port $port) {
    $apiPort = $port
    $reuseApi = $true
    break
  }
}
if ($null -eq $apiPort) {
  throw 'API用のポート(8080、18081、18082)がすべて使用中です。不要なローカルプロセスを停止して再実行してください。'
}

$webPort = Get-AvailablePort -Ports @(5173, 5174, 5175)
if ($null -eq $webPort) {
  throw 'Web用のポート(5173〜5175)がすべて使用中です。不要なローカルプロセスを停止して再実行してください。'
}

Set-Location -LiteralPath $repoRoot
$cancelHandler = $null
try {
  try { $Host.UI.RawUI.WindowTitle = 'Greenly MVP' } catch { }
  $apiProcess = $null
  $webProcess = $null
  $cancelHandler = [ConsoleCancelEventHandler]{
    param($sender, $eventArgs)
    $eventArgs.Cancel = $true
    $script:greenlyStopRequested = $true
  }
  $script:greenlyStopRequested = $false
  [Console]::add_CancelKeyPress($cancelHandler)

  if (-not $reuseApi) {
    Import-LocalDatabaseSettings -Path (Join-Path $repoRoot '.env')
    if ([string]::IsNullOrWhiteSpace($env:GREENLY_DB_USER)) { $env:GREENLY_DB_USER = 'greenly_dev' }
    if ([string]::IsNullOrWhiteSpace($env:GREENLY_DB_PASSWORD)) {
      $securePassword = Read-Host 'MySQLのGreenly開発用ユーザーパスワード' -AsSecureString
      $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
      try {
        $env:GREENLY_DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
      } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
      }
    }
    if ([string]::IsNullOrWhiteSpace($env:GREENLY_DB_PASSWORD)) {
      throw 'GREENLY_DB_PASSWORDが空です。環境変数、.env、または非表示入力で設定してください。'
    }

    $apiCommand = "`$env:SERVER_ADDRESS='127.0.0.1'; `$env:SERVER_PORT='$apiPort'; Write-Host 'Greenly API: http://127.0.0.1:$apiPort'; npm run dev:api"
    $apiProcess = Start-GreenlyProcess -Command $apiCommand
    Write-Host "API起動中: 127.0.0.1:$apiPort (PID $($apiProcess.Id))"
    Wait-ForGreenlyApi -Port $apiPort -Process $apiProcess
  } else {
    Write-Host "既存のGreenly APIを使用します: http://127.0.0.1:$apiPort"
  }

  $apiTarget = "http://127.0.0.1:$apiPort"
  $webCommand = "Remove-Item Env:GREENLY_DB_USER, Env:GREENLY_DB_PASSWORD, Env:GREENLY_DB_URL -ErrorAction SilentlyContinue; `$env:GREENLY_API_TARGET='$apiTarget'; Write-Host 'Greenly Web: http://127.0.0.1:$webPort'; npm --workspace frontend run dev -- --host 127.0.0.1 --port $webPort --strictPort"
  $webProcess = Start-GreenlyProcess -Command $webCommand
  Write-Host "Web起動中: 127.0.0.1:$webPort (PID $($webProcess.Id))"
  Wait-ForGreenlyWeb -Port $webPort -Process $webProcess

  $appUrl = "http://127.0.0.1:$webPort"
  Write-Host "起動確認完了: $appUrl"
  Write-Host "API: $apiTarget/api/assets"
  Write-Host '停止するにはこのコンソールで Ctrl+C を押してください。終了確認が出た場合はYで閉じるか、Nでログを確認します。'
  if (-not $NoBrowser) { Start-Process -FilePath $appUrl }

  while (-not $script:greenlyStopRequested) {
    if (-not [string]::IsNullOrWhiteSpace($env:GREENLY_STOP_REQUEST_PATH) -and
      (Test-Path -LiteralPath $env:GREENLY_STOP_REQUEST_PATH -PathType Leaf)) {
      Remove-Item -LiteralPath $env:GREENLY_STOP_REQUEST_PATH -Force
      $script:greenlyStopRequested = $true
      continue
    }
    if ($null -ne $apiProcess -and $apiProcess.HasExited) {
      throw "Greenly APIプロセスが終了しました (終了コード $($apiProcess.ExitCode))。"
    }
    if ($webProcess.HasExited) {
      throw "Greenly Webプロセスが終了しました (終了コード $($webProcess.ExitCode))。"
    }
    Start-Sleep -Milliseconds 400
  }
} finally {
  if ($null -ne $cancelHandler) { [Console]::remove_CancelKeyPress($cancelHandler) }
  Stop-GreenlyProcessTree -Process $webProcess
  Stop-GreenlyProcessTree -Process $apiProcess
  Write-Host 'Greenlyの起動プロセスを停止しました。'
}
