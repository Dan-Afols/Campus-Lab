Param(
  [switch]$SkipSdkInstall,
  [switch]$SkipNpmInstall,
  [string]$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk",
  [string]$GradleUserHome = "$env:USERPROFILE\.gradle"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$mobileDir = Join-Path $repoRoot "apps\mobile"
$androidDir = Join-Path $mobileDir "android"

function Write-Stage([string]$Message) {
  Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Assert-Path([string]$Path, [string]$Hint) {
  if (-not (Test-Path $Path)) {
    throw "Missing required path: $Path`n$Hint"
  }
}

Write-Stage "Prepare Android caches for offline build"

Assert-Path $mobileDir "Workspace appears incomplete."

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  throw "Java is not installed or not in PATH. Install JDK 17+ and retry."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or not in PATH. Install Node.js 18+ and retry."
}

$env:ANDROID_SDK_ROOT = $SdkRoot
$env:ANDROID_HOME = $SdkRoot
$env:GRADLE_USER_HOME = $GradleUserHome

$sdkManager = Join-Path $SdkRoot "cmdline-tools\latest\bin\sdkmanager.bat"
if (-not $SkipSdkInstall) {
  Assert-Path $sdkManager "Install Android cmdline-tools first."
  Write-Stage "Installing SDK packages"
  & $sdkManager "platform-tools" "build-tools;35.0.0" "platforms;android-35" "ndk;26.3.11579264"
}

Set-Location $repoRoot
if ($SkipNpmInstall -or (Test-Path (Join-Path $repoRoot "node_modules"))) {
  Write-Stage "Skipping JavaScript install (node_modules already available)"
} else {
  Write-Stage "Installing JavaScript dependencies"
  npm install
}

if (-not (Test-Path $androidDir)) {
  Write-Stage "Generating native Android project"
  Set-Location $mobileDir
  npx expo prebuild -p android --non-interactive
}

Write-Stage "Warming Gradle dependency cache"
Set-Location $androidDir
.\gradlew.bat --no-daemon --gradle-user-home $GradleUserHome :app:dependencies

Write-Stage "Running first release build (online)"
.\gradlew.bat --no-daemon --gradle-user-home $GradleUserHome assembleRelease

$apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
  $apk = Get-Item $apkPath
  Write-Host "Preparation complete. Offline-capable APK build is ready." -ForegroundColor Green
  Write-Host "Latest APK: $($apk.FullName)" -ForegroundColor Green
  Write-Host "APK size: $([Math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor Green
} else {
  throw "Preparation finished but release APK was not found at: $apkPath"
}
