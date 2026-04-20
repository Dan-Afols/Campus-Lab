Param(
  [switch]$Debug,
  [switch]$SkipPrebuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$mobileDir = Join-Path $repoRoot "apps\mobile"
$androidDir = Join-Path $mobileDir "android"

function Write-Stage([string]$Message) {
  Write-Host "\n=== $Message ===" -ForegroundColor Cyan
}

Write-Stage "Local Android build without EAS"
Set-Location $mobileDir

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  throw "Java is not installed or not in PATH. Install JDK 17+ and retry."
}

if (-not (Test-Path $androidDir) -and $SkipPrebuild) {
  throw "android project not found. Run without -SkipPrebuild first."
}

if (-not $SkipPrebuild) {
  Write-Stage "Generating native Android project"
  npx expo prebuild -p android
}

Set-Location $androidDir
if ($Debug) {
  Write-Stage "Building debug APK"
  .\gradlew.bat assembleDebug
  $apkPath = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
} else {
  Write-Stage "Building release APK"
  .\gradlew.bat assembleRelease
  $apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
}

if (Test-Path $apkPath) {
  Write-Host "APK built successfully: $apkPath" -ForegroundColor Green
} else {
  throw "Gradle finished but APK was not found at expected path: $apkPath"
}
