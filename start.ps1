param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$launcher = Join-Path $PSScriptRoot 'scripts\start.ps1'

if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
  throw "起動スクリプトが見つかりません: $launcher"
}

& $launcher @PSBoundParameters
