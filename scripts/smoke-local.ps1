Param(
  [string]$ApiBase = "http://localhost:4000",
  [string]$ApiV1 = "http://localhost:4000/api/v1",
  [string]$AdminUrl = "http://localhost:5173",
  [string]$PwaUrl = "http://localhost:5174",
  [string]$AdminEmail = "admin@campuslab.app",
  [string]$AdminPassword = "Admin@123",
  [string]$StudentEmail = "student@campuslab.app",
  [string]$StudentPassword = "Student@123",
  [int]$TimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"

function Wait-HttpOk([string]$Url, [int]$MaxSeconds) {
  $start = Get-Date
  while (((Get-Date) - $start).TotalSeconds -lt $MaxSeconds) {
    try {
      $resp = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 4
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
        return $true
      }
    } catch {
      # Keep retrying while service boots
    }
    Start-Sleep -Milliseconds 1000
  }
  return $false
}

Write-Host "== Smoke test: API + Admin ==" -ForegroundColor Cyan

if (-not (Wait-HttpOk -Url "$ApiBase/health" -MaxSeconds $TimeoutSeconds)) {
  throw "API did not become healthy at $ApiBase/health"
}
Write-Host "API health endpoint is up" -ForegroundColor Green

if (-not (Wait-HttpOk -Url $AdminUrl -MaxSeconds $TimeoutSeconds)) {
  throw "Admin UI did not become reachable at $AdminUrl"
}
Write-Host "Admin UI is reachable" -ForegroundColor Green

if (-not (Wait-HttpOk -Url $PwaUrl -MaxSeconds $TimeoutSeconds)) {
  throw "PWA did not become reachable at $PwaUrl"
}
Write-Host "PWA UI is reachable" -ForegroundColor Green

$catalog = Invoke-RestMethod -Uri "$ApiV1/auth/catalog" -Method GET
if (-not $catalog.schools -or $catalog.schools.Count -lt 1) {
  throw "Auth catalog is empty; cannot validate signup flow."
}

$school = $catalog.schools[0]
$college = $school.colleges[0]
$department = $college.departments[0]
$level = $department.levels | Select-Object -First 1

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$signupEmail = "smoke.$stamp@campuslab.app"
$uniquePhone = "080" + $stamp.Substring($stamp.Length - 8)
$uniqueEmergencyPhone = "081" + $stamp.Substring($stamp.Length - 8)
$signupBody = @{
  fullName = "Smoke Signup"
  email = $signupEmail
  password = "Smoke@123"
  matricNumber = "SMK-$stamp"
  phoneNumber = $uniquePhone
  dateOfBirth = "2002-01-01"
  gender = "MALE"
  schoolId = $school.id
  collegeId = $college.id
  departmentId = $department.id
  departmentLevelId = $level.id
  role = "STUDENT"
  emergencyContactName = "Smoke Parent"
  emergencyContactPhone = $uniqueEmergencyPhone
} | ConvertTo-Json

$signupResp = Invoke-RestMethod -Uri "$ApiV1/auth/register" -Method POST -ContentType "application/json" -Body $signupBody
if (-not $signupResp.userId) {
  throw "Signup flow failed: response missing userId."
}
Write-Host "Signup flow works for new user $signupEmail" -ForegroundColor Green

$studentLoginBody = @{
  email = $StudentEmail
  password = $StudentPassword
  deviceId = "smoke-student"
  os = "Windows"
  platform = "web"
} | ConvertTo-Json

$studentLoginResp = Invoke-RestMethod -Uri "$ApiV1/auth/login" -Method POST -ContentType "application/json" -Body $studentLoginBody
if (-not $studentLoginResp.accessToken) {
  throw "Student login failed: no accessToken returned."
}

$studentHeaders = @{ Authorization = "Bearer $($studentLoginResp.accessToken)" }
$meResp = Invoke-RestMethod -Uri "$ApiV1/users/me" -Method GET -Headers $studentHeaders
if (-not $meResp.email) {
  throw "Student protected route check failed on /users/me."
}
Write-Host "PWA student login works and protected route is reachable." -ForegroundColor Green

$adminLoginBody = @{ email = $AdminEmail; password = $AdminPassword } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "$ApiV1/admin/auth/login" -Method POST -ContentType "application/json" -Body $adminLoginBody

$token = $null
if ($loginResp.token) {
  $token = $loginResp.token
} else {
  throw "Admin login did not return a direct token (OTP likely required)."
}

$headers = @{ Authorization = "Bearer $token" }
$systemHealth = Invoke-RestMethod -Uri "$ApiV1/admin/config/system-health" -Method GET -Headers $headers

if (-not $systemHealth.status) {
  throw "Protected system-health call did not return expected payload."
}

Write-Host "Admin login works and protected admin endpoint is reachable." -ForegroundColor Green
Write-Host "System status: $($systemHealth.status)"
