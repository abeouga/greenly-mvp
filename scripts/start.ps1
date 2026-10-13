param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'paths.ps1')
$repoRoot = Get-KusakariCanvasRepoRoot -StartPath $PSScriptRoot
$env:KUSAKARI_CANVAS_HOME = Get-KusakariCanvasHome -RepoRoot $repoRoot
$expectedAssetIds = @('tree_oak', 'shrub_boxwood', 'brick_paver', 'bench_wood')

function Import-LocalDatabaseSettings {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }

  $allowedNames = @('KUSAKARI_CANVAS_DB_USER', 'KUSAKARI_CANVAS_DB_PASSWORD', 'KUSAKARI_CANVAS_DB_URL')
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*(KUSAKARI_CANVAS_DB_USER|KUSAKARI_CANVAS_DB_PASSWORD|KUSAKARI_CANVAS_DB_URL)\s*=\s*(.*?)\s*$') {
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

function Test-KusakariCanvasApi {
  param([int]$Port)

  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/assets" -TimeoutSec 1 -UseBasicParsing
    if ($response.Headers['X-Kusakari-Canvas-Backend'] -ne 'fastapi') { return $false }
    $assets = $response.Content | ConvertFrom-Json
    $ids = @($assets | ForEach-Object { $_.id })
    return @($expectedAssetIds | Where-Object { $ids -notcontains $_ }).Count -eq 0
  } catch {
    return $false
  }
}

function Get-EphemeralLoopbackPort {
  for ($attempt = 0; $attempt -lt 10; $attempt++) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $started = $false
    try {
      $listener.Start()
      $started = $true
      return $listener.LocalEndpoint.Port
    } catch {
      continue
    } finally {
      if ($started) { $listener.Stop() }
    }
  }
  return $null
}

function Get-ApiPortChoice {
  param(
    [int]$PreferredPort = 0,
    [int[]]$ExcludedPorts = @()
  )

  $ports = @()
  if ($PreferredPort -gt 0) { $ports += $PreferredPort }
  $ports += @(8080) + @(18081..18100)
  foreach ($port in @($ports | Select-Object -Unique)) {
    if ($ExcludedPorts -contains $port) { continue }
    if (Test-LoopbackPortAvailable -Port $port) { return @{ Port = $port; Reuse = $false } }
    if (Test-KusakariCanvasApi -Port $port) { return @{ Port = $port; Reuse = $true } }
  }

  for ($attempt = 0; $attempt -lt 10; $attempt++) {
    $port = Get-EphemeralLoopbackPort
    if ($null -ne $port -and $ExcludedPorts -notcontains $port -and
      (Test-LoopbackPortAvailable -Port $port)) {
      return @{ Port = $port; Reuse = $false }
    }
  }
  return $null
}

function Get-WebPortChoice {
  param(
    [int]$PreferredPort = 0,
    [int[]]$ExcludedPorts = @()
  )

  $ports = @()
  if ($PreferredPort -gt 0) { $ports += $PreferredPort }
  $ports += @(5173..5199)
  foreach ($port in @($ports | Select-Object -Unique)) {
    if ($ExcludedPorts -contains $port) { continue }
    if (Test-LoopbackPortAvailable -Port $port) { return $port }
  }

  for ($attempt = 0; $attempt -lt 10; $attempt++) {
    $port = Get-EphemeralLoopbackPort
    if ($null -ne $port -and $ExcludedPorts -notcontains $port -and
      (Test-LoopbackPortAvailable -Port $port)) {
      return $port
    }
  }
  return $null
}

function ConvertTo-EncodedPowerShellCommand {
  param([string]$Command)

  return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
}

function Start-KusakariCanvasProcess {
  param([string]$Command)

  $encodedCommand = ConvertTo-EncodedPowerShellCommand -Command $Command
  return Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoLogo', '-NoProfile', '-EncodedCommand', $encodedCommand) `
    -WorkingDirectory $repoRoot -NoNewWindow -PassThru
}

function Stop-KusakariCanvasProcessTree {
  param([System.Diagnostics.Process]$Process)

  if ($null -eq $Process) { return }
  try {
    $Process.Refresh()
    if ($Process.HasExited) { return }
    $taskkill = $null
    if (-not [string]::IsNullOrWhiteSpace($env:SystemRoot)) {
      $taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'
    }
    if ($taskkill -and (Test-Path -LiteralPath $taskkill -PathType Leaf)) {
      & $taskkill /PID $Process.Id /T /F 2>$null | Out-Null
    }
    $Process.Refresh()
    if (-not $Process.HasExited) {
      $Process.Kill($true)
      $stopped = $Process.WaitForExit(5000)
      $Process.Refresh()
      if (-not $stopped -and -not $Process.HasExited) { throw '5秒以内に停止しませんでした。' }
    }
  } catch {
    Write-Warning "プロセス停止に失敗しました (PID $($Process.Id)): $($_.Exception.Message)"
  }
}

function Wait-ForKusakariCanvasApi {
  param(
    [int]$Port,
    [System.Diagnostics.Process]$Process
  )

  for ($attempt = 0; $attempt -lt 120; $attempt++) {
    if (Test-KusakariCanvasApi -Port $Port) { return $true }
    if ($script:gardenStopRequested -or [KusakariCanvasConsoleCancellation]::IsRequested()) {
      throw 'API起動待ちを中断しました。'
    }
    if ($Process.HasExited) { return $false }
    Start-Sleep -Seconds 1
  }
  throw 'APIが120秒以内に起動しませんでした。このコンソールのAPIログを確認してください。MySQLの起動状態、KUSAKARI_CANVAS_DB_USER、KUSAKARI_CANVAS_DB_PASSWORDも確認してください。'
}

function Wait-ForKusakariCanvasWeb {
  param(
    [int]$Port,
    [System.Diagnostics.Process]$Process
  )

  for ($attempt = 0; $attempt -lt 45; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -TimeoutSec 2 -UseBasicParsing
      if ($response.StatusCode -eq 200) { return $true }
    } catch { }
    if ($script:gardenStopRequested -or [KusakariCanvasConsoleCancellation]::IsRequested()) {
      throw 'Web起動待ちを中断しました。'
    }
    if ($Process.HasExited) { return $false }
    Start-Sleep -Seconds 1
  }
  throw 'Web画面が45秒以内に起動しませんでした。このコンソールのWebログを確認してください。'
}

foreach ($required in @('node.exe', 'npm.cmd', 'uv.exe')) {
  if (-not (Get-Command $required -ErrorAction SilentlyContinue)) {
    throw "$required が見つかりません。リポジトリ直下のsetup.batを実行してから再試行してください。"
  }
}
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules') -PathType Container)) {
  throw "JavaScript依存関係がありません。リポジトリ直下のsetup.batを実行してください: $repoRoot"
}
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'backend\pyproject.toml') -PathType Leaf)) {
  throw "Python API設定が見つかりません: $repoRoot\backend\pyproject.toml"
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
$requestedApiPort = 0
$requestedApiPortText = $env:KUSAKARI_CANVAS_PORT
if (-not [string]::IsNullOrWhiteSpace($requestedApiPortText)) {
  if (-not [int]::TryParse($requestedApiPortText, [ref]$requestedApiPort) -or
      $requestedApiPort -lt 1 -or $requestedApiPort -gt 65535) {
    throw 'KUSAKARI_CANVAS_PORTは1〜65535の整数で指定してください。'
  }
}
$apiChoice = Get-ApiPortChoice -PreferredPort $requestedApiPort
if ($null -eq $apiChoice) {
  throw 'API用の空きポートを確保できませんでした。'
}
$apiPort = $apiChoice.Port
$reuseApi = $apiChoice.Reuse
if ($requestedApiPort -gt 0 -and $requestedApiPort -ne $apiPort) {
  Write-Host "指定されたAPIポート $requestedApiPort は使用中のため、空きポート $apiPort を使用します。"
}

$requestedWebPort = 0
$requestedWebPortText = $env:KUSAKARI_CANVAS_WEB_PORT
if (-not [string]::IsNullOrWhiteSpace($requestedWebPortText)) {
  if (-not [int]::TryParse($requestedWebPortText, [ref]$requestedWebPort) -or
      $requestedWebPort -lt 1 -or $requestedWebPort -gt 65535) {
    throw 'KUSAKARI_CANVAS_WEB_PORTは1〜65535の整数で指定してください。'
  }
}
$webPort = Get-WebPortChoice -PreferredPort $requestedWebPort -ExcludedPorts @($apiPort)
if ($null -eq $webPort) {
  throw 'Web用の空きポートを確保できませんでした。'
}
if ($requestedWebPort -gt 0 -and $requestedWebPort -ne $webPort) {
  Write-Host "指定されたWebポート $requestedWebPort は使用中かAPIポートと重複するため、空きポート $webPort を使用します。"
}

Set-Location -LiteralPath $repoRoot
if (-not ('KusakariCanvasConsoleCancellation' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Threading;

public static class KusakariCanvasConsoleCancellation
{
    private static int stopRequested;

    public static void HandleCancel(object sender, ConsoleCancelEventArgs eventArgs)
    {
        eventArgs.Cancel = true;
        Interlocked.Exchange(ref stopRequested, 1);
    }

    public static bool IsRequested()
    {
        return Volatile.Read(ref stopRequested) != 0;
    }

    public static void Reset()
    {
        Interlocked.Exchange(ref stopRequested, 0);
    }
}
'@
}
$cancelHandler = $null
try {
  try { $Host.UI.RawUI.WindowTitle = 'Kusakari Canvas' } catch { }
  $apiProcess = $null
  $webProcess = $null
  $cancelMethod = [KusakariCanvasConsoleCancellation].GetMethod('HandleCancel')
  $cancelHandler = [Delegate]::CreateDelegate([ConsoleCancelEventHandler], $cancelMethod)
  [KusakariCanvasConsoleCancellation]::Reset()
  $script:gardenStopRequested = $false
  [Console]::add_CancelKeyPress($cancelHandler)

  if (-not $reuseApi) {
    Import-LocalDatabaseSettings -Path (Join-Path $repoRoot '.env')
    if ([string]::IsNullOrWhiteSpace($env:KUSAKARI_CANVAS_DB_USER)) { $env:KUSAKARI_CANVAS_DB_USER = 'kusakari_canvas_dev' }
    if ([string]::IsNullOrWhiteSpace($env:KUSAKARI_CANVAS_DB_PASSWORD)) {
      throw 'MySQLの接続設定がありません。リポジトリ直下のsetup.batでDBと専用ユーザーを準備してください。'
    }

    $failedApiPorts = @()
    $apiStarted = $false
    for ($attempt = 0; $attempt -lt 8; $attempt++) {
      if ($attempt -gt 0) {
        $apiChoice = Get-ApiPortChoice -PreferredPort $requestedApiPort -ExcludedPorts $failedApiPorts
        if ($null -eq $apiChoice) { break }
        $apiPort = $apiChoice.Port
        if ($apiChoice.Reuse) {
          $reuseApi = $true
          Write-Host "競合解消後に既存のKusakari Canvas APIを使用します: http://127.0.0.1:$apiPort"
          $apiStarted = $true
          break
        }
        Write-Host "APIポート競合を検出したため、127.0.0.1:$apiPort で再試行します。"
      }

      $apiCommand = "`$env:KUSAKARI_CANVAS_PROFILE='dev'; `$env:KUSAKARI_CANVAS_HOST='127.0.0.1'; `$env:KUSAKARI_CANVAS_PORT='$apiPort'; Write-Host 'Kusakari Canvas API: http://127.0.0.1:$apiPort'; npm run dev:api"
      $apiProcess = Start-KusakariCanvasProcess -Command $apiCommand
      Write-Host "API起動中: 127.0.0.1:$apiPort (PID $($apiProcess.Id))"
      $apiReady = Wait-ForKusakariCanvasApi -Port $apiPort -Process $apiProcess
      if ($apiReady) {
        $apiStarted = $true
        break
      }
      $apiProcess.Refresh()
      if ($apiProcess.HasExited -and -not (Test-LoopbackPortAvailable -Port $apiPort)) {
        $failedApiPorts += $apiPort
        Stop-KusakariCanvasProcessTree -Process $apiProcess
        $apiProcess = $null
        Write-Host "APIポート $apiPort が起動時に取得されたため、別のポートを選び直します。"
        continue
      }
      throw 'APIプロセスが起動中に終了しました。直前のAPIログを確認してください。'
    }
    if (-not $apiStarted) { throw 'APIのポート競合を8回試行しましたが起動できませんでした。' }
  } else {
    Write-Host "既存のKusakari Canvas APIを使用します: http://127.0.0.1:$apiPort"
  }

  if ($apiPort -eq $webPort) {
    $webPort = Get-WebPortChoice -PreferredPort $requestedWebPort -ExcludedPorts @($apiPort)
    if ($null -eq $webPort) { throw 'APIと異なるWeb用の空きポートを確保できませんでした。' }
  }

  $apiTarget = "http://127.0.0.1:$apiPort"
  $failedWebPorts = @()
  $webStarted = $false
  for ($attempt = 0; $attempt -lt 8; $attempt++) {
    if ($attempt -gt 0) {
      $webPort = Get-WebPortChoice -PreferredPort $requestedWebPort -ExcludedPorts (@($failedWebPorts) + @($apiPort))
      if ($null -eq $webPort) { break }
      Write-Host "Webポート競合を検出したため、127.0.0.1:$webPort で再試行します。"
    }
    $webCommand = "Remove-Item Env:KUSAKARI_CANVAS_DB_USER, Env:KUSAKARI_CANVAS_DB_PASSWORD, Env:KUSAKARI_CANVAS_DB_URL, Env:KUSAKARI_CANVAS_E2E_DB_USER, Env:KUSAKARI_CANVAS_E2E_DB_PASSWORD, Env:KUSAKARI_CANVAS_E2E_DB_URL -ErrorAction SilentlyContinue; `$env:KUSAKARI_CANVAS_API_TARGET='$apiTarget'; Write-Host 'Kusakari Canvas Web: http://127.0.0.1:$webPort'; npm --workspace frontend run dev -- --host 127.0.0.1 --port $webPort --strictPort"
    $webProcess = Start-KusakariCanvasProcess -Command $webCommand
    Write-Host "Web起動中: 127.0.0.1:$webPort (PID $($webProcess.Id))"
    $webReady = Wait-ForKusakariCanvasWeb -Port $webPort -Process $webProcess
    if ($webReady) {
      $webStarted = $true
      break
    }
    $webProcess.Refresh()
    if ($webProcess.HasExited -and -not (Test-LoopbackPortAvailable -Port $webPort)) {
      $failedWebPorts += $webPort
      Stop-KusakariCanvasProcessTree -Process $webProcess
      $webProcess = $null
      Write-Host "Webポート $webPort が起動時に取得されたため、別のポートを選び直します。"
      continue
    }
    throw 'Webプロセスが起動中に終了しました。直前のWebログを確認してください。'
  }
  if (-not $webStarted) { throw 'Webのポート競合を8回試行しましたが起動できませんでした。' }

  $appUrl = "http://127.0.0.1:$webPort"
  Write-Host "起動確認完了: $appUrl"
  Write-Host "API: $apiTarget/api/assets"
  Write-Host '停止するにはこのコンソールで Ctrl+C を押してください。終了確認が出た場合はYで閉じるか、Nでログを確認します。'
  if (-not $NoBrowser) { Start-Process -FilePath $appUrl }

  while (-not $script:gardenStopRequested -and -not [KusakariCanvasConsoleCancellation]::IsRequested()) {
    if (-not [string]::IsNullOrWhiteSpace($env:KUSAKARI_CANVAS_STOP_REQUEST_PATH) -and
      (Test-Path -LiteralPath $env:KUSAKARI_CANVAS_STOP_REQUEST_PATH -PathType Leaf)) {
      Remove-Item -LiteralPath $env:KUSAKARI_CANVAS_STOP_REQUEST_PATH -Force
      $script:gardenStopRequested = $true
      continue
    }
    if ($null -ne $apiProcess -and $apiProcess.HasExited) {
      throw "Kusakari Canvas APIプロセスが終了しました (終了コード $($apiProcess.ExitCode))。"
    }
    if ($webProcess.HasExited) {
      throw "Kusakari Canvas Webプロセスが終了しました (終了コード $($webProcess.ExitCode))。"
    }
    Start-Sleep -Milliseconds 400
  }
} finally {
  if ($null -ne $cancelHandler) { [Console]::remove_CancelKeyPress($cancelHandler) }
  Stop-KusakariCanvasProcessTree -Process $webProcess
  Stop-KusakariCanvasProcessTree -Process $apiProcess
  Write-Host 'Kusakari Canvasの起動プロセスを停止しました。'
}
