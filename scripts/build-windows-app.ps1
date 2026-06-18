$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$desktopApp = Join-Path $repoRoot "desktop-app"
$distPath = Join-Path $desktopApp "dist"

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

function Invoke-StepWithRetry {
  param(
    [Parameter(Mandatory = $true)]
    [string] $FilePath,

    [Parameter(Mandatory = $true)]
    [string[]] $Arguments,

    [int] $Attempts = 3
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    & $FilePath @Arguments
    if ($LASTEXITCODE -eq 0) {
      return
    }

    if ($attempt -eq $Attempts) {
      throw "Command failed with exit code $LASTEXITCODE`: $FilePath $($Arguments -join ' ')"
    }

    Write-Host "Packaging command failed. Cleaning output and retrying... attempt $attempt" -ForegroundColor Yellow
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

Write-Host "Sky Movie Windows build" -ForegroundColor Cyan
Write-Host "Repository: $repoRoot"

Push-Location $repoRoot
try {
  $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

  Write-Host "`n1/4 Installing workspace dependencies..." -ForegroundColor Cyan
  Invoke-Step pnpm install

  Write-Host "`n2/4 Rebuilding native modules for Electron..." -ForegroundColor Cyan
  Invoke-Step pnpm --filter "@sky-movie/desktop-app" run rebuild:electron

  Write-Host "`n3/4 Building desktop app bundles..." -ForegroundColor Cyan
  Invoke-Step pnpm --filter "@sky-movie/desktop-app" run build

  Write-Host "`n4/4 Creating Windows installer and unpacked folder..." -ForegroundColor Cyan
  if (Test-Path -LiteralPath $distPath) {
    $resolvedDist = Resolve-Path -LiteralPath $distPath
    if (-not $resolvedDist.Path.StartsWith($desktopApp)) {
      throw "Refusing to delete unexpected dist path: $($resolvedDist.Path)"
    }

    Remove-DirectoryWithRetry -Path $resolvedDist.Path
  }

  Invoke-StepWithRetry pnpm @("--filter", "@sky-movie/desktop-app", "run", "package:win") 3

  Write-Host "`nBuild complete." -ForegroundColor Green
  Write-Host "Installer/folder output:"
  Write-Host "  $(Join-Path $desktopApp "dist")"
  Write-Host ""
  Write-Host "Expected files:"
  Write-Host "  $(Join-Path $desktopApp "dist\Sky Movie-0.1.0-x64-Setup.exe")"
  Write-Host "  $(Join-Path $desktopApp "dist\win-unpacked\Sky Movie.exe")"
}
finally {
  Pop-Location
}
