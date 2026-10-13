param(
  [ValidateSet('auto', 'existing', 'managed')]
  [string]$DatabaseMode = 'auto'
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'scripts\paths.ps1')
$repoRoot = Get-KusakariCanvasRepoRoot -StartPath $PSScriptRoot

$dependencySetup = Join-Path $repoRoot 'scripts\setup.ps1'
$overlaySetup = Join-Path $repoRoot 'sysover-ray2\setup.ps1'
foreach ($scriptPath in @($dependencySetup, $overlaySetup)) {
  if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
    throw "セットアップスクリプトが見つかりません: $scriptPath"
  }
  if ($scriptPath -eq $dependencySetup) { & $scriptPath -DatabaseMode $DatabaseMode }
  else { & $scriptPath }
}

Write-Host 'Kusakari CanvasとSysOverRayのセットアップが完了しました。'
