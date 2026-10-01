param()

$ErrorActionPreference = 'Stop'
$setup = Join-Path $PSScriptRoot 'setup.ps1'
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'Greenly\tools\dotnet-desktop-10'
$executable = Join-Path $PSScriptRoot 'app\SysOverRay.exe'

if (-not ('SysOverRayWindowActivation' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class SysOverRayWindowActivation
{
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetClassName(IntPtr hWnd, StringBuilder className, int count);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern bool ShowWindowAsync(IntPtr hWnd, int command);
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr hWnd);

    public static IntPtr FindMainWindow(uint targetProcessId)
    {
        IntPtr found = IntPtr.Zero;
        EnumWindowsProc callback = (hWnd, _) =>
        {
            uint processId;
            GetWindowThreadProcessId(hWnd, out processId);
            if (processId != targetProcessId) return true;

            var className = new StringBuilder(256);
            GetClassName(hWnd, className, className.Capacity);
            if (!className.ToString().StartsWith("HwndWrapper[SysOverRay;", StringComparison.Ordinal)) return true;

            found = hWnd;
            return false;
        };
        EnumWindows(callback, IntPtr.Zero);
        return found;
    }

    public static void Activate(IntPtr hWnd)
    {
        ShowWindowAsync(hWnd, 9);
        ShowWindowAsync(hWnd, 5);
        SetForegroundWindow(hWnd);
    }
}
'@
}

if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
  throw "SysOverRay.exeが見つかりません: $executable"
}

try {
  $targetExecutable = [IO.Path]::GetFullPath($executable)
  $existingProcesses = @(Get-CimInstance Win32_Process -Filter "Name='SysOverRay.exe'" |
    Where-Object {
      if ([string]::IsNullOrWhiteSpace($_.ExecutablePath)) { return $false }
      try { return [IO.Path]::GetFullPath($_.ExecutablePath) -ieq $targetExecutable } catch { return $false }
    } | Sort-Object -Property CreationDate -Descending)

  if ($existingProcesses.Count -gt 0) {
    $deadline = [DateTime]::UtcNow.AddSeconds(12)
    do {
      foreach ($candidate in $existingProcesses) {
        $stillRunning = Get-CimInstance Win32_Process -Filter "ProcessId=$($candidate.ProcessId)" -ErrorAction SilentlyContinue
        if ($null -eq $stillRunning) { continue }
        $window = [SysOverRayWindowActivation]::FindMainWindow([uint32]$candidate.ProcessId)
        if ($window -eq [IntPtr]::Zero) { continue }
        [SysOverRayWindowActivation]::Activate($window)
        Start-Sleep -Milliseconds 250
        if ([SysOverRayWindowActivation]::IsWindowVisible($window)) {
          Write-Host "既存のSysOverRayを表示しました (PID $($candidate.ProcessId))。"
          return
        }
      }
      Start-Sleep -Milliseconds 250
    } while ([DateTime]::UtcNow -lt $deadline)
    throw '既存のSysOverRayプロセスはありますが、オーバーレイウィンドウを表示できませんでした。重複起動は行いません。'
  }

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

  $process = Start-Process -FilePath $executable -WorkingDirectory (Join-Path $PSScriptRoot 'app') -PassThru
  $deadline = [DateTime]::UtcNow.AddSeconds(15)
  do {
    $process.Refresh()
    if ($process.HasExited) { throw "SysOverRayが起動後に終了しました (exit $($process.ExitCode))。" }
    $window = [SysOverRayWindowActivation]::FindMainWindow([uint32]$process.Id)
    if ($window -ne [IntPtr]::Zero -and [SysOverRayWindowActivation]::IsWindowVisible($window)) {
      Write-Host "SysOverRayの起動を確認しました (PID $($process.Id))。"
      return
    }
    Start-Sleep -Milliseconds 250
  } while ([DateTime]::UtcNow -lt $deadline)
  throw "SysOverRayは起動しましたが、15秒以内にオーバーレイウィンドウを確認できませんでした (PID $($process.Id))。"
} catch {
  Write-Error $_
  exit 1
}
