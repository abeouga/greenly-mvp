$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes

$overlayRoot = Split-Path $PSScriptRoot
$app = [IO.Path]::GetFullPath((Join-Path $overlayRoot 'app\SysOverRay.exe'))
$settingsPath = Join-Path $overlayRoot 'app\overlay-settings.json'
$reportPath = Join-Path $PSScriptRoot 'ui-control-report.json'
$observations = [Collections.Generic.List[object]]::new()
$settings = Get-Content -Raw -LiteralPath $settingsPath | ConvertFrom-Json
$frontendPorts = @($settings.FrontendPortRangeStart..$settings.FrontendPortRangeEnd)
$backendPorts = @($settings.BackendPorts)
$allPorts = @($frontendPorts + $backendPorts | Select-Object -Unique)

if (-not (Test-Path -LiteralPath $app -PathType Leaf)) { throw "SysOverRay.exe was not found: $app" }
if ($frontendPorts.Count -eq 0 -or $backendPorts.Count -eq 0) { throw 'Overlay port settings are empty.' }

function Element([string]$Id) {
    $condition = [System.Windows.Automation.PropertyCondition]::new(
        [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $Id)
    return $script:ui.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
}

function Require-Element([string]$Id) {
    $element = Element $Id
    if ($null -eq $element) { throw "Overlay control was not found: $Id" }
    return $element
}

function Open-Overlay {
    $existing = @(Get-Process SysOverRay -ErrorAction SilentlyContinue | Where-Object Path -EQ $app)
    if ($existing.Count -gt 1) { throw 'Multiple SysOverRay overlays are running. Close duplicates before this verification.' }
    if ($existing.Count -eq 1) {
        $script:overlay = $existing[0]
    } else {
        $script:overlay = Start-Process -FilePath $app -WorkingDirectory (Split-Path $app) -PassThru
    }
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    while ([DateTime]::UtcNow -lt $deadline) {
        $script:overlay.Refresh()
        if ($script:overlay.HasExited) { throw "SysOverRay exited during startup ($($script:overlay.ExitCode))." }
        if ($script:overlay.MainWindowHandle -ne [IntPtr]::Zero) {
            $script:ui = [System.Windows.Automation.AutomationElement]::FromHandle($script:overlay.MainWindowHandle)
            if ($null -ne $script:ui -and $null -ne (Element 'SummaryText') -and
                $null -ne (Element 'StartButton') -and $null -ne (Element 'StopButton') -and
                $null -ne (Element 'RestartButton')) { return }
        }
        Start-Sleep -Milliseconds 250
    }
    throw 'SysOverRay controls did not appear within 30 seconds.'
}

function Listeners {
    return @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $script:allPorts -contains $_.LocalPort } |
        Select-Object LocalPort, OwningProcess)
}

function Record([string]$Step) {
    $summary = Require-Element 'SummaryText'
    $lastAction = Require-Element 'LastActionText'
    $stopButton = Require-Element 'StopButton'
    $restartButton = Require-Element 'RestartButton'
    $script:observations.Add([ordered]@{
        step = $Step
        summary = $summary.Current.Name
        lastAction = $lastAction.Current.Name
        stopEnabled = $stopButton.Current.IsEnabled
        restartEnabled = $restartButton.Current.IsEnabled
        listeners = @(Listeners)
    })
}

function Invoke-Control([string]$Id, [string]$Expected) {
    $button = Require-Element $Id
    if (-not $button.Current.IsEnabled) { throw "$Id is disabled." }
    $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    $deadline = [DateTime]::UtcNow.AddSeconds(180)
    do {
        Start-Sleep -Seconds 2
        $action = (Require-Element 'LastActionText').Current.Name
        $summary = (Require-Element 'SummaryText').Current.Name
        if ($action -match $Expected -and (Require-Element 'RestartButton').Current.IsEnabled) { return }
        if ($summary -eq '操作に失敗しました') { throw $action }
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "Timed out waiting for ${Id}: $action"
}

function Get-PortFromLabel([string]$Id) {
    $label = (Require-Element $Id).Current.Name
    $match = [regex]::Match($label, '\b(?<port>\d{2,5})\b')
    if (-not $match.Success) { throw "Port is missing from ${Id}: $label" }
    return [int]$match.Groups['port'].Value
}

function Assert-Healthy {
    $apiPort = Get-PortFromLabel 'BackendLabel'
    $webPort = Get-PortFromLabel 'FrontendLabel'
    if ($backendPorts -notcontains $apiPort) { throw "Unexpected API port: $apiPort" }
    if ($frontendPorts -notcontains $webPort) { throw "Unexpected web port: $webPort" }
    $api = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$apiPort/api/assets" -TimeoutSec 10
    $web = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$webPort/" -TimeoutSec 10
    if ($api.StatusCode -ne 200 -or $api.Headers['X-Kusakari-Canvas-Backend'] -ne 'fastapi' -or
        $web.StatusCode -ne 200 -or $web.Content -notmatch 'Kusakari Canvas') {
        throw 'API or web health check failed.'
    }
    $assetIds = @($api.Content | ConvertFrom-Json | ForEach-Object { $_.id })
    foreach ($assetId in @('tree_oak', 'shrub_boxwood', 'brick_paver', 'bench_wood')) {
        if ($assetIds -notcontains $assetId) { throw "API asset is missing: $assetId" }
    }
}

function Save-Report([string]$Result, [string]$ErrorMessage = '') {
    $report = [ordered]@{
        result = $Result
        verifiedAt = (Get-Date).ToString('o')
        observations = $observations
    }
    if ($ErrorMessage) { $report.error = $ErrorMessage }
    $json = $report | ConvertTo-Json -Depth 8
    Set-Content -LiteralPath $reportPath -Value $json -Encoding UTF8
    return $json
}

try {
    Open-Overlay
    Record 'reopened-existing-session'
    if (-not (Require-Element 'StopButton').Current.IsEnabled) { throw 'Existing session is not controllable.' }
    Invoke-Control 'StopButton' '停止完了'
    Record 'existing-session-stop'
    if (@(Listeners).Count -ne 0) { throw 'Project listeners remained after stop.' }

    Invoke-Control 'RestartButton' '再起動完了'
    Assert-Healthy
    Record 'restart-from-stopped'

    $oldOverlayId = $overlay.Id
    Stop-Process -Id $oldOverlayId -Force
    if (-not $overlay.WaitForExit(5000)) { throw 'Previous overlay did not exit.' }
    Open-Overlay
    if ($overlay.Id -eq $oldOverlayId) { throw 'The old overlay process was reused.' }
    Record 'reopened-running-session'
    if (-not (Require-Element 'StopButton').Current.IsEnabled) { throw 'Reopened session is not controllable.' }

    $before = @(Listeners | ForEach-Object OwningProcess)
    Invoke-Control 'RestartButton' '再起動完了'
    Assert-Healthy
    $after = @(Listeners | ForEach-Object OwningProcess)
    if (@($after | Where-Object { $before -contains $_ }).Count -gt 0) {
        throw 'Restart retained old service processes.'
    }
    Record 'restart-after-reopen'
    Save-Report 'passed'
} catch {
    Save-Report 'failed' $_.Exception.Message | Out-Null
    throw
}
