param(
    [int]$FrontendPortStart = 5173,
    [int]$FrontendPortEnd = 5193,
    [int]$BackendPortStart = 8000,
    [int]$BackendPortEnd = 8020
)

$ErrorActionPreference = 'Stop'

if ($FrontendPortStart -gt $FrontendPortEnd -or $BackendPortStart -gt $BackendPortEnd) {
    Write-Error 'A managed port range is invalid.' -ErrorAction Continue
    exit 2
}

$managedPorts = New-Object 'System.Collections.Generic.HashSet[int]'
foreach ($port in $FrontendPortStart..$FrontendPortEnd) { [void]$managedPorts.Add($port) }
foreach ($port in $BackendPortStart..$BackendPortEnd) { [void]$managedPorts.Add($port) }

function Get-ManagedListeners([System.Collections.Generic.HashSet[int]]$Ports) {
    return @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {
        $Ports.Contains([int]$_.LocalPort)
    })
}

$connections = @(Get-ManagedListeners $managedPorts)
if ($connections.Count -eq 0) {
    Write-Output 'No process is listening on a managed port.'
    exit 0
}

$protected = @($connections | Where-Object { [int]$_.OwningProcess -le 4 })
if ($protected.Count -gt 0) {
    $details = @($protected | ForEach-Object { "port $($_.LocalPort) (PID $($_.OwningProcess))" }) -join '; '
    Write-Error "A protected Windows process owns a managed port and will not be stopped: $details" -ErrorAction Continue
    exit 3
}

$owners = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
foreach ($ownerId in $owners) {
    $process = Get-Process -Id $ownerId -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        continue
    }

    $ownedPorts = @($connections | Where-Object { [int]$_.OwningProcess -eq [int]$ownerId } | Select-Object -ExpandProperty LocalPort -Unique)
    & "$env:SystemRoot\System32\taskkill.exe" /PID ([int]$ownerId) /T /F 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0 -and (Get-Process -Id $ownerId -ErrorAction SilentlyContinue)) {
        Write-Error "Could not stop port owner PID $ownerId ($($process.ProcessName)); ports: $($ownedPorts -join ', ')." -ErrorAction Continue
        exit 4
    }
    Write-Output "Stopped port owner PID $ownerId ($($process.ProcessName)); ports: $($ownedPorts -join ', ')."
}

$remaining = @()
foreach ($attempt in 1..20) {
    $remaining = @(Get-ManagedListeners $managedPorts)
    if ($remaining.Count -eq 0) {
        break
    }
    Start-Sleep -Milliseconds 250
}

if ($remaining.Count -gt 0) {
    $details = @($remaining | ForEach-Object { "port $($_.LocalPort) (PID $($_.OwningProcess))" }) -join '; '
    Write-Error "Managed ports are still in use after stopping their owners: $details" -ErrorAction Continue
    exit 5
}

exit 0
