param(
  [ValidateSet('auto', 'existing', 'managed')]
  [string]$DatabaseMode = 'auto'
)

$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot

$dependencySetup = Join-Path $repoRoot 'scripts\setup.ps1'
$overlaySetup = Join-Path $repoRoot 'sysover-ray2\setup.ps1'
foreach ($scriptPath in @($dependencySetup, $overlaySetup)) {
  if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
    throw "セットアップスクリプトが見つかりません: $scriptPath"
  }
  if ($scriptPath -eq $dependencySetup) { & $scriptPath -DatabaseMode $DatabaseMode }
  else { & $scriptPath }
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "セットアップに失敗しました: $scriptPath" }
}

Write-Host 'GreenlyとSysOverRayのセットアップが完了しました。'
