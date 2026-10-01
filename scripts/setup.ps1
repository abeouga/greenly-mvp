param()

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

if ($env:OS -ne 'Windows_NT') {
  throw 'このセットアップはWindows用です。'
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$toolsRoot = Join-Path $env:LOCALAPPDATA 'Greenly\tools'
$nodeTools = Join-Path $toolsRoot 'node'
$uvTools = Join-Path $toolsRoot 'uv'
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("greenly-setup-{0}" -f [guid]::NewGuid().ToString('N'))

function Add-PathFirst {
  param([string]$Path)
  if (-not ($env:Path -split ';' | Where-Object { $_.TrimEnd('\') -ieq $Path.TrimEnd('\') })) {
    $env:Path = "$Path;$env:Path"
  }
}

function Get-WindowsArchitecture {
  $architecture = $env:PROCESSOR_ARCHITEW6432
  if ([string]::IsNullOrWhiteSpace($architecture)) { $architecture = $env:PROCESSOR_ARCHITECTURE }
  switch ($architecture.ToUpperInvariant()) {
    'AMD64' { return 'x64' }
    'ARM64' { return 'arm64' }
    default { throw "未対応のWindows CPUアーキテクチャです: $architecture" }
  }
}

function Get-FileSha256 {
  param([string]$Path)

  $stream = [IO.File]::OpenRead($Path)
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try {
    return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '')
  } finally {
    $algorithm.Dispose()
    $stream.Dispose()
  }
}

function Get-NodeInstallation {
  param([string]$Directory)
  $nodePath = Join-Path $Directory 'node.exe'
  $npmPath = Join-Path $Directory 'npm.cmd'
  if (-not (Test-Path -LiteralPath $nodePath -PathType Leaf) -or
      -not (Test-Path -LiteralPath $npmPath -PathType Leaf)) { return $null }

  $versionText = (& $nodePath --version 2>$null | Select-Object -First 1).Trim()
  if ($versionText -notmatch '^v?(\d+\.\d+\.\d+)') { return $null }
  if ([version]$Matches[1] -lt [version]'22.12.0') { return $null }
  return [pscustomobject]@{ Node = $nodePath; Npm = $npmPath; Version = $versionText }
}

function Get-NodeOnPath {
  $command = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $command) { return $null }
  return (Get-NodeInstallation -Directory (Split-Path -Parent $command.Source))
}

function Get-NodeArchive {
  param([string]$Architecture)

  Write-Host 'Node.js LTSが見つからないため、公式配布物を取得します。'
  $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -TimeoutSec 30
  $release = $index |
    Where-Object { $_.lts -and $_.version -match '^v\d+\.\d+\.\d+$' -and ([version]($_.version.Substring(1))) -ge [version]'22.12.0' } |
    Sort-Object -Property @{ Expression = { [version]($_.version.Substring(1)) }; Descending = $true } |
    Select-Object -First 1
  if ($null -eq $release) { throw 'Node.js 22.12以降のLTS配布情報を取得できませんでした。' }

  $version = $release.version
  $archiveName = "node-$version-win-$Architecture.zip"
  $baseUri = "https://nodejs.org/dist/$version/"
  $archivePath = Join-Path $tempRoot $archiveName
  $checksumPath = Join-Path $tempRoot 'SHASUMS256.txt'
  Invoke-WebRequest -Uri ($baseUri + $archiveName) -OutFile $archivePath -TimeoutSec 300
  Invoke-WebRequest -Uri ($baseUri + 'SHASUMS256.txt') -OutFile $checksumPath -TimeoutSec 30
  $pattern = '(?m)^([0-9a-fA-F]{64})\s+\*?' + [regex]::Escape($archiveName) + '\s*$'
  $checksumMatch = [regex]::Match((Get-Content -Raw -LiteralPath $checksumPath), $pattern)
  if (-not $checksumMatch.Success) { throw "Node.js配布物のSHA-256が見つかりません: $archiveName" }
  $actualHash = Get-FileSha256 -Path $archivePath
  if ($actualHash -ne $checksumMatch.Groups[1].Value.ToUpperInvariant()) {
    throw 'Node.js配布物のSHA-256が一致しません。展開を中止しました。'
  }

  $extractRoot = Join-Path $tempRoot 'node'
  Expand-Archive -LiteralPath $archivePath -DestinationPath $extractRoot -Force
  $sourceRoot = Join-Path $extractRoot "node-$version-win-$Architecture"
  $destination = Join-Path $nodeTools "node-$version-win-$Architecture"
  New-Item -ItemType Directory -Path $nodeTools -Force | Out-Null
  if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Recurse -Force }
  Move-Item -LiteralPath $sourceRoot -Destination $destination
  return (Get-NodeInstallation -Directory $destination)
}

function Get-UvInstallation {
  $command = Get-Command uv.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  $localPath = Join-Path $uvTools 'uv.exe'
  $candidates = @()
  if ($null -ne $command) { $candidates += $command.Source }
  if (Test-Path -LiteralPath $localPath -PathType Leaf) { $candidates += $localPath }
  foreach ($candidate in $candidates) {
    if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
    $versionText = (& $candidate --version 2>$null | Select-Object -First 1)
    if ($versionText -match 'uv\s+(\d+\.\d+\.\d+)') {
      if ([version]$Matches[1] -ge [version]'0.8.0') {
        if ($candidate -eq $localPath) { Add-PathFirst -Path $uvTools }
        return $candidate
      }
    }
  }

  Write-Host '利用可能なuv 0.8以降が見つからないため、公式リリースをチェックサム検証付きで取得します。'
  $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/astral-sh/uv/releases/latest' `
    -Headers @{ 'User-Agent' = 'Greenly-setup' } -TimeoutSec 30
  $architecture = Get-WindowsArchitecture
  $target = if ($architecture -eq 'arm64') { 'aarch64' } else { 'x86_64' }
  $archiveName = "uv-$target-pc-windows-msvc.zip"
  $archive = $release.assets | Where-Object { $_.name -eq $archiveName } | Select-Object -First 1
  $checksum = $release.assets | Where-Object { $_.name -eq "$archiveName.sha256" } | Select-Object -First 1
  if ($null -eq $archive -or $null -eq $checksum) { throw "uv $architecture 用の配布物またはSHA-256が見つかりません。" }

  $archivePath = Join-Path $tempRoot $archiveName
  $checksumPath = Join-Path $tempRoot "$archiveName.sha256"
  Invoke-WebRequest -Uri $archive.browser_download_url -OutFile $archivePath -TimeoutSec 300
  Invoke-WebRequest -Uri $checksum.browser_download_url -OutFile $checksumPath -TimeoutSec 30
  $expectedHash = [regex]::Match((Get-Content -Raw -LiteralPath $checksumPath), '[0-9a-fA-F]{64}').Value
  $actualHash = Get-FileSha256 -Path $archivePath
  if ([string]::IsNullOrWhiteSpace($expectedHash) -or $actualHash -ne $expectedHash.ToUpperInvariant()) {
    throw 'uv配布物のSHA-256が一致しません。展開を中止しました。'
  }

  $extractRoot = Join-Path $tempRoot 'uv'
  Expand-Archive -LiteralPath $archivePath -DestinationPath $extractRoot -Force
  $source = Get-ChildItem -LiteralPath $extractRoot -Filter 'uv.exe' -File -Recurse | Select-Object -First 1
  if ($null -eq $source) { throw 'uv.exeが配布物に含まれていません。' }
  New-Item -ItemType Directory -Path $uvTools -Force | Out-Null
  Copy-Item -LiteralPath $source.FullName -Destination $localPath -Force
  Add-PathFirst -Path $uvTools
  return $localPath
}

function Get-DatabaseEndpoint {
  $address = $env:GREENLY_DB_URL
  if ([string]::IsNullOrWhiteSpace($address)) {
    $envFile = Join-Path $repoRoot '.env'
    if (Test-Path -LiteralPath $envFile -PathType Leaf) {
      foreach ($line in Get-Content -LiteralPath $envFile) {
        if ($line -match '^\s*GREENLY_DB_URL\s*=\s*(.*?)\s*$') {
          $address = $Matches[1]
          if ($address.Length -ge 2 -and (($address[0] -eq '"' -and $address[-1] -eq '"') -or
              ($address[0] -eq "'" -and $address[-1] -eq "'"))) {
            $address = $address.Substring(1, $address.Length - 2)
          }
          break
        }
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($address)) { return [pscustomobject]@{ Host = '127.0.0.1'; Port = 3306 } }
  $address = $address -replace '^jdbc:', ''
  $uri = $null
  if ([Uri]::TryCreate($address, [UriKind]::Absolute, [ref]$uri) -and $uri.Scheme.StartsWith('mysql')) {
    return [pscustomobject]@{ Host = $uri.Host; Port = $(if ($uri.IsDefaultPort) { 3306 } else { $uri.Port }) }
  }
  return $null
}

function Test-TcpEndpoint {
  param([string]$HostName, [int]$Port)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $connection = $client.ConnectAsync($HostName, $Port)
    return $connection.Wait(1200) -and $client.Connected
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

try {
  New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
  $node = Get-NodeOnPath
  if ($null -eq $node) {
    $architecture = Get-WindowsArchitecture
    $candidate = Get-ChildItem -LiteralPath $nodeTools -Directory -ErrorAction SilentlyContinue |
      Sort-Object -Property LastWriteTime -Descending |
      ForEach-Object { Get-NodeInstallation -Directory $_.FullName } |
      Where-Object { $null -ne $_ } | Select-Object -First 1
    if ($null -ne $candidate) {
      Add-PathFirst -Path (Split-Path -Parent $candidate.Node)
      $node = $candidate
    } else {
      $node = Get-NodeArchive -Architecture $architecture
      if ($null -eq $node) { throw 'Node.jsの展開後検査に失敗しました。' }
      Add-PathFirst -Path (Split-Path -Parent $node.Node)
    }
  }
  Write-Host "Node.js: $($node.Version)"

  $uvPath = Get-UvInstallation
  Write-Host "uv: $(& $uvPath --version)"

  $python = Get-Command python.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $python) { Write-Host 'Python 3.12はuvのユーザー管理領域へインストールします。' }
  & $uvPath python install '3.12' --no-bin
  if ($LASTEXITCODE -ne 0) { throw 'Python 3.12の取得に失敗しました。' }

  $nodeModules = Join-Path $repoRoot 'node_modules'
  $packageLock = Join-Path $repoRoot 'package-lock.json'
  $packageHash = Get-FileSha256 -Path $packageLock
  $packageMarker = Join-Path $nodeModules '.greenly-package-lock.sha256'
  $installedPackageHash = if (Test-Path -LiteralPath $packageMarker) { (Get-Content -Raw -LiteralPath $packageMarker).Trim() } else { '' }
  if ($installedPackageHash -ne $packageHash) {
    $installedTreeMatches = $false
    $installedPackageLock = Join-Path $nodeModules '.package-lock.json'
    if (Test-Path -LiteralPath $installedPackageLock -PathType Leaf) {
      try {
        $lockCheck = @'
const fs = require('node:fs');
const expected = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const installed = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let matches = expected.lockfileVersion === installed.lockfileVersion;
for (const [path, locked] of Object.entries(expected.packages)) {
  if (!path.startsWith('node_modules/')) continue;
  const actual = installed.packages[path];
  if (!actual) {
    if (!locked.optional) matches = false;
    continue;
  }
  if (locked.version !== actual.version || (locked.integrity && locked.integrity !== actual.integrity)) {
    matches = false;
  }
}
process.exitCode = matches ? 0 : 1;
'@
        & $node.Node -e $lockCheck $packageLock $installedPackageLock
        $installedTreeMatches = $LASTEXITCODE -eq 0
        if ($installedTreeMatches) {
          Push-Location $repoRoot
          try {
            & $node.Npm ls --workspaces --depth=0 --silent
            $installedTreeMatches = $LASTEXITCODE -eq 0
          } finally { Pop-Location }
        }
      } catch {
        $installedTreeMatches = $false
      }
    }
    if ($installedTreeMatches) {
      Write-Host '既存のJavaScript依存関係がpackage-lock.jsonと一致しています。再インストールを省略します。'
    } else {
      Write-Host 'JavaScript依存関係をpackage-lock.jsonから復元します。'
      Push-Location $repoRoot
      try {
        & $node.Npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ciが終了コード $LASTEXITCODE で失敗しました。" }
      } finally { Pop-Location }
    }
    Set-Content -LiteralPath $packageMarker -Value $packageHash -Encoding ASCII
  } else {
    Write-Host 'JavaScript依存関係はロックファイルと一致しています。'
  }

  $backendRoot = Join-Path $repoRoot 'backend'
  $uvLock = Join-Path $backendRoot 'uv.lock'
  $uvHash = Get-FileSha256 -Path $uvLock
  $venv = Join-Path $backendRoot '.venv'
  $uvMarker = Join-Path $venv '.greenly-uv-lock.sha256'
  $installedUvHash = if (Test-Path -LiteralPath $uvMarker) { (Get-Content -Raw -LiteralPath $uvMarker).Trim() } else { '' }
  if ($installedUvHash -ne $uvHash -or -not (Test-Path -LiteralPath (Join-Path $venv 'Scripts\python.exe'))) {
    $venvPython = Join-Path $venv 'Scripts\python.exe'
    $venvMatchesLock = $false
    if (Test-Path -LiteralPath $venvPython -PathType Leaf) {
      & $uvPath sync --project $backendRoot --locked --check
      $venvMatchesLock = $LASTEXITCODE -eq 0
    }
    if ($venvMatchesLock) {
      Write-Host '既存のPython依存関係がbackend/uv.lockと一致しています。再同期を省略します。'
    } else {
      Write-Host 'Python依存関係をbackend/uv.lockから復元します。'
      & $uvPath sync --project $backendRoot --locked
      if ($LASTEXITCODE -ne 0) { throw "uv syncが終了コード $LASTEXITCODE で失敗しました。" }
    }
    Set-Content -LiteralPath $uvMarker -Value $uvHash -Encoding ASCII
  } else {
    Write-Host 'Python依存関係はロックファイルと一致しています。'
  }

  $modelDir = Join-Path $repoRoot 'frontend\public\models'
  $modelFiles = @('tree-oak.glb', 'shrub-boxwood.glb', 'brick-paver.glb', 'bench-wood.glb')
  if (@($modelFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $modelDir $_) -PathType Leaf) }).Count -gt 0) {
    Write-Host '不足しているGLBアセットを生成します。'
    Push-Location $repoRoot
    try {
      & $node.Npm run assets:generate
      if ($LASTEXITCODE -ne 0) { throw 'GLBアセットの生成に失敗しました。' }
    } finally { Pop-Location }
  }

  $databaseEndpoint = Get-DatabaseEndpoint
  if ($null -eq $databaseEndpoint) {
    Write-Warning 'GREENLY_DB_URLを解釈できません。READMEのDB接続設定を確認してください。'
  } elseif (-not (Test-TcpEndpoint -HostName $databaseEndpoint.Host -Port $databaseEndpoint.Port)) {
    Write-Warning "MySQLへ接続できません: $($databaseEndpoint.Host):$($databaseEndpoint.Port)。Serverを起動し、greenly DBとgreenly_devユーザーを作成してからstart.batを実行してください。"
  } else {
    Write-Host "MySQL: TCP接続を確認しました ($($databaseEndpoint.Host):$($databaseEndpoint.Port))。"
  }

  Write-Host 'Greenlyのツールとロック済み依存関係のセットアップが完了しました。'
} finally {
  if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force }
}
