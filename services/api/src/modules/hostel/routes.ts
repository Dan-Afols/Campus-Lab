import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.js";
import { prisma } from "../../common/lib/prisma.js";

export const hostelRouter = Router();

hostelRouter.use(authMiddleware);

hostelRouter.get("/hostels", async (req, res) => {
  const hostels = await prisma.hostel.findMany({
    where: { gender: req.user!.gender },
    orderBy: { name: "asc" }
  });
  return res.json(hostels);
});

hostelRouter.get("/hostels/:id/layout", async (req, res) => {
  const hostel = await prisma.hostel.findUnique({
    where: { id: req.params.id },
    include: {
      rooms: {
        include: {
          beds: {
            include: {
              bookings: {
                where: { cancelledAt: null },
                include: { user: true }
              }
            }
          }
        }
      }
    }
  });

  if (!hostel || hostel.gender !== req.user!.gender) {
    return res.status(404).json({ error: "Hostel not found" });
  }

  const rooms = hostel.rooms.map((room) => ({
    ...room,
    beds: room.beds.map((bed) => {
      const active = bed.bookings[0];
      let visualStatus: string = bed.status;

      if (
        active?.user.allowCoursemateLocator &&
        active.user.departmentId === req.user!.departmentId &&
        active.user.departmentLevelId === req.user!.departmentLevelId
      ) {
        visualStatus = "COURSEMATE";
      }

      return {
        id: bed.id,
        bedNumber: bed.bedNumber,
        status: visualStatus,
        occupant: active?.user.allowCoursemateLocator
          ? {
              name: active.user.fullName,
              departmentId: active.user.departmentId,
              departmentLevelId: active.user.departmentLevelId
            }
          : null
      };
    })
  }));

  return res.json({ hostel: { id: hostel.id, name: hostel.name }, rooms });
});

hostelRouter.get("/my-booking", async (req, res) => {
  const booking = await prisma.hostelBooking.findFirst({
    where: { userId: req.user!.id, cancelledAt: null },
    include: {
      bed: {
        include: {
          room: {
            include: {
              hostel: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!booking) {
    return res.status(404).json({ error: "No active hostel booking" });
  }

  return res.json({
    id: booking.id,
    moveInDate: booking.moveInDate,
    createdAt: booking.createdAt,
    bed: {
      id: booking.bed.id,
      bedNumber: booking.bed.bedNumber,
      roomLabel: booking.bed.room.roomLabel,
      floor: booking.bed.room.floor,
      hostel: {
        id: booking.bed.room.hostel.id,
        name: booking.bed.room.hostel.name,
        distanceKm: booking.bed.room.hostel.distanceKm,
        availableBeds: booking.bed.room.hostel.availableBeds
      }
    }
  });
});

hostelRouter.post("/beds/:id/hold", async (req, res) => {
  const bed = await prisma.hostelBed.findUnique({ include: { room: { include: { hostel: true } } }, where: { id: req.params.id } });
  if (!bed || bed.room.hostel.gender !== req.user!.gender || bed.status !== "AVAILABLE") {
    return res.status(400).json({ error: "Bed unavailable" });
  }

  const held = await prisma.hostelBed.update({
    where: { id: req.params.id },
    data: { status: "HELD", heldUntil: new Date(Date.now() + 5 * 60 * 1000) }
  });
  return res.json(held);
});

hostelRouter.post("/beds/:id/book", async (req, res) => {
  const existing = await prisma.hostelBooking.findFirst({
    where: { userId: req.user!.id, cancelledAt: null }
  });
  if (existing) {
    return res.status(409).json({ error: "Only one active booking allowed" });
  }

  const bed = await prisma.hostelBed.findUnique({ include: { room: { include: { hostel: true } } }, where: { id: req.params.id } });
  if (!bed || bed.room.hostel.gender !== req.user!.gender || !["AVAILABLE", "HELD"].includes(bed.status)) {
    return res.status(400).json({ error: "Bed unavailable" });
  }

  const booking = await prisma.$transaction(async (tx) => {
    await tx.hostelBed.update({
      where: { id: bed.id },
      data: { status: "BOOKED", heldUntil: null }
    });

    await tx.hostel.update({
      where: { id: bed.room.hostelId },
      data: { availableBeds: { decrement: 1 } }
    });

    const created = await tx.hostelBooking.create({
      data: {
        userId: req.user!.id,
        bedId: bed.id,
        moveInDate: new Date(req.body.moveInDate)
      }
    });

    await tx.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "HOSTEL_BOOKING_CREATED",
        resource: created.id,
        ipAddress: req.ip
      }
    });

    return created;
  });

  return res.status(201).json(booking);
});

hostelRouter.delete("/bookings/:id", async (req, res) => {
  const booking = await prisma.hostelBooking.findUnique({ where: { id: req.params.id } });
  if (!booking || booking.userId !== req.user!.id || booking.cancelledAt) {
    return res.status(404).json({ error: "Booking not found" });
  }

  const hours = (booking.moveInDate.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hours < 24) {
    return res.status(400).json({ error: "Cancellation window closed" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.hostelBooking.update({ where: { id: booking.id }, data: { cancelledAt: new Date() } });
    await tx.hostelBed.update({ where: { id: booking.bedId }, data: { status: "AVAILABLE" } });
    await tx.auditLog.create({
      data: {
        actorUserId: req.user!.id,
        action: "HOSTEL_BOOKING_CANCELLED",
        resource: booking.id,
        ipAddress: req.ip
      }
    });
  });

  return res.status(204).send();
});

hostelRouter.get("/study-cluster/suggestions", async (req, res) => {
  const myBooking = await prisma.hostelBooking.findFirst({
    where: { userId: req.user!.id, cancelledAt: null },
    include: { bed: { include: { room: { include: { beds: { include: { bookings: { where: { cancelledAt: null }, include: { user: true } } } } } } } } }
  });

  if (!myBooking) {
    return res.json({ suggested: false, reason: "No active hostel booking" });
  }

  const coursemates = myBooking.bed.room.beds
    .flatMap((bed) => bed.bookings)
    .map((b) => b.user)
    .filter(
      (u) =>
        u.id !== req.user!.id &&
        u.departmentId === req.user!.departmentId &&
        u.departmentLevelId === req.user!.departmentLevelId
    );

  return res.json({
    suggested: coursemates.length >= 3,
    count: coursemates.length,
    members: coursemates.map((u) => ({ id: u.id, name: u.fullName }))
  });
});
