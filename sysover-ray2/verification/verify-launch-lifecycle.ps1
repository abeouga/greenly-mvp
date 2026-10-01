$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes,System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class OverlayForegroundProbe {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);
}
'@
$overlayRoot = Split-Path $PSScriptRoot
$app = Join-Path $overlayRoot 'app\SysOverRay.exe'
$reportPath = Join-Path $PSScriptRoot 'launch-lifecycle-report.json'
$observations = [Collections.Generic.List[object]]::new()

function Element([string]$Id) {
    $condition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty, $Id)
    $script:ui.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
}

function Open-Overlay {
    $previous = @(Get-Process SysOverRay -ErrorAction SilentlyContinue | Where-Object Path -EQ $app | ForEach-Object Id)
    $batch = Join-Path $overlayRoot 'start.bat'
    & cmd.exe /d /c "call `"$batch`" < NUL"
    if ($LASTEXITCODE -ne 0) { throw 'start.bat failed.' }
    $matching = @(Get-Process SysOverRay | Where-Object Path -EQ $app)
    if ($matching.Count -ne 1) { throw "Expected one overlay; found $($matching.Count)." }
    $script:overlay = $matching[0]
    if ($previous -contains $overlay.Id) { throw 'Old overlay process was reused.' }
    $script:ui = [System.Windows.Automation.AutomationElement]::FromHandle($overlay.MainWindowHandle)
    [uint32]$foregroundId = 0
    [void][OverlayForegroundProbe]::GetWindowThreadProcessId([OverlayForegroundProbe]::GetForegroundWindow(), [ref]$foregroundId)
    if ($foregroundId -ne $overlay.Id -or $ui.Current.IsOffscreen) { throw 'Overlay is not visible in the foreground.' }
    foreach ($id in 'StartButton','StopButton','RestartButton') {
        if ($null -eq (Element $id)) { throw "Missing control: $id" }
    }
    $observations.Add([ordered]@{step='batch-launch'; overlayPid=$overlay.Id; replacedOverlayPids=$previous; foreground=$true; title=$ui.Current.Name})
}

function Capture-Overlay([string]$Name) {
    $bounds = $ui.Current.BoundingRectangle
    $bitmap = [Drawing.Bitmap]::new([int]$bounds.Width, [int]$bounds.Height)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.CopyFromScreen([int]$bounds.Left, [int]$bounds.Top, 0, 0, $bitmap.Size)
        $bitmap.Save((Join-Path $PSScriptRoot $Name), [Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}

function Invoke-Control([string]$Id, [string]$Expected) {
    $button = Element $Id
    if (!$button.Current.IsEnabled) { throw "$Id is disabled." }
    $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    $deadline = [DateTime]::UtcNow.AddSeconds(210)
    do {
        Start-Sleep -Seconds 1
        $action = (Element 'LastActionText').Current.Name
        $summary = (Element 'SummaryText').Current.Name
        if ($action -match $Expected -and (Element 'RestartButton').Current.IsEnabled) { return }
        if ($summary -eq '操作に失敗しました' -or $action -match 'タイムアウト|終了しました|失敗') { throw $action }
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "Timeout: $Id ($action)"
}

function Healthy-Session([string]$Step) {
    if ((Element 'SummaryText').Current.Name -ne 'Greenly 稼働中') { throw 'Overlay does not report both services healthy.' }
    $apiPort = [int]([regex]::Match((Element 'BackendLabel').Current.Name, '\d+').Value)
    $webPort = [int]([regex]::Match((Element 'FrontendLabel').Current.Name, '\d+').Value)
    $api = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$apiPort/api/assets" -TimeoutSec 10
    $web = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$webPort/" -TimeoutSec 10
    $proxy = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$webPort/api/assets" -TimeoutSec 10
    if ($api.StatusCode -ne 200 -or $api.Headers['X-Greenly-Backend'] -ne 'fastapi' -or $web.Content -notmatch 'Greenly' -or $proxy.StatusCode -ne 200) { throw 'Real API/Web/proxy health verification failed.' }
    $ids = @(($api.Content | ConvertFrom-Json) | ForEach-Object id)
    foreach ($id in 'tree_oak','shrub_boxwood','brick_paver','bench_wood') { if ($ids -notcontains $id) { throw "Asset missing: $id" } }
    $listeners = @(Get-NetTCPConnection -State Listen | Where-Object LocalPort -In @($apiPort,$webPort) | Select-Object LocalPort,OwningProcess -Unique)
    if (@($listeners.LocalPort | Select-Object -Unique).Count -ne 2) { throw 'API/Web listeners were not found.' }
    $session = [ordered]@{step=$Step; apiPort=$apiPort; webPort=$webPort; apiHttp=$api.StatusCode; webHttp=$web.StatusCode; proxyHttp=$proxy.StatusCode; listeners=$listeners; summary=(Element 'SummaryText').Current.Name; action=(Element 'LastActionText').Current.Name}
    $observations.Add($session)
    return $session
}

function Assert-Replaced($Before, $After) {
    $oldIds = @($Before.listeners.OwningProcess)
    if (@($After.listeners | Where-Object { $oldIds -contains $_.OwningProcess }).Count -gt 0) { throw 'Old listener process survived the new launch.' }
    if (@(Get-Process -Id $oldIds -ErrorAction SilentlyContinue).Count -gt 0) { throw 'Old listener process is still running.' }
}

try {
    Open-Overlay
    Capture-Overlay 'launch-current.png'
    Invoke-Control 'StartButton' '起動完了'
    $first = Healthy-Session 'start'
    Invoke-Control 'StartButton' '起動完了'
    $fresh = Healthy-Session 'start-replaces-existing'
    Assert-Replaced $first $fresh
    Invoke-Control 'StopButton' '停止完了'
    $remaining = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -In @($fresh.apiPort,$fresh.webPort))
    if ($remaining.Count -ne 0) { throw 'Listeners remained after UI stop.' }
    if (@(Get-Process -Id @($fresh.listeners.OwningProcess) -ErrorAction SilentlyContinue).Count -ne 0) { throw 'Listener processes remained after UI stop.' }
    $observations.Add([ordered]@{step='stop'; remainingListeners=0; remainingListenerProcesses=0; action=(Element 'LastActionText').Current.Name})
    Capture-Overlay 'launch-stopped.png'
    Invoke-Control 'StartButton' '起動完了'
    $started = Healthy-Session 'start-after-stop'
    Invoke-Control 'RestartButton' '再起動完了'
    $restarted = Healthy-Session 'restart'
    Assert-Replaced $started $restarted
    Open-Overlay
    Invoke-Control 'RestartButton' '再起動完了'
    $reopened = Healthy-Session 'restart-after-overlay-replacement'
    Assert-Replaced $restarted $reopened
    Capture-Overlay 'launch-final-running.png'
    $report = [ordered]@{result='passed'; verifiedAt=(Get-Date).ToString('o'); observations=$observations}
} catch {
    $report = [ordered]@{result='failed'; verifiedAt=(Get-Date).ToString('o'); error=$_.Exception.Message; observations=$observations}
    $report | ConvertTo-Json -Depth 8 | Set-Content $reportPath -Encoding UTF8
    throw
}
$report | ConvertTo-Json -Depth 8 | Set-Content $reportPath -Encoding UTF8
$report | ConvertTo-Json -Depth 8
