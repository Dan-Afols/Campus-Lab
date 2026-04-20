import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/lib/prisma.js";
import { authMiddleware } from "../../common/middleware/auth.js";
import { requireRole } from "../../common/middleware/roles.js";
import { UserRole, BedStatus } from "@prisma/client";

export const adminHostelRouter = Router();

adminHostelRouter.use(authMiddleware, requireRole(UserRole.ADMIN));

/**
 * GET /admin/hostel/all
 * List all hostels
 */
adminHostelRouter.get("/all", async (req, res) => {
  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        rooms: {
          include: {
            beds: {
              select: {
                id: true,
                bedNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const summary = hostels.map((h) => {
      const allBeds = h.rooms.flatMap((r) => r.beds);
      return {
        ...h,
        totalBeds: allBeds.length,
        occupiedBeds: allBeds.filter((b) => b.status === BedStatus.BOOKED).length,
        vacantBeds: allBeds.filter((b) => b.status === BedStatus.AVAILABLE).length,
      };
    });

    return res.json(summary);
  } catch (error) {
    console.error("Fetch hostels error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/hostel/create
 * Create new hostel
 */
adminHostelRouter.post("/create", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      gender: z.enum(["MALE", "FEMALE"]),
      totalRooms: z.number().min(1),
      bedsPerRoom: z.number().min(1).max(4),
      distanceKm: z.number().min(0),
      departmentId: z.string().optional(),
    });

    const body = schema.parse(req.body);

    const hostel = await prisma.$transaction(async (tx) => {
      const h = await tx.hostel.create({
        data: {
          name: body.name,
          gender: body.gender,
          distanceKm: body.distanceKm,
          totalBeds: body.totalRooms * body.bedsPerRoom,
          availableBeds: body.totalRooms * body.bedsPerRoom,
          departmentId: body.departmentId,
        },
      });

      // Create rooms and beds
      for (let roomNum = 1; roomNum <= body.totalRooms; roomNum++) {
        const room = await tx.hostelRoom.create({
          data: {
            hostelId: h.id,
            floor: Math.ceil(roomNum / 10),
            roomLabel: `Room-${roomNum}`,
          },
        });

        for (let bedNum = 1; bedNum <= body.bedsPerRoom; bedNum++) {
          await tx.hostelBed.create({
            data: {
              roomId: room.id,
              bedNumber: `${bedNum}`,
              status: "AVAILABLE" as any,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "HOSTEL_CREATED",
          resource: h.id,
          metadata: { totalRooms: body.totalRooms, bedsPerRoom: body.bedsPerRoom },
          ipAddress: req.ip || "unknown",
        },
      });

      return h;
    });

    return res.status(201).json(hostel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Create hostel error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/hostel/:id/beds
 * Get all beds in a hostel with occupancy info
 */
adminHostelRouter.get("/:id/beds", async (req, res) => {
  try {
    const beds = await prisma.hostelBed.findMany({
      where: {
        room: {
          hostelId: req.params.id,
        },
      },
      include: {
        room: {
          select: { id: true, roomLabel: true, floor: true },
        },
        bookings: {
          where: { cancelledAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            userId: true,
            moveInDate: true,
            user: {
              select: { id: true, fullName: true, email: true, matricNumberEncrypted: true },
            },
          },
        },
      },
      orderBy: [{ room: { roomLabel: "asc" } }, { bedNumber: "asc" }],
    });

    return res.json(
      beds.map((bed) => {
        const activeBooking = bed.bookings[0];
        return {
          id: bed.id,
          roomNumber: bed.room.roomLabel,
          roomLabel: bed.room.roomLabel,
          floor: bed.room.floor,
          bedNumber: bed.bedNumber,
          status: bed.status,
          currentBooking: activeBooking
            ? {
                id: activeBooking.id,
                userId: activeBooking.userId,
                moveInDate: activeBooking.moveInDate,
                student: {
                  id: activeBooking.user.id,
                  name: activeBooking.user.fullName,
                  fullName: activeBooking.user.fullName,
                  email: activeBooking.user.email,
                  matricNumber: activeBooking.user.matricNumberEncrypted,
                },
              }
            : null,
        };
      })
    );
  } catch (error) {
    console.error("Fetch beds error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/hostel/:bedId/assign
 * Assign student to bed
 */
adminHostelRouter.post("/:bedId/assign", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().min(1),
      moveInDate: z.string().datetime(),
    });

    const body = schema.parse(req.body);

    // Check if bed is available
    const bed = await prisma.hostelBed.findUnique({
      where: { id: req.params.bedId },
      include: { bookings: { take: 1 } },
    });

    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    if (bed.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Bed is not available" });
    }

    const booking = await prisma.$transaction([
      prisma.hostelBooking.create({
        data: {
          bedId: req.params.bedId,
          userId: body.userId,
          moveInDate: new Date(body.moveInDate),
        },
      }),
      prisma.hostelBed.update({
        where: { id: req.params.bedId },
        data: { status: "BOOKED" as any },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "HOSTEL_BED_ASSIGNED",
          resource: req.params.bedId,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(201).json(booking[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    console.error("Assign bed error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /admin/hostel/:bookingId/checkout
 * Check out student from bed
 */
adminHostelRouter.post("/:bookingId/checkout", async (req, res) => {
  try {
    const booking = await prisma.hostelBooking.findUnique({
      where: { id: req.params.bookingId },
      include: { bed: true },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.cancelledAt) {
      return res.status(400).json({ message: "Booking already checked out" });
    }

    await prisma.$transaction([
      prisma.hostelBooking.update({
        where: { id: req.params.bookingId },
        data: { cancelledAt: new Date() },
      }),
      prisma.hostelBed.update({
        where: { id: booking.bedId },
        data: { status: "AVAILABLE" as any },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: req.user!.id,
          action: "HOSTEL_BED_VACANT",
          resource: req.params.bookingId,
          ipAddress: req.ip || "unknown",
        },
      }),
    ]);

    return res.status(204).send();
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/hostel/bookings
 * Get all hostel bookings with filters
 */
adminHostelRouter.get("/bookings/list", async (req, res) => {
  try {
    const bookings = await prisma.hostelBooking.findMany({
      where: { cancelledAt: null },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        bed: {
          select: {
            id: true,
            bedNumber: true,
            room: {
              select: {
                hostel: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { moveInDate: "desc" },
      take: 100,
    });

    return res.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /admin/hostel/occupancy-report
 * Get occupancy statistics
 */
adminHostelRouter.get("/occupancy-report", async (req, res) => {
  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        rooms: {
          include: {
            beds: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const report = hostels.map((hostel) => {
      const allBeds = hostel.rooms.flatMap((r) => r.beds);
      const bookedCount = allBeds.filter((b) => b.status === "BOOKED").length;
      const totalBeds = allBeds.length;

      return {
        id: hostel.id,
        name: hostel.name,
        gender: hostel.gender,
        totalBeds,
        occupiedBeds: bookedCount,
        availableBeds: totalBeds - bookedCount,
        occupancyRate: totalBeds > 0 ? ((bookedCount / totalBeds) * 100).toFixed(2) + "%" : "0%",
      };
    });

    return res.json(report);
  } catch (error) {
    console.error("Fetch occupancy report error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
