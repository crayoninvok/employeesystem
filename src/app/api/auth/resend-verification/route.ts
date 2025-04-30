import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email sudah diverifikasi" },
        { status: 400 }
      );
    }

    // Generate new token & update user
    const newToken = uuidv4();

    await prisma.user.update({
      where: { email },
      data: { verificationToken: newToken },
    });

    // Send verification email
    const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${newToken}`;

    await resend.emails.send({
      from: "noreply@absenkeun.com",
      to: email,
      subject: "Verifikasi Email Anda - ABSENKEUN",
      html: `
        <h1>Verifikasi Email</h1>
        <p>Klik tombol di bawah ini untuk memverifikasi email Anda:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">Verifikasi Sekarang</a>
        <p>Link hanya berlaku sekali. Abaikan jika Anda tidak merasa mendaftar.</p>
      `,
    });

    return NextResponse.json(
      { message: "Link verifikasi berhasil dikirim ulang" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESEND_VERIFICATION_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengirim ulang verifikasi" },
      { status: 500 }
    );
  }
}
