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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const izin = await prisma.izin.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tanggal: true,
        type: true,
        status: true,
        alasan: true, // ✅ tambahkan ini
      },
    });

    return NextResponse.json({ data: izin }, { status: 200 });
  } catch (error) {
    console.error("[GET_MY_IZIN_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
