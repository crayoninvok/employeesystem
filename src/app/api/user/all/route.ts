import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function GET(req: Request) {
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

    if (decoded.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only Admin can access" },
        { status: 403 }
      );
    }

    // ✅ Cari semua user role KARYAWAN
    const users = await prisma.user.findMany({
      where: {
        role: "KARYAWAN",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ data: users }, { status: 200 });
  } catch (error) {
    console.error("[GET_ALL_USERS_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
