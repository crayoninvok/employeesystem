import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

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

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Set jam 00:00:00 supaya cocok di DB

    // Check time restrictions for check-out
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Convert check-out timeframes to minutes for easier comparison
    const earliestCheckout = 16 * 60; // 16:00 WIB (4 PM)
    const latestCheckout = 21 * 60; // 21:00 WIB (9 PM)

    if (currentTimeInMinutes < earliestCheckout) {
      return NextResponse.json(
        {
          message: "Check-out belum dibuka. Check-out dibuka mulai 16:00 WIB.",
        },
        { status: 400 }
      );
    }

    if (currentTimeInMinutes > latestCheckout) {
      return NextResponse.json(
        {
          message: "Check-out sudah ditutup. Check-out ditutup pada 21:00 WIB.",
        },
        { status: 400 }
      );
    }

    // Cek apakah user sudah check-in hari ini
    const absensi = await prisma.absensi.findFirst({
      where: {
        userId: decoded.id,
        date: today,
      },
    });

    if (!absensi) {
      return NextResponse.json(
        { message: "Belum check-in hari ini, tidak bisa checkout!" },
        { status: 400 }
      );
    }

    if (absensi.checkOut) {
      return NextResponse.json(
        { message: "Sudah checkout hari ini!" },
        { status: 400 }
      );
    }

    // Calculate work duration in hours (for reporting purposes)
    const checkInTime = new Date(absensi.checkIn!);
    const workDurationMs = now.getTime() - checkInTime.getTime();
    const workDurationHours = workDurationMs / (1000 * 60 * 60);

    // Update checkOut waktu sekarang
    const checkout = await prisma.absensi.update({
      where: { id: absensi.id },
      data: {
        checkOut: now,
        workDuration: Math.round(workDurationHours * 100) / 100, // Round to 2 decimal places
      },
    });

    return NextResponse.json(
      {
        message: "Checkout berhasil",
        data: checkout,
        workDuration: `${Math.floor(workDurationHours)} jam ${Math.round((workDurationHours % 1) * 60)} menit`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
