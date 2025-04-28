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
      name: string;
    };

    if (decoded.role !== "KARYAWAN") {
      return NextResponse.json(
        { message: "Forbidden: Only Karyawan can create izin" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tanggal, type, alasan } = body;

    if (!tanggal || !type || !alasan) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const newIzin = await prisma.izin.create({
      data: {
        userId: decoded.id,
        tanggal: new Date(tanggal),
        type,
        alasan,
      },
    });

    return NextResponse.json(
      { message: "Izin created", data: newIzin },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CREATE_IZIN_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
