param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$setup = Join-Path $PSScriptRoot 'setup.ps1'
$launcher = Join-Path $PSScriptRoot 'scripts\start.ps1'

if (-not (Test-Path -LiteralPath $setup -PathType Leaf)) {
  throw "セットアップスクリプトが見つかりません: $setup"
}
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
  throw "起動スクリプトが見つかりません: $launcher"
}

& $setup

& $launcher @PSBoundParameters
