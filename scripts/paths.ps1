function Get-KusakariCanvasRepoRoot {
  param([Parameter(Mandatory)][string]$StartPath)

  $candidate = [IO.Path]::GetFullPath($StartPath)
  if (Test-Path -LiteralPath $candidate -PathType Leaf) {
    $candidate = Split-Path -Parent $candidate
  }

  while (-not [string]::IsNullOrWhiteSpace($candidate)) {
    $requiredFiles = @(
      'setup.ps1',
      'start.ps1',
      'package.json',
      'backend\pyproject.toml',
      'frontend\package.json',
      'scripts\setup.ps1'
    )
    $complete = $true
    foreach ($relativePath in $requiredFiles) {
      if (-not (Test-Path -LiteralPath (Join-Path $candidate $relativePath) -PathType Leaf)) {
        $complete = $false
        break
      }
    }
    if ($complete) {
      return [IO.Path]::GetFullPath($candidate)
    }

    $parent = Split-Path -Parent $candidate
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $candidate) { break }
    $candidate = $parent
  }

  throw "Kusakari Canvasのプロジェクトルートを特定できません。開始位置: $StartPath"
}

function Resolve-KusakariCanvasPath {
  param(
    [Parameter(Mandatory)][string]$Path,
    [Parameter(Mandatory)][string]$BasePath
  )

  $expandedPath = [Environment]::ExpandEnvironmentVariables($Path.Trim())
  if (-not [IO.Path]::IsPathRooted($expandedPath)) {
    $expandedPath = Join-Path $BasePath $expandedPath
  }
  return [IO.Path]::GetFullPath($expandedPath)
}

function Get-KusakariCanvasHome {
  param([Parameter(Mandatory)][string]$RepoRoot)

  if (-not [string]::IsNullOrWhiteSpace($env:KUSAKARI_CANVAS_HOME)) {
    return Resolve-KusakariCanvasPath -Path $env:KUSAKARI_CANVAS_HOME -BasePath $RepoRoot
  }

  $localData = $env:LOCALAPPDATA
  if ([string]::IsNullOrWhiteSpace($localData)) {
    $localData = [Environment]::GetFolderPath([Environment+SpecialFolder]::LocalApplicationData)
  }
  if ([string]::IsNullOrWhiteSpace($localData)) {
    throw 'Windowsのローカルアプリデータ保存先を取得できません。LOCALAPPDATAを確認してください。'
  }
  $localData = [Environment]::ExpandEnvironmentVariables($localData.Trim())
  if (-not [IO.Path]::IsPathRooted($localData)) {
    throw 'LOCALAPPDATAには絶対パスが必要です。'
  }
  $localData = [IO.Path]::GetFullPath($localData)
  $env:LOCALAPPDATA = $localData

  return [IO.Path]::GetFullPath((Join-Path $localData 'KusakariCanvas'))
}
