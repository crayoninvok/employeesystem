import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function PATCH(req: Request) {
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

    if (decoded.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only Admin can approve/reject izin" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    const updateIzin = await prisma.izin.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(
      { message: "Izin updated", data: updateIzin },
      { status: 200 }
    );
  } catch (error) {
    console.error("[APPROVE_IZIN_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
