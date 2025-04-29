import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, divisi } = body; // ✅ tambah divisi disini

    if (!email || !password || !name || !divisi) {
      // ✅ validasi divisi juga
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        divisi, // ✅ save divisi
        role: "KARYAWAN", // ✅ role tetap otomatis
      },
    });

    return NextResponse.json(
      { message: "Karyawan registered successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_KARYAWAN_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
