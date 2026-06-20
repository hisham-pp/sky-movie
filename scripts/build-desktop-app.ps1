param(
  [ValidateSet("current", "windows", "mac", "linux", "all")]
  [string] $Target = "current"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$desktopApp = Join-Path $repoRoot "desktop-app"
$distPath = Join-Path $desktopApp "dist"
$isWindowsPlatform = $PSVersionTable.PSEdition -eq "Desktop" -or $PSVersionTable.Platform -eq "Win32NT" -or $env:OS -eq "Windows_NT"
$isMacOSPlatform = -not $isWindowsPlatform -and (Get-Variable -Name IsMacOS -ValueOnly -ErrorAction SilentlyContinue)

function Stop-WindowsBuildOutputProcesses {
  if (-not $isWindowsPlatform) {
    return
  }

  $unpackedPath = Join-Path $distPath "win-unpacked"
  $processNames = @("Sky Movie")
  $seenProcessIds = @{}

  foreach ($processName in $processNames) {
    $nameWithoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($processName)
    foreach ($process in Get-Process -Name $nameWithoutExtension -ErrorAction SilentlyContinue) {
      if ($seenProcessIds.ContainsKey($process.Id)) {
        continue
      }
      $seenProcessIds[$process.Id] = $true

      $processPath = $null
      try {
        $processPath = $process.Path
      }
      catch {
        $processPath = $null
      }

      if ($processPath -and $processPath.StartsWith($unpackedPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        Write-Host "Stopping running packaged app that is locking build output: $($process.ProcessName) ($($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      }
      elseif (-not $processPath) {
        Write-Host "Stopping running packaged app before Windows packaging: $($process.ProcessName) ($($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      }
    }
  }

  Start-Sleep -Seconds 1
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string] $FilePath,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE`: $FilePath $($Arguments -join ' ')"
  }
}

function Remove-DirectoryWithRetry {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  for ($attempt = 1; $attempt -le 8; $attempt++) {
    try {
      Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
      return
    }
    catch {
      if ($attempt -eq 8) {
        throw
      }

      Write-Host "Waiting for Windows to release build files before cleanup... attempt $attempt" -ForegroundColor Yellow
      Start-Sleep -Seconds 2
    }
  }
}

function Remove-StaleWindowsBuildOutput {
  if (-not $isWindowsPlatform) {
    return
  }

  foreach ($path in @((Join-Path $distPath "win-unpacked"), (Join-Path $distPath "win-unpacked.tmp"))) {
    if (-not (Test-Path -LiteralPath $path)) {
      continue
    }

    $resolvedPath = Resolve-Path -LiteralPath $path
    if (-not $resolvedPath.Path.StartsWith($distPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to delete unexpected build output path: $($resolvedPath.Path)"
    }

    Remove-DirectoryWithRetry -Path $resolvedPath.Path
  }
}

function Invoke-Packaging {
  param(
    [Parameter(Mandatory = $true)]
    [string] $PackageScript
  )

  for ($attempt = 1; $attempt -le 3; $attempt++) {
    & pnpm --filter "@sky-movie/desktop-app" run $PackageScript
    if ($LASTEXITCODE -eq 0) {
      return
    }

    if ($attempt -eq 3) {
      throw "Packaging failed after $attempt attempts: $PackageScript"
    }

    Write-Host "Packaging failed. Cleaning output and retrying... attempt $attempt" -ForegroundColor Yellow
    if (Test-Path -LiteralPath $distPath) {
      $resolvedDist = Resolve-Path -LiteralPath $distPath
      if (-not $resolvedDist.Path.StartsWith($desktopApp)) {
        throw "Refusing to delete unexpected dist path: $($resolvedDist.Path)"
      }

      Remove-DirectoryWithRetry -Path $resolvedDist.Path
    }
    Start-Sleep -Seconds 4
  }
}

function Get-PackageScript {
  param([string] $RequestedTarget)

  if ($RequestedTarget -eq "current") {
    if ($isWindowsPlatform) { return "package:win:builder" }
    if ($isMacOSPlatform) { return "package:mac" }
    return "package:linux"
  }

  if ($RequestedTarget -eq "windows") { return "package:win:builder" }
  if ($RequestedTarget -eq "mac") { return "package:mac" }
  if ($RequestedTarget -eq "linux") { return "package:linux" }
  return "package:all"
}

Write-Host "Sky Movie desktop app build" -ForegroundColor Cyan
Write-Host "Repository: $repoRoot"
Write-Host "Target: $Target"

if ($Target -eq "all" -and -not $isMacOSPlatform) {
  Write-Host "Note: macOS DMG/ZIP artifacts should be built on macOS for reliable packaging, signing, and notarization." -ForegroundColor Yellow
}

Push-Location $repoRoot
try {
  $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

  Write-Host "`n1/4 Installing workspace dependencies..." -ForegroundColor Cyan
  Invoke-Step pnpm install

  Write-Host "`n2/4 Rebuilding native modules for Electron..." -ForegroundColor Cyan
  Invoke-Step pnpm --filter "@sky-movie/desktop-app" run rebuild:electron

  Write-Host "`n3/4 Building desktop app bundles..." -ForegroundColor Cyan
  Invoke-Step pnpm --filter "@sky-movie/desktop-app" run build

  Write-Host "`n4/4 Packaging desktop app..." -ForegroundColor Cyan
  Stop-WindowsBuildOutputProcesses
  Remove-StaleWindowsBuildOutput

  if (Test-Path -LiteralPath $distPath) {
    $resolvedDist = Resolve-Path -LiteralPath $distPath
    if (-not $resolvedDist.Path.StartsWith($desktopApp)) {
      throw "Refusing to delete unexpected dist path: $($resolvedDist.Path)"
    }
    Remove-DirectoryWithRetry -Path $resolvedDist.Path
  }

  Invoke-Packaging -PackageScript (Get-PackageScript $Target)

  Write-Host "`nBuild complete." -ForegroundColor Green
  Write-Host "Output:"
  Write-Host "  $(Join-Path $desktopApp "dist")"
}
finally {
  Pop-Location
}
