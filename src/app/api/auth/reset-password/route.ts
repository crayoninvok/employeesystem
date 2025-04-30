import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token dan password wajib diisi" },
        { status: 400 }
      );
    }

   const user = await prisma.user.findFirst({
     where: {
       resetToken: token,
       resetTokenExpiry: {
         gt: new Date(), // token belum kedaluwarsa
       },
     },
   });

    if (!user) {
      return NextResponse.json(
        { message: "Token tidak valid atau sudah kedaluwarsa" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

   await prisma.user.update({
     where: { id: user.id },
     data: {
       password: hashedPassword,
       resetToken: null,
       resetTokenExpiry: null,
     },
   });

    return NextResponse.json(
      { message: "Password berhasil direset" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
