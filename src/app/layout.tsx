import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // ✅ import Navbar
import Footer from "@/components/Footer"; // ✅ import Footer
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Employee System",
  description: "Simple employee attendance system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-800`}
      >
        <AuthProvider>
          <Navbar /> {/* ✅ Navbar di atas */}
          <main className="min-h-screen">{children}</main>
          <Footer /> {/* ✅ Footer di bawah */}
        </AuthProvider>
      </body>
    </html>
  );
}
