import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";
import { encryptField } from "../src/common/utils/crypto.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.stepLog.deleteMany();
  await prisma.sleepLog.deleteMany();
  await prisma.hydrationLog.deleteMany();
  await prisma.savingsDeposit.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.hostelBooking.deleteMany();
  await prisma.hostelBed.deleteMany();
  await prisma.hostelRoom.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.materialRating.deleteMany();
  await prisma.bookmarkedMaterial.deleteMany();
  await prisma.bookmarkedNews.deleteMany();
  await prisma.newsTarget.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.pastQuestion.deleteMany();
  await prisma.material.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.course.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.departmentLevel.deleteMany();
  await prisma.department.deleteMany();
  await prisma.college.deleteMany();
  await prisma.school.deleteMany();

  const catalog = [
    "McPherson University",
    "Covenant University",
    "Babcock University",
    "Bowen University",
    "Afe Babalola University",
    "American University of Nigeria",
    "Lead City University",
    "Nile University of Nigeria",
    "Pan-Atlantic University",
    "Redeemer's University",
  ].map((schoolName) => ({
    schoolName,
    colleges: [
      {
        name: "College of Computing and Engineering",
        departments: [
          "Computer Science",
          "Software Engineering",
          "Information Technology",
          "Electrical and Electronics Engineering",
        ],
      },
      {
        name: "College of Management and Social Sciences",
        departments: ["Accounting", "Business Administration", "Economics", "Mass Communication"],
      },
      {
        name: "College of Natural and Applied Sciences",
        departments: ["Microbiology", "Biochemistry", "Physics with Electronics", "Mathematics"],
      },
    ],
  }));

  const schools = [] as any[];
  for (const item of catalog) {
    const school = await prisma.school.create({ data: { name: item.schoolName } });
    schools.push(school);

    for (const collegeItem of item.colleges) {
      const college = await prisma.college.create({ data: { name: collegeItem.name, schoolId: school.id } });

      for (const dep of collegeItem.departments) {
        const department = await prisma.department.create({
          data: { name: dep, collegeId: college.id }
        });

        for (const level of [100, 200, 300, 400, 500]) {
          await prisma.departmentLevel.create({
            data: { departmentId: department.id, level }
          });
        }
      }
    }
  }

  const allDepartments = await prisma.department.findMany({ include: { college: true } });
  const allLevels = await prisma.departmentLevel.findMany();

  const adminPass = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.create({
    data: {
      fullName: "Campus Admin",
      email: "admin@campuslab.app",
      passwordHash: adminPass,
      matricNumberEncrypted: encryptField("ADMIN-001"),
      phoneNumber: "08000000000",
      dobEncrypted: encryptField("1990-01-01"),
      gender: "MALE",
      role: UserRole.ADMIN,
      status: "ACTIVE",
      schoolId: schools[0].id,
      collegeId: allDepartments[0].collegeId,
      departmentId: allDepartments[0].id,
      departmentLevelId: allLevels[0].id,
      emergencyContactName: "Admin Contact",
      emergencyContactPhone: "08011111111",
      emailVerifiedAt: new Date(),
      notificationPrefs: { create: {} }
    }
  });

  await prisma.user.create({
    data: {
      fullName: "Showcase Admin",
      email: "showcase@campuslab.app",
      passwordHash: await bcrypt.hash("Showcase@123!", 12),
      matricNumberEncrypted: encryptField("ADMIN-SHOWCASE"),
      phoneNumber: "08099990000",
      dobEncrypted: encryptField("1990-01-01"),
      gender: "MALE",
      role: UserRole.ADMIN,
      status: "ACTIVE",
      schoolId: schools[0].id,
      collegeId: allDepartments[0].collegeId,
      departmentId: allDepartments[0].id,
      departmentLevelId: allLevels[0].id,
      emergencyContactName: "Showcase Contact",
      emergencyContactPhone: "08099991111",
      emailVerifiedAt: new Date(),
      notificationPrefs: { create: {} }
    }
  });

  await prisma.user.create({
    data: {
      fullName: "Operations Admin",
      email: "opsadmin@campuslab.app",
      passwordHash: await bcrypt.hash("OpsAdmin@123", 12),
      matricNumberEncrypted: encryptField("ADMIN-OPS-001"),
      phoneNumber: "08077770000",
      dobEncrypted: encryptField("1991-03-10"),
      gender: "MALE",
      role: UserRole.ADMIN,
      status: "ACTIVE",
      schoolId: schools[0].id,
      collegeId: allDepartments[0].collegeId,
      departmentId: allDepartments[0].id,
      departmentLevelId: allLevels[0].id,
      emergencyContactName: "Ops Contact",
      emergencyContactPhone: "08077771111",
      emailVerifiedAt: new Date(),
      notificationPrefs: { create: {} }
    }
  });

  await prisma.user.create({
    data: {
      fullName: "PWA Demo Student",
      email: "student@campuslab.app",
      passwordHash: await bcrypt.hash("Student@123", 12),
      matricNumberEncrypted: encryptField("PWA-STUDENT-001"),
      phoneNumber: "08066660000",
      dobEncrypted: encryptField("2003-02-14"),
      gender: "FEMALE",
      role: UserRole.STUDENT,
      status: "ACTIVE",
      schoolId: schools[0].id,
      collegeId: allDepartments[0].collegeId,
      departmentId: allDepartments[0].id,
      departmentLevelId: allLevels[0].id,
      emergencyContactName: "PWA Parent",
      emergencyContactPhone: "08066661111",
      emailVerifiedAt: new Date(),
      notificationPrefs: { create: {} }
    }
  });

  const students = [] as any[];
  const namedStudents = [
    "Afolabi Daniel",
    "Hammed Wajud",
    "Diekoloreoluwa Adebayo",
    "Temitope Aina",
    "Anjola Ogunleye",
    "Ifeoluwa Ajayi",
    "Chinaza Okonkwo",
    "Mariam Bello",
    "David Nwachukwu",
    "Kehinde Ojo",
    "Samuel Adeyemi",
    "Ruth George",
  ];

  for (let i = 1; i <= 24; i++) {
    const dep = allDepartments[i % allDepartments.length];
    const level = allLevels.find((l: any) => l.departmentId === dep.id && l.level === [100, 200, 300, 400, 500][i % 5])!;
    const schoolId = dep.college.schoolId;
    const fullName = namedStudents[i - 1] || `Student ${i}`;
    const emailSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

    const user = await prisma.user.create({
      data: {
        fullName,
        email: `${emailSlug || `student${i}`}@univ.edu`,
        passwordHash: await bcrypt.hash("Student@123", 12),
        matricNumberEncrypted: encryptField(`MAT-${1000 + i}`),
        phoneNumber: `0801234${(1000 + i).toString().slice(0, 4)}`,
        dobEncrypted: encryptField("2002-01-01"),
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        role: UserRole.STUDENT,
        status: "ACTIVE",
        schoolId,
        collegeId: dep.collegeId,
        departmentId: dep.id,
        departmentLevelId: level.id,
        emergencyContactName: `Parent ${i}`,
        emergencyContactPhone: `0808888${(1000 + i).toString().slice(0, 4)}`,
        emailVerifiedAt: new Date(),
        notificationPrefs: { create: {} }
      }
    });
    students.push(user);
  }

  const courseRepNames = ["Ibrahim Sanni", "Kelechi Obi", "Aisha Lawal", "Tobi Alade", "Bolanle Yusuf"];
  for (let i = 0; i < courseRepNames.length; i++) {
    const dep = allDepartments[i];
    const level = allLevels.find((l: any) => l.departmentId === dep.id && l.level === 300)!;
    await prisma.user.create({
      data: {
        fullName: courseRepNames[i],
        email: `cr${i + 1}@univ.edu`,
        passwordHash: await bcrypt.hash("CourseRep@123", 12),
        matricNumberEncrypted: encryptField(`CR-${i + 1}`),
        phoneNumber: `0805555${i + 1}000`,
        dobEncrypted: encryptField("2001-05-01"),
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        role: UserRole.COURSE_REP,
        status: "ACTIVE",
        schoolId: dep.college.schoolId,
        collegeId: dep.collegeId,
        departmentId: dep.id,
        departmentLevelId: level.id,
        emergencyContactName: "Parent",
        emergencyContactPhone: "08012345678",
        emailVerifiedAt: new Date(),
        notificationPrefs: { create: {} }
      }
    });
  }

  for (const dep of allDepartments.slice(0, 5)) {
    for (let c = 1; c <= 2; c++) {
      await prisma.course.create({
        data: {
          code: `${dep.name.slice(0, 3).toUpperCase()}${100 + c}`,
          title: `${dep.name} Course ${c}`,
          departmentId: dep.id
        }
      });
    }
  }

  const demoCourses = await prisma.course.findMany();
  for (const dep of allDepartments.slice(0, 4)) {
    const level = allLevels.find((l: any) => l.departmentId === dep.id && l.level === 300)!;
    const depCourses = demoCourses.filter((c: any) => c.departmentId === dep.id);

    for (const [idx, course] of depCourses.entries()) {
      await prisma.timetable.create({
        data: {
          collegeId: dep.collegeId,
          departmentId: dep.id,
          departmentLevelId: level.id,
          courseId: course.id,
          dayOfWeek: idx + 1,
          startsAt: "09:00",
          endsAt: "11:00",
          venue: `LT-${idx + 1}`,
          lecturer: `Dr. ${dep.name.split(" ")[0]}`,
          colorHex: ["#4A90E2", "#4CAF50", "#FF6B6B"][idx % 3]
        }
      });
    }
  }

  const uploader = students[0];
  for (let i = 1; i <= 12; i++) {
    const course = demoCourses[i % demoCourses.length];
    const level = allLevels.find((l: any) => l.departmentId === course.departmentId)!;
    await prisma.material.create({
      data: {
        title: `Material ${i}`,
        description: "Sample lecture resource",
        type: i % 2 === 0 ? "PDF" : "MP3",
        courseId: course.id,
        departmentId: course.departmentId,
        departmentLevelId: level.id,
        uploadedById: uploader.id,
        fileUrl: `https://cdn.example.com/material-${i}`,
        aiSummary: "AI summary preview",
        approvedByAdmin: true
      }
    });
  }

  for (let i = 0; i < Math.min(20, demoCourses.length); i++) {
    const course = demoCourses[i];
    const dep = allDepartments.find((d: any) => d.id === course.departmentId);
    if (!dep) continue;
    await prisma.pastQuestion.create({
      data: {
        departmentId: dep.id,
        courseCode: course.code,
        year: 2020 + (i % 5),
        fileUrl: `https://cdn.example.com/past-questions/${course.code}-${2020 + (i % 5)}.pdf`,
        uploadedById: uploader.id,
      },
    });
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.newsPost.create({
      data: {
        title: `Campus Update ${i}`,
        body: `Important university update #${i}`,
        category: ["ACADEMIC", "EVENTS", "URGENT_ALERTS", "SPORTS", "ADMINISTRATION"][i % 5] as any,
        isPinned: i <= 2,
        isUrgent: i % 4 === 0,
        isGlobal: i % 2 === 0,
        createdById: admin.id,
        schoolId: schools[0].id
      }
    });
  }

  const hostelSpecs = [
    { name: "Nile Hall", gender: "MALE" },
    { name: "Danube Hall", gender: "MALE" },
    { name: "Amazon Hall", gender: "MALE" },
    { name: "Zambezi Hall", gender: "FEMALE" },
    { name: "Volga Hall", gender: "FEMALE" }
  ] as const;

  for (const spec of hostelSpecs) {
    const hostel = await prisma.hostel.create({
      data: {
        name: spec.name,
        gender: spec.gender,
        totalBeds: 50,
        availableBeds: 40,
        distanceKm: 1.2
      }
    });

    const rooms = [] as any[];
    for (let floor = 1; floor <= 5; floor++) {
      const room = await prisma.hostelRoom.create({
        data: { hostelId: hostel.id, floor, roomLabel: `R${floor}01` }
      });
      rooms.push(room);
      for (let bedNo = 1; bedNo <= 10; bedNo++) {
        await prisma.hostelBed.create({
          data: { roomId: room.id, bedNumber: `B${bedNo}`, status: bedNo <= 2 ? "BOOKED" : "AVAILABLE" }
        });
      }
    }

    const bookedBeds = await prisma.hostelBed.findMany({ where: { room: { hostelId: hostel.id }, status: "BOOKED" }, take: 10 });
    for (let i = 0; i < bookedBeds.length; i++) {
      const user = students.find((s) => s.gender === spec.gender) ?? students[0];
      await prisma.hostelBooking.create({
        data: {
          userId: user.id,
          bedId: bookedBeds[i].id,
          moveInDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  for (const student of students.slice(0, 8)) {
    for (let d = 0; d < 7; d++) {
      await prisma.expense.create({
        data: {
          userId: student.id,
          amount: 500 + d * 50,
          category: "FOOD",
          description: "Daily meal",
          spentAt: new Date(Date.now() - d * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  for (const student of students.slice(0, 8)) {
    for (let d = 0; d < 3; d++) {
      await prisma.hydrationLog.create({
        data: {
          userId: student.id,
          cups: 5 + d,
          loggedAt: new Date(Date.now() - d * 24 * 60 * 60 * 1000)
        }
      });

      await prisma.sleepLog.create({
        data: {
          userId: student.id,
          sleptAt: new Date(Date.now() - d * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000),
          wokeAt: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
          qualityRating: 4
        }
      });

      await prisma.stepLog.create({
        data: {
          userId: student.id,
          steps: 5000 + d * 1200,
          distanceKm: 4 + d,
          calories: (5000 + d * 1200) * 0.04,
          loggedAt: new Date(Date.now() - d * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
