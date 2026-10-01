param()

$ErrorActionPreference = 'Stop'
$setup = Join-Path $PSScriptRoot 'setup.ps1'
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'Greenly\tools\dotnet-desktop-10'
$executable = Join-Path $PSScriptRoot 'app\SysOverRay.exe'

try {
  & $setup
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'SysOverRayのセットアップに失敗しました。' }

  $systemDotnet = Get-Command dotnet.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  $systemHasDesktopRuntime = $false
  if ($null -ne $systemDotnet) {
    $runtimes = & $systemDotnet.Source --list-runtimes 2>$null
    $systemHasDesktopRuntime = @($runtimes | Where-Object { $_ -match '^Microsoft\.NETCore\.App 10\.' }).Count -gt 0 -and
      @($runtimes | Where-Object { $_ -match '^Microsoft\.WindowsDesktop\.App 10\.' }).Count -gt 0
  }
  if (-not $systemHasDesktopRuntime) {
    $env:DOTNET_ROOT = $runtimeRoot
    $env:DOTNET_ROOT_X64 = $runtimeRoot
    $env:Path = "$runtimeRoot;$env:Path"
  }

  Start-Process -FilePath $executable -WorkingDirectory (Join-Path $PSScriptRoot 'app')
} catch {
  Write-Error $_
  exit 1
}
