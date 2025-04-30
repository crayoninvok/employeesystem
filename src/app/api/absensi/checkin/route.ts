import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Status definitions
type CheckInStatus = "TEPAT_WAKTU" | "TERLAMBAT" | "DILUAR_JADWAL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    // Get current date and time
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Tanggal hari ini jam 00:00:00

    // Cek apakah sudah check-in hari ini
    const existingAbsensi = await prisma.absensi.findFirst({
      where: {
        userId: decoded.id,
        date: today,
      },
    });

    if (existingAbsensi) {
      return NextResponse.json(
        { message: "Sudah check-in hari ini!" },
        { status: 400 }
      );
    }

    // Check time restrictions for check-in
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Convert check-in timeframes to minutes for easier comparison
    const earliestCheckIn = 6 * 60 + 15; // 06:15 WIB
    const onTimeCheckInLimit = 7 * 60 + 30; // 07:30 WIB
    const lateCheckInLimit = 8 * 60 + 30; // 08:30 WIB

    // Determine check-in status
    let status: CheckInStatus;
    if (currentTimeInMinutes < earliestCheckIn) {
      return NextResponse.json(
        { message: "Check-in belum dibuka. Check-in dibuka mulai 06:15 WIB." },
        { status: 400 }
      );
    } else if (currentTimeInMinutes <= onTimeCheckInLimit) {
      status = "TEPAT_WAKTU";
    } else if (currentTimeInMinutes <= lateCheckInLimit) {
      status = "TERLAMBAT";
    } else {
      status = "DILUAR_JADWAL";
    }

    // Create check-in record with status
    const checkin = await prisma.absensi.create({
      data: {
        userId: decoded.id,
        date: today,
        checkIn: now,
        status: status, // Note: This field needs to be added to the Prisma schema
      },
    });

    // Prepare message based on status
    let message = "Check-in berhasil";
    if (status === "TEPAT_WAKTU") {
      message += " - Tepat Waktu";
    } else if (status === "TERLAMBAT") {
      message += " - Terlambat";
    } else {
      message += " - Di Luar Jadwal";
    }

    return NextResponse.json(
      { message: message, data: checkin },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CHECKIN_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
