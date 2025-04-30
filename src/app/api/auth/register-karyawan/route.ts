import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/nodemailer";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, divisi } = body;

    if (!email || !password || !name || !divisi) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);
    const verificationToken = uuidv4();

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        divisi,
        role: "KARYAWAN",
        emailVerified: null,
        verificationToken,
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"Absenkeun" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "Verifikasi Email Akun Absenkeun",
      html: `
    <p>Halo ${name},</p>
    <p>Silakan klik link berikut untuk memverifikasi akun Anda:</p>
    <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
    <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
  `,
    });

    return NextResponse.json(
      { message: "Berhasil mendaftar. Silakan cek email untuk verifikasi." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_KARYAWAN_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
