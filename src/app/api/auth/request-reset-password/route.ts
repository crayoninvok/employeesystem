// src/app/api/auth/request-reset-password/route.ts

import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { sendResetPasswordEmail } from "@/lib/nodemailer";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ message: "Email wajib diisi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { message: "User tidak ditemukan" },
      { status: 404 }
    );
  }

  const resetToken = uuidv4();
  const expiry = new Date(Date.now() + 1000 * 60 * 30); // 30 menit

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry: expiry,
    },
  });

  // ✅ Perbaiki urutan
  await sendResetPasswordEmail(email, resetToken, user.name);

  return NextResponse.json({ message: "Link reset password telah dikirim" });
}
