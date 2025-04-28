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

    const today = new Date();
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

    // ✅ PERBAIKAN: data harus ada 'date'
    const checkin = await prisma.absensi.create({
      data: {
        userId: decoded.id,
        date: today, // <-- tambah ini
        checkIn: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Check-in berhasil", data: checkin },
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
