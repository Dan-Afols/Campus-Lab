Param(
  [switch]$Debug,
  [switch]$SkipPrebuild = $true,
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

Write-Stage "Offline Android build"

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  throw "Java is not installed or not in PATH. Install JDK 17+ and retry."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or not in PATH. Install Node.js 18+ and retry."
}

Assert-Path $mobileDir "Workspace appears incomplete."
Assert-Path (Join-Path $repoRoot "node_modules") "Run dependency install while online first (npm install at repo root)."

if (-not (Test-Path $androidDir) -and $SkipPrebuild) {
  throw "android project not found. Re-run with -SkipPrebuild:$false while online to generate native project."
}

$requiredSdkFiles = @(
  (Join-Path $SdkRoot "platform-tools\adb.exe"),
  (Join-Path $SdkRoot "build-tools\35.0.0\aapt2.exe"),
  (Join-Path $SdkRoot "platforms\android-35\android.jar"),
  (Join-Path $SdkRoot "ndk\26.3.11579264")
)

foreach ($path in $requiredSdkFiles) {
  Assert-Path $path "Install Android SDK prerequisites while online before running offline build."
}

$env:ANDROID_SDK_ROOT = $SdkRoot
$env:ANDROID_HOME = $SdkRoot
$env:GRADLE_USER_HOME = $GradleUserHome

Set-Location $mobileDir

if (-not $SkipPrebuild) {
  Write-Stage "Generating native Android project"
  npx expo prebuild -p android --non-interactive
}

Set-Location $androidDir

$commonArgs = @("--offline", "--no-daemon", "--gradle-user-home", $GradleUserHome)

if ($Debug) {
  Write-Stage "Building debug APK (offline)"
  .\gradlew.bat @commonArgs assembleDebug
  $apkPath = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
} else {
  Write-Stage "Building release APK (offline)"
  .\gradlew.bat @commonArgs assembleRelease
  $apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
}

if (Test-Path $apkPath) {
  $apk = Get-Item $apkPath
  Write-Host "APK built successfully (offline): $($apk.FullName)" -ForegroundColor Green
  Write-Host "APK size: $([Math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor Green
} else {
  throw "Gradle finished but APK was not found at expected path: $apkPath"
}
