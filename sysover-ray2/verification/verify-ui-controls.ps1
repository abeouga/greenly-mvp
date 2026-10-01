$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
$app = Join-Path (Split-Path $PSScriptRoot) 'app\SysOverRay.exe'
$observations = [Collections.Generic.List[object]]::new()
function Open-Overlay {
    Start-Process -FilePath $app
    Start-Sleep -Seconds 4
    $script:overlay = Get-Process SysOverRay | Where-Object Path -EQ $app | Select-Object -First 1
    $script:ui = [System.Windows.Automation.AutomationElement]::FromHandle($overlay.MainWindowHandle)
}
function Element($id) {
    $condition = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty,$id)
    $ui.FindFirst([System.Windows.Automation.TreeScope]::Descendants,$condition)
}
function Listeners {
    @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -In @(8080,18081,18082,5173,5174,5175) | Select-Object LocalPort,OwningProcess)
}
function Record($step) {
    $observations.Add([ordered]@{ step=$step; summary=(Element 'SummaryText').Current.Name; lastAction=(Element 'LastActionText').Current.Name; stopEnabled=(Element 'StopButton').Current.IsEnabled; restartEnabled=(Element 'RestartButton').Current.IsEnabled; listeners=@(Listeners) })
}
function Invoke-Control($id,$expected) {
    $button = Element $id
    if (!$button.Current.IsEnabled) { throw "$id is disabled" }
    $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    $deadline = (Get-Date).AddSeconds(180)
    do {
        Start-Sleep -Seconds 2
        $action=(Element 'LastActionText').Current.Name
        if ($action -match $expected -and (Element "RestartButton").Current.IsEnabled) { return }
        if ((Element 'SummaryText').Current.Name -eq '操作に失敗しました') { throw $action }
    } while ((Get-Date) -lt $deadline)
    throw "Timeout: $id ($action)"
}
function Assert-Healthy {
    $api=Invoke-RestMethod 'http://127.0.0.1:8080/api/assets'
    $web=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5173/'
    if ($api.Count -lt 4 -or $web.Content -notmatch 'Greenly') { throw 'Services are unhealthy' }
}
Open-Overlay
Record 'reopened-existing-session'
if (!(Element 'StopButton').Current.IsEnabled) { throw 'Existing session is not controllable' }
Invoke-Control 'StopButton' '停止完了'
Record 'existing-session-stop'
if (@(Listeners).Count -ne 0) { throw 'Project listeners remained after stop' }
Invoke-Control 'RestartButton' '再起動完了'
Assert-Healthy
Record 'restart-from-stopped'
$overlay | Stop-Process -Force
Open-Overlay
Record 'reopened-running-session'
if (!(Element 'StopButton').Current.IsEnabled) { throw 'Reopened session is not controllable' }
$before=@(Listeners | ForEach-Object OwningProcess)
Invoke-Control 'RestartButton' '再起動完了'
Assert-Healthy
$after=@(Listeners | ForEach-Object OwningProcess)
if (@($after | Where-Object { $_ -in $before }).Count -gt 0) { throw 'Restart retained old service processes' }
Record 'restart-after-reopen'
$report=[ordered]@{ result='passed'; verifiedAt=(Get-Date).ToString('o'); observations=$observations }
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'ui-control-report.json') -Encoding utf8
$report | ConvertTo-Json -Depth 8
