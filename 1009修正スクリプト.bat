@echo off
setlocal DisableDelayedExpansion
rem Usage: 1009修正スクリプト.bat [project-root] [/dry-run]
rem If the project root is not found beside this script or in the current directory, it is requested interactively.

set "KUSAKARI_REPAIR_SCRIPT=%~f0"
set "KUSAKARI_REPAIR_SCRIPT_DIR=%~dp0"
set "KUSAKARI_REPAIR_CWD=%CD%"
set "KUSAKARI_REPAIR_TARGET="
set "KUSAKARI_REPAIR_DRY_RUN=0"
if /I "%~1"=="/dry-run" set "KUSAKARI_REPAIR_DRY_RUN=1"
if /I "%~1"=="/dry-run" set "KUSAKARI_REPAIR_TARGET=%~2"
if /I not "%~1"=="/dry-run" set "KUSAKARI_REPAIR_TARGET=%~1"
if /I "%~2"=="/dry-run" set "KUSAKARI_REPAIR_DRY_RUN=1"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$text = [IO.File]::ReadAllText($env:KUSAKARI_REPAIR_SCRIPT, [Text.Encoding]::UTF8); $marker = [string]::Concat('#<KUSAKARI_CANVAS_', 'REPAIR_POWERSHELL>'); $index = $text.IndexOf($marker, [StringComparison]::Ordinal); if ($index -lt 0) { exit 2 }; $code = $text.Substring($index + $marker.Length); try { Invoke-Expression $code } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }"
set "KUSAKARI_REPAIR_EXIT_CODE=%ERRORLEVEL%"
if not "%KUSAKARI_REPAIR_EXIT_CODE%"=="0" (
  echo.
  echo Repair script stopped with exit code %KUSAKARI_REPAIR_EXIT_CODE%.
  if not "%KUSAKARI_CANVAS_NO_PAUSE%"=="1" pause
)
exit /b %KUSAKARI_REPAIR_EXIT_CODE%

#<KUSAKARI_CANVAS_REPAIR_POWERSHELL>
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Find-KusakariCanvasRoot {
  param([string]$StartPath)

  if ([string]::IsNullOrWhiteSpace($StartPath)) { return $null }
  try { $candidate = [IO.Path]::GetFullPath($StartPath) } catch { return $null }
  if (Test-Path -LiteralPath $candidate -PathType Leaf) {
    $candidate = Split-Path -Parent $candidate
  }

  while (-not [string]::IsNullOrWhiteSpace($candidate)) {
    $requiredFiles = @(
      'package.json', 'package-lock.json', 'setup.ps1', 'start.ps1', 'start.bat',
      'scripts\setup.ps1', 'scripts\start.ps1', 'scripts\paths.ps1',
      'backend\pyproject.toml', 'frontend\package.json'
    )
    $complete = $true
    foreach ($relativePath in $requiredFiles) {
      if (-not (Test-Path -LiteralPath (Join-Path $candidate $relativePath) -PathType Leaf)) {
        $complete = $false
        break
      }
    }

    if ($complete) {
      try {
        $package = [IO.File]::ReadAllText((Join-Path $candidate 'package.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
        $lockText = [IO.File]::ReadAllText((Join-Path $candidate 'package-lock.json'), [Text.Encoding]::UTF8)
        $lockText = [regex]::Replace($lockText, '("packages"\s*:\s*\{)\s*"":', '$1"__root__":', 1)
        $lock = $lockText | ConvertFrom-Json
        $frontend = [IO.File]::ReadAllText((Join-Path $candidate 'frontend\package.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
        $backend = [IO.File]::ReadAllText((Join-Path $candidate 'backend\pyproject.toml'), [Text.Encoding]::UTF8)
        if ($package.name -eq 'kusakari-canvas' -and
            $lock.name -eq 'kusakari-canvas' -and
            $lock.packages.__root__.name -eq 'kusakari-canvas' -and
            $frontend.name -eq '@kusakari/canvas' -and
            $backend -match '(?m)^name\s*=\s*"kusakari-canvas-api"\s*$') {
          return [IO.Path]::GetFullPath($candidate)
        }
      } catch { }
    }

    $parent = Split-Path -Parent $candidate
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $candidate) { break }
    $candidate = $parent
  }
  return $null
}

$candidateDirectories = @(
  $env:KUSAKARI_REPAIR_TARGET,
  $env:KUSAKARI_REPAIR_CWD,
  $env:KUSAKARI_REPAIR_SCRIPT_DIR
)
$projectRoot = $null
foreach ($directory in $candidateDirectories) {
  if (-not [string]::IsNullOrWhiteSpace($directory)) {
    $projectRoot = Find-KusakariCanvasRoot -StartPath $directory
    if ($null -ne $projectRoot) { break }
  }
}

while ($null -eq $projectRoot) {
  $enteredPath = Read-Host 'Kusakari Canvasプロジェクトのフォルダーを入力してください'
  if ([string]::IsNullOrWhiteSpace($enteredPath)) {
    throw 'プロジェクトルートが指定されていません。'
  }
  $projectRoot = Find-KusakariCanvasRoot -StartPath $enteredPath.Trim('"')
  if ($null -eq $projectRoot) {
    Write-Warning '指定先に Kusakari Canvas の package.json、ロックファイル、起動スクリプトが見つかりません。'
  }
}

$projectRoot = [IO.Path]::GetFullPath($projectRoot).TrimEnd('\')
$backendRoot = Join-Path $projectRoot 'backend'
$dryRun = $env:KUSAKARI_REPAIR_DRY_RUN -eq '1'
Write-Host "Project root: $projectRoot"
Write-Host 'Detected package: kusakari-canvas'
Write-Host 'Database files, .env files, garden data, backups, and MySQL service are excluded from deletion and termination.'

function Test-KusakariCanvasApiPort {
  param([int]$Port)

  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/assets" -TimeoutSec 1 -UseBasicParsing
    if ($response.StatusCode -ne 200 -or $response.Headers['X-Kusakari-Canvas-Backend'] -ne 'fastapi') { return $false }
    $assetIds = @($response.Content | ConvertFrom-Json | ForEach-Object { $_.id })
    foreach ($requiredId in @('tree_oak', 'shrub_boxwood', 'brick_paver', 'bench_wood')) {
      if ($assetIds -notcontains $requiredId) { return $false }
    }
    return $true
  } catch { return $false }
}

function Test-KusakariCanvasWebPort {
  param([int]$Port)

  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -TimeoutSec 1 -UseBasicParsing
    return $response.StatusCode -eq 200 -and $response.Content -match '<title>\s*Kusakari Canvas\s+庭エディタ\s*</title>'
  } catch { return $false }
}

function Get-KusakariCanvasListeners {
  $listeners = @()
  try {
    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | ForEach-Object {
      [pscustomobject]@{ LocalPort = [int]$_.LocalPort; OwningProcess = [int]$_.OwningProcess }
    })
  } catch {
    $netstatPath = Join-Path $env:SystemRoot 'System32\netstat.exe'
    if (-not (Test-Path -LiteralPath $netstatPath -PathType Leaf)) { throw 'TCPリスナーを確認できません。' }
    foreach ($line in (& $netstatPath -ano -p tcp)) {
      if ($line -match '^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$') {
        $listeners += [pscustomobject]@{ LocalPort = [int]$Matches[1]; OwningProcess = [int]$Matches[2] }
      }
    }
  }
  return @($listeners | Sort-Object LocalPort, OwningProcess -Unique)
}

function Get-KusakariCanvasCommandText {
  param([object]$ProcessInfo)

  $commandText = [string]$ProcessInfo.CommandLine
  $encodedMatch = [regex]::Match($commandText, '(?i)-(?:EncodedCommand|enc)\s+([A-Za-z0-9+/=]+)')
  if ($encodedMatch.Success) {
    try { $commandText += "`n" + [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($encodedMatch.Groups[1].Value)) } catch { }
  }
  return $commandText
}

function Get-KusakariCanvasProcessChain {
  param([int]$ProcessId, [hashtable]$ProcessMap)

  $chain = @()
  $seen = @{}
  $currentId = $ProcessId
  for ($depth = 0; $depth -lt 20 -and $currentId -gt 0; $depth++) {
    if ($seen.ContainsKey($currentId) -or -not $ProcessMap.ContainsKey($currentId)) { break }
    $seen[$currentId] = $true
    $processInfo = $ProcessMap[$currentId]
    $chain += $processInfo
    $currentId = [int]$processInfo.ParentProcessId
  }
  return $chain
}

$knownPorts = New-Object 'System.Collections.Generic.HashSet[int]'
$null = $knownPorts.Add(8080)
foreach ($port in 18081..18100) { $null = $knownPorts.Add($port) }
foreach ($port in 5173..5199) { $null = $knownPorts.Add($port) }
foreach ($settingName in @('KUSAKARI_CANVAS_PORT', 'KUSAKARI_CANVAS_WEB_PORT')) {
  $settingValue = [Environment]::GetEnvironmentVariable($settingName, 'Process')
  $settingPort = 0
  if ([int]::TryParse($settingValue, [ref]$settingPort) -and $settingPort -ge 1 -and $settingPort -le 65535) {
    $null = $knownPorts.Add($settingPort)
  }
}

$processMap = @{}
try {
  foreach ($processInfo in @(Get-CimInstance Win32_Process -ErrorAction Stop)) {
    $processMap[[int]$processInfo.ProcessId] = $processInfo
  }
} catch {
  throw '起動中プロセスの所有者を確認できません。管理者権限のコンソールで再実行してください。'
}

$appPorts = @()
$manualStopPids = @()
$serverProcessNames = @('node.exe', 'python.exe', 'pythonw.exe', 'uv.exe', 'uvicorn.exe')
$listeners = Get-KusakariCanvasListeners
foreach ($listener in $listeners) {
  $port = [int]$listener.LocalPort
  $processId = [int]$listener.OwningProcess
  if ($processId -le 0 -or $port -eq 3306) { continue }
  $owner = $processMap[$processId]
  $identity = $null

  if ($null -ne $owner -and $serverProcessNames -contains ([string]$owner.Name).ToLowerInvariant()) {
    if (Test-KusakariCanvasApiPort -Port $port) { $identity = 'API' }
    elseif (Test-KusakariCanvasWebPort -Port $port) { $identity = 'Web' }
  }

  if ($null -ne $identity) {
    $appPorts += [pscustomobject]@{ Port = $port; ProcessId = $processId; Name = $owner.Name; Identity = $identity }
    Write-Host "Detected Kusakari Canvas $identity listener: port $port, PID $processId"
    continue
  }

  if ($knownPorts.Contains($port) -and $null -ne $owner) {
    $ownerName = [string]$owner.Name
    if (@('mysqld.exe', 'mariadbd.exe', 'sqlservr.exe', 'postgres.exe', 'redis-server.exe', 'mongod.exe', 'svchost.exe', 'system') -contains $ownerName.ToLowerInvariant()) {
      Write-Warning "Port $port is owned by protected service $ownerName (PID $processId); it will not be terminated."
      continue
    }
    if ($dryRun) {
      Write-Host "DRY RUN: port $port is occupied by unverified $ownerName (PID $processId); normal mode will ask before force termination."
      continue
    }
    Write-Warning "Port $port is occupied by $ownerName (PID $processId), but Kusakari Canvas identity was not confirmed."
    $answer = Read-Host 'Force-terminate this process tree to free the reserved Canvas port? (Y/N)'
    if ($answer -match '^(?i)y(es)?$') {
      $manualStopPids += $processId
    } else {
      Write-Host "Left PID $processId on port $port untouched."
    }
  }
}

$projectCommandPids = @()
foreach ($processInfo in $processMap.Values) {
  $processName = ([string]$processInfo.Name).ToLowerInvariant()
  if (@('powershell.exe', 'pwsh.exe', 'cmd.exe', 'node.exe', 'python.exe', 'pythonw.exe', 'uv.exe', 'uvicorn.exe') -notcontains $processName) {
    continue
  }
  $commandText = Get-KusakariCanvasCommandText -ProcessInfo $processInfo
  $sameProject = $commandText.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0
  $canvasCommand = $commandText -match '(?i)(kusakari_canvas_api|Kusakari Canvas API:|Kusakari Canvas Web:|@kusakari/canvas|@greenly/frontend|greenly_api)'
  if ($sameProject -and ($commandText -match '(?i)(kusakari_canvas_api|vite|npm.*dev:(api|web)|scripts\\start\.ps1|start\.ps1)' -or $canvasCommand)) {
    if ($projectCommandPids -notcontains [int]$processInfo.ProcessId) {
      $projectCommandPids += [int]$processInfo.ProcessId
      Write-Host "Detected Kusakari Canvas-related process: $processName PID $($processInfo.ProcessId)"
    }
  }
}

if ($dryRun) {
  if ($appPorts.Count -eq 0 -and $projectCommandPids.Count -eq 0 -and $manualStopPids.Count -eq 0) {
    Write-Host 'No Kusakari Canvas listeners or worker processes were detected.'
  }
  foreach ($path in @('node_modules', 'frontend\node_modules', 'backend\.venv')) {
    $targetPath = Join-Path $projectRoot $path
    if (Test-Path -LiteralPath $targetPath) { Write-Host "DRY RUN: would delete generated directory $targetPath" }
  }
  Write-Host 'DRY RUN: no processes or files were changed; the normal run will reinstall dependencies and start Kusakari Canvas.'
  exit 0
}

$stopPids = @()
$listenerTargetPids = @($appPorts | ForEach-Object { [int]$_.ProcessId })
$listenerTargetPids += $manualStopPids
foreach ($targetPid in @($listenerTargetPids + $projectCommandPids | Sort-Object -Unique)) {
  $chain = Get-KusakariCanvasProcessChain -ProcessId ([int]$targetPid) -ProcessMap $processMap
  $rootLaunchers = @($chain | Where-Object {
    ([string]$_.Name -match '(?i)^(powershell|pwsh)\.exe$') -and
    (Get-KusakariCanvasCommandText -ProcessInfo $_) -match '(?i)(?:\\scripts\\)?start\.ps1'
  })
  if ($rootLaunchers.Count -gt 0) {
    $chosenPid = [int]$rootLaunchers[$rootLaunchers.Count - 1].ProcessId
  } else {
    $canvasLaunchers = @($chain | Where-Object {
      ([string]$_.Name -match '(?i)^(powershell|pwsh)\.exe$') -and
      (Get-KusakariCanvasCommandText -ProcessInfo $_) -match '(?i)(Kusakari Canvas API:|Kusakari Canvas Web:|kusakari_canvas_api|npm --workspace frontend)'
    })
    if ($canvasLaunchers.Count -gt 0) { $chosenPid = [int]$canvasLaunchers[0].ProcessId }
    else { $chosenPid = [int]$targetPid }
  }
  if ($stopPids -notcontains $chosenPid) { $stopPids += $chosenPid }
}

foreach ($processId in $stopPids) {
  $processInfo = $processMap[$processId]
  $processName = if ($null -ne $processInfo) { [string]$processInfo.Name } else { 'process' }
  Write-Host "Force-terminating $processName PID $processId..."
  $taskkillPath = Join-Path $env:SystemRoot 'System32\taskkill.exe'
  if (-not (Test-Path -LiteralPath $taskkillPath -PathType Leaf)) { throw 'taskkill.exe was not found.' }
  $taskkillOutput = & $taskkillPath /PID $processId /T /F 2>&1
  if ($LASTEXITCODE -ne 0 -and $null -ne (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
    throw "Could not force-terminate PID $processId. Run this script from an elevated console if it is owned by another account."
  }
}

foreach ($listenerTargetPid in @($listenerTargetPids | Sort-Object -Unique)) {
  $deadline = [DateTime]::UtcNow.AddSeconds(10)
  do {
    $stillListening = @(Get-KusakariCanvasListeners | Where-Object { $_.OwningProcess -eq $listenerTargetPid })
    if ($stillListening.Count -eq 0) { break }
    Start-Sleep -Milliseconds 250
  } while ([DateTime]::UtcNow -lt $deadline)
  if ($stillListening.Count -gt 0) { throw "PID $listenerTargetPid still owns a listening port; dependency deletion was stopped." }
}

function Remove-GeneratedDirectory {
  param([string]$Path, [string]$Root, [string[]]$AllowedLeafNames)

  if (-not (Test-Path -LiteralPath $Path)) { return }
  $resolvedPath = [IO.Path]::GetFullPath($Path).TrimEnd('\')
  $resolvedRoot = [IO.Path]::GetFullPath($Root).TrimEnd('\')
  $rootPrefix = $resolvedRoot + [IO.Path]::DirectorySeparatorChar
  if (-not $resolvedPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to delete a path outside the project: $resolvedPath"
  }
  $leafName = Split-Path -Leaf $resolvedPath
  if ($AllowedLeafNames -notcontains $leafName) { throw "Refusing to delete an unexpected directory: $resolvedPath" }
  $directoryInfo = Get-Item -LiteralPath $resolvedPath -Force
  if (($directoryInfo.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "Refusing to recursively delete a reparse point: $resolvedPath"
  }
  Write-Host "Deleting generated directory: $resolvedPath"
  Remove-Item -LiteralPath $resolvedPath -Recurse -Force
}

foreach ($relativeDirectory in @('node_modules', 'frontend\node_modules')) {
  Remove-GeneratedDirectory -Path (Join-Path $projectRoot $relativeDirectory) -Root $projectRoot -AllowedLeafNames @('node_modules')
}
Remove-GeneratedDirectory -Path (Join-Path $backendRoot '.venv') -Root $projectRoot -AllowedLeafNames @('.venv')
$pythonCaches = @(Get-ChildItem -LiteralPath $backendRoot -Directory -Filter '__pycache__' -Recurse -Force -ErrorAction SilentlyContinue |
  Sort-Object { $_.FullName.Length } -Descending)
foreach ($cacheDirectory in $pythonCaches) {
  Remove-GeneratedDirectory -Path $cacheDirectory.FullName -Root $projectRoot -AllowedLeafNames @('__pycache__')
}

Write-Host 'Generated dependencies and Python bytecode were removed.'
Write-Host 'Starting the canonical setup and application launcher; dependencies will be restored from package-lock.json and backend\uv.lock.'
Push-Location -LiteralPath $projectRoot
try {
  & (Join-Path $projectRoot 'start.ps1') -NoBrowser
} finally {
  Pop-Location
}
Write-Host 'Repair-and-start run completed.'
exit 0
