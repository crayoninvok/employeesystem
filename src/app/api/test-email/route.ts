import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "youremail@example.com",
      subject: "Test Email from Resend",
      html: "<p>This is a test email from Resend</p>",
    });

    console.log("Email sent result:", result);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("EMAIL SEND ERROR:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
