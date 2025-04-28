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
    today.setHours(0, 0, 0, 0); // Set jam 00:00:00 supaya cocok di DB

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

    // Update checkOut waktu sekarang
    const checkout = await prisma.absensi.update({
      where: { id: absensi.id },
      data: {
        checkOut: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Checkout berhasil", data: checkout },
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
