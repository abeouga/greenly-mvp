param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [int]$BackendPort = 8000
)

$ErrorActionPreference = 'Stop'
$normalizedRoot = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd('\').ToLowerInvariant()
$devScript = "$normalizedRoot\scripts\dev.ps1"
$backendPython = "$normalizedRoot\backend\.venv\scripts\python.exe"
$frontendModules = "$normalizedRoot\frontend\node_modules"

try {
    $allProcesses = @(Get-CimInstance Win32_Process -ErrorAction Stop)
}
catch {
    # Some managed Windows environments deny Win32_Process command-line
    # queries. In that case, only the backend port owner is considered, and
    # only when its executable is the project's virtual-environment Python.
    $connections = @(Get-NetTCPConnection -State Listen -LocalPort $BackendPort -ErrorAction SilentlyContinue)
    if ($connections.Count -eq 0) {
        Write-Output 'No llm-ocr development process is running.'
        exit 0
    }

    $expectedPython = [System.IO.Path]::GetFullPath($backendPython)
    $owners = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
    $safeOwners = @($owners | Where-Object {
        $candidate = Get-Process -Id $_ -ErrorAction SilentlyContinue
        $candidate -and $candidate.Path -and ([System.IO.Path]::GetFullPath($candidate.Path) -ieq $expectedPython)
    })

    if ($safeOwners.Count -eq 0) {
        Write-Error "The owner of port $BackendPort could not be verified as llm-ocr. No process was stopped."
        exit 2
    }

    foreach ($safeOwner in $safeOwners) {
        & "$env:SystemRoot\System32\taskkill.exe" /PID ([int]$safeOwner) /T /F 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "The llm-ocr backend could not be stopped. PID: $safeOwner"
            exit 3
        }
        Write-Output "Stopped the llm-ocr backend: PID $safeOwner"
    }
    exit 0
}

$matched = @($allProcesses | Where-Object {
    $commandLine = ([string]$_.CommandLine).ToLowerInvariant().Replace('/', '\')
    $isController = $commandLine.Contains($devScript)
    $isBackend = $commandLine.Contains($backendPython) -and $commandLine.Contains('uvicorn') -and $commandLine.Contains('app.main:app')
    $isFrontend = $commandLine.Contains($frontendModules) -and $commandLine.Contains('vite')
    $isController -or $isBackend -or $isFrontend
})

if ($matched.Count -eq 0) {
    Write-Output 'No llm-ocr development process is running.'
    exit 0
}

$matchedIds = @($matched | ForEach-Object { [int]$_.ProcessId })
$roots = @($matched | Where-Object { $matchedIds -notcontains [int]$_.ParentProcessId })
if ($roots.Count -eq 0) {
    $roots = $matched
}

$failed = @()
foreach ($process in $roots) {
    $targetProcessId = [int]$process.ProcessId
    if (-not (Get-Process -Id $targetProcessId -ErrorAction SilentlyContinue)) {
        continue
    }
    try {
        & "$env:SystemRoot\System32\taskkill.exe" /PID $targetProcessId /T /F 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0 -and (Get-Process -Id $targetProcessId -ErrorAction SilentlyContinue)) {
            $failed += $targetProcessId
            continue
        }
        Write-Output "Stopped llm-ocr process tree: PID $targetProcessId"
    }
    catch {
        $failed += $targetProcessId
    }
}

$remaining = $matchedIds
foreach ($attempt in 1..20) {
    $remaining = @($matchedIds | Where-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
    if ($remaining.Count -eq 0) {
        break
    }
    Start-Sleep -Milliseconds 250
}
$failed = @($failed | Where-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue })
if ($failed.Count -gt 0) {
    Write-Error "Some llm-ocr process trees could not be stopped. PID: $(($failed | Select-Object -Unique) -join ', ')"
    exit 3
}

if ($remaining.Count -gt 0) {
    Write-Output "Some terminated process handles are still closing. PID: $(($remaining | Select-Object -Unique) -join ', ')"
}

exit 0
