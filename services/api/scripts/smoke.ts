import axios from "axios";
import { authenticator } from "otplib";

const base = process.env.SMOKE_BASE_URL ?? "http://localhost:4000/api/v1";

async function main() {
  const email = `smoke${Date.now()}@univ.edu`;
  const password = "SmokeTest@123";

  const register = await axios.post(`${base}/auth/register`, {
    fullName: "Smoke User",
    email,
    password,
    matricNumber: `SMK-${Date.now()}`,
    phoneNumber: "08011112222",
    dateOfBirth: "2003-01-01",
    gender: "MALE",
    schoolId: process.env.SMOKE_SCHOOL_ID,
    collegeId: process.env.SMOKE_COLLEGE_ID,
    departmentId: process.env.SMOKE_DEPARTMENT_ID,
    departmentLevelId: process.env.SMOKE_LEVEL_ID,
    role: "STUDENT",
    emergencyContactName: "Parent",
    emergencyContactPhone: "08033334444"
  });

  const verifyOtp = register.data.otp;
  if (!verifyOtp) {
    throw new Error("Missing register OTP. Set EXPOSE_TEST_OTPS=true");
  }

  await axios.post(`${base}/auth/verify-email`, { email, otpCode: verifyOtp });

  const login = await axios.post(`${base}/auth/login`, {
    email,
    password,
    deviceId: "smoke-device-1",
    os: "android"
  });

  const accessToken = login.data.accessToken as string;
  const refreshToken = login.data.refreshToken as string;
  const auth = { headers: { Authorization: `Bearer ${accessToken}` } };

  await axios.post(`${base}/auth/refresh`, { refreshToken });

  const setup2fa = await axios.post(`${base}/auth/2fa/setup`, {}, auth);
  const otpauthUrl = setup2fa.data.otpauthUrl as string;
  const secret = decodeURIComponent(otpauthUrl.split("secret=")[1].split("&")[0]);
  const totp = authenticator.generate(secret);
  await axios.post(`${base}/auth/2fa/verify`, { code: totp }, auth);

  await axios.get(`${base}/users/me`, auth);
  await axios.get(`${base}/timetable/mine`, auth);
  await axios.get(`${base}/materials/mine`, auth);
  await axios.get(`${base}/news`, auth);
  await axios.get(`${base}/hostel/hostels`, auth);
  await axios.get(`${base}/hostel/study-cluster/suggestions`, auth);
  await axios.get(`${base}/past-questions/mine`, auth);
  await axios.post(`${base}/past-questions/practice`, { courseCode: "CPE301", count: 5 }, auth);

  await axios.post(`${base}/materials/web-scrape-fallback`, { courseName: "Data Structures", departmentName: "Computer Engineering" }, auth);

  await axios.post(`${base}/auth/logout`, {}, auth);

  console.log("Smoke tests completed successfully");
}

main().catch((error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  console.error("Smoke tests failed", status, data ?? error.message);
  process.exit(1);
});
