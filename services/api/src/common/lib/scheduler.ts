import cron from "node-cron";
import { prisma } from "./prisma.js";

export function startSchedulers() {
  // Hydration reminder heartbeat every 2 hours.
  cron.schedule("0 */2 * * *", async () => {
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "HEALTH",
          title: "Hydration reminder",
          body: "Time to drink water. Keep your focus strong."
        }))
      });
    }
  });

  // Check every 5 minutes for classes starting in ~15 minutes.
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    const target = new Date(now.getTime() + 15 * 60 * 1000);
    const targetDay = target.getDay() === 0 ? 7 : target.getDay();
    const hh = String(target.getHours()).padStart(2, "0");
    const mm = String(target.getMinutes()).padStart(2, "0");
    const targetTime = `${hh}:${mm}`;

    const slots = await prisma.timetable.findMany({
      where: { dayOfWeek: targetDay, startsAt: targetTime },
      select: { course: { select: { code: true, title: true } }, departmentId: true, departmentLevelId: true }
    });

    for (const slot of slots) {
      const users = await prisma.user.findMany({
        where: {
          departmentId: slot.departmentId,
          departmentLevelId: slot.departmentLevelId,
          notificationPrefs: { some: { classReminder: true } }
        },
        select: { id: true }
      });

      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            type: "CLASS_REMINDER",
            title: "Class starts soon",
            body: `${slot.course.code} ${slot.course.title} starts in 15 minutes.`
          }))
        });
      }
    }
  });
}
