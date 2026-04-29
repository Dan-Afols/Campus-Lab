$ErrorActionPreference = "Stop"
$base = "https://campuslabs.duckdns.org/api/v1"

function Login($email, $password, $deviceId) {
  $body = @{ email = $email; password = $password; deviceId = $deviceId; os = "windows"; platform = "web" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType "application/json" -Body $body
}

$cr = Login "cr1@univ.edu" "CourseRep@123" "smoke-cr-device"
$student = Login "student@campuslab.app" "Student@123" "smoke-student-device"
$admin = Login "admin@campuslab.app" "Admin@123" "smoke-admin-device"

$crHeaders = @{ Authorization = "Bearer $($cr.accessToken)" }
$studentHeaders = @{ Authorization = "Bearer $($student.accessToken)" }
$adminHeaders = @{ Authorization = "Bearer $($admin.accessToken)" }

$crMe = Invoke-RestMethod -Uri "$base/users/me" -Headers $crHeaders -Method Get
$studentMe = Invoke-RestMethod -Uri "$base/users/me" -Headers $studentHeaders -Method Get

$ts = Get-Date -Format "yyyyMMddHHmmss"
$tmpDir = Join-Path $env:TEMP "campuslab-smoke"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
$pdfPath = Join-Path $tmpDir "smoke-$ts.pdf"
Set-Content -Path $pdfPath -Value "%PDF-1.4`n1 0 obj`n<< /Type /Catalog >>`nendobj`ntrailer`n<<>>`n%%EOF" -Encoding Ascii

$courseCode = ""
$tt = Invoke-RestMethod -Uri "$base/timetable/mine" -Headers $crHeaders -Method Get
if ($tt -and $tt.Count -gt 0 -and $tt[0].course -and $tt[0].course.code) {
  $courseCode = $tt[0].course.code
}
if ([string]::IsNullOrWhiteSpace($courseCode)) {
  $courseCode = "COM101"
}

$materialResp = curl.exe -s -X POST "$base/materials/upload" -H "Authorization: Bearer $($cr.accessToken)" -F "title=Smoke Material $ts" -F "description=Automated smoke upload" -F "courseCode=$courseCode" -F "type=PDF" -F "file=@$pdfPath;type=application/pdf"

$timetableBody = @{ courseCode = $courseCode; dayOfWeek = 2; startsAt = "13:00"; endsAt = "14:00"; venue = "Smoke Hall"; lecturer = "Smoke Test" } | ConvertTo-Json
$ttResp = Invoke-RestMethod -Uri "$base/timetable/course-rep" -Headers $crHeaders -Method Post -ContentType "application/json" -Body $timetableBody

$notifyBody = @{ title = "Smoke Notice $ts"; body = "This is an automated smoke notification"; type = "NEWS" } | ConvertTo-Json
$notifyResp = Invoke-RestMethod -Uri "$base/notifications/broadcast" -Headers $crHeaders -Method Post -ContentType "application/json" -Body $notifyBody

$pastResp = curl.exe -s -X POST "$base/past-questions/upload" -H "Authorization: Bearer $($cr.accessToken)" -F "courseCode=$courseCode" -F "year=2026" -F "file=@$pdfPath;type=application/pdf"

$materialsMine = Invoke-RestMethod -Uri "$base/materials/mine" -Headers $crHeaders -Method Get
$pastMine = Invoke-RestMethod -Uri "$base/past-questions/mine" -Headers $crHeaders -Method Get
$notifsMine = Invoke-RestMethod -Uri "$base/notifications" -Headers $crHeaders -Method Get

$summary = [PSCustomObject]@{
  courseRep = $crMe.email
  student = $studentMe.email
  courseRepRole = $crMe.role
  studentRole = $studentMe.role
  materialUploadRawResponse = $materialResp
  timetableUploadId = $ttResp.id
  notificationDelivered = $notifyResp.delivered
  pastQuestionUploadRawResponse = $pastResp
  materialsCount = ($materialsMine | Measure-Object).Count
  pastQuestionsCount = ($pastMine | Measure-Object).Count
  notificationsCount = ($notifsMine | Measure-Object).Count
}

$summary | ConvertTo-Json -Depth 6
