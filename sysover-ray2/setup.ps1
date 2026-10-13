param()

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

if ($env:OS -ne 'Windows_NT') {
  throw 'SysOverRayはWindows専用です。'
}

$overlayRoot = $PSScriptRoot
$pathSearchRoot = $overlayRoot
$pathHelper = $null
while (-not [string]::IsNullOrWhiteSpace($pathSearchRoot)) {
  $candidateHelper = Join-Path $pathSearchRoot 'scripts\paths.ps1'
  if (Test-Path -LiteralPath $candidateHelper -PathType Leaf) {
    $pathHelper = $candidateHelper
    break
  }
  $parent = Split-Path -Parent $pathSearchRoot
  if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $pathSearchRoot) { break }
  $pathSearchRoot = $parent
}
if ($null -eq $pathHelper) { throw 'Kusakari Canvasのパス設定スクリプトが見つかりません。プロジェクト内のsysover-ray2フォルダーから実行してください。' }
. $pathHelper
$repoRoot = Get-KusakariCanvasRepoRoot -StartPath $overlayRoot
$env:KUSAKARI_CANVAS_HOME = Get-KusakariCanvasHome -RepoRoot $repoRoot
$appRoot = Join-Path $overlayRoot 'app'
$executable = Join-Path $appRoot 'SysOverRay.exe'
$canvasHome = $env:KUSAKARI_CANVAS_HOME
$runtimeRoot = Join-Path $canvasHome 'tools\dotnet-desktop-10'

$requiredFiles = @(
  'SysOverRay.exe',
  'SysOverRay.dll',
  'SysOverRay.deps.json',
  'SysOverRay.runtimeconfig.json',
  'overlay-settings.json'
)
$missingFiles = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $appRoot $_) -PathType Leaf) })
if ($missingFiles.Count -gt 0) {
  throw "SysOverRayの配布ファイルが不足しています: $($missingFiles -join ', ')。sysover-ray2のREADMEにあるpublish手順を実行してください。"
}

function Test-DesktopRuntime {
  param([string]$DotnetPath)
  if (-not (Test-Path -LiteralPath $DotnetPath -PathType Leaf)) { return $false }
  $runtimes = & $DotnetPath --list-runtimes 2>$null
  return (@($runtimes | Where-Object { $_ -match '^Microsoft\.NETCore\.App 10\.' }).Count -gt 0 -and
    @($runtimes | Where-Object { $_ -match '^Microsoft\.WindowsDesktop\.App 10\.' }).Count -gt 0)
}

$systemDotnet = Get-Command dotnet.exe -ErrorAction SilentlyContinue | Select-Object -First 1
$systemRuntimeReady = $false
if ($null -ne $systemDotnet) { $systemRuntimeReady = Test-DesktopRuntime -DotnetPath $systemDotnet.Source }

if ($systemRuntimeReady) {
  Write-Host '.NET 10 Desktop Runtime: 既存環境を使用します。'
} else {
  $localDotnet = Join-Path $runtimeRoot 'dotnet.exe'
  if (-not (Test-DesktopRuntime -DotnetPath $localDotnet)) {
    Write-Host '.NET 10 Desktop Runtimeをユーザー領域へインストールします。'
    $tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("kusakari-canvas-dotnet-{0}" -f [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    try {
      $installer = Join-Path $tempRoot 'dotnet-install.ps1'
      Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile $installer -TimeoutSec 30
      $powerShellExe = Join-Path $PSHOME 'powershell.exe'
      if (-not (Test-Path -LiteralPath $powerShellExe)) { $powerShellExe = 'powershell.exe' }
      & $powerShellExe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installer `
        -Runtime dotnet -Channel '10.0' -Architecture x64 -InstallDir $runtimeRoot -NoPath
      if ($LASTEXITCODE -ne 0) { throw ".NET本体の導入に失敗しました (exit $LASTEXITCODE)。" }
      & $powerShellExe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installer `
        -Runtime windowsdesktop -Channel '10.0' -Architecture x64 -InstallDir $runtimeRoot -NoPath
      if ($LASTEXITCODE -ne 0) { throw ".NET Desktop Runtimeの導入に失敗しました (exit $LASTEXITCODE)。" }
    } finally {
      $resolvedTemporary = [IO.Path]::GetFullPath($tempRoot)
      if ($resolvedTemporary.StartsWith([IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\kusakari-canvas-dotnet-',
          [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $resolvedTemporary)) {
        Remove-Item -LiteralPath $resolvedTemporary -Recurse -Force
      }
    }
    if (-not (Test-DesktopRuntime -DotnetPath $localDotnet)) {
      throw '.NET 10 Desktop Runtimeの導入後確認に失敗しました。'
    }
  } else {
    Write-Host '.NET 10 Desktop Runtime: ユーザー領域の既存環境を使用します。'
  }
}

$desktop = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
if (-not [string]::IsNullOrWhiteSpace($desktop)) {
  $shortcutPath = Join-Path $desktop 'Kusakari Canvas SysOverRay.lnk'
  $startScript = Join-Path $overlayRoot 'start.ps1'
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $powerShellExe = Join-Path $PSHOME 'powershell.exe'
  if (-not (Test-Path -LiteralPath $powerShellExe)) {
    $powerShellExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  }
  $shortcut.TargetPath = $powerShellExe
  $shortcut.Arguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
  $shortcut.WorkingDirectory = $overlayRoot
  $shortcut.IconLocation = "$executable,0"
  $shortcut.Save()
  Write-Host "デスクトップショートカットを作成しました: $shortcutPath"
}
