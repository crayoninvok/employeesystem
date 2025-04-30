"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/request-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        router.push("/email-sent");
      } else {
        const data = await res.json();
        alert(data.message || "Gagal mengirim email reset password");
      }
    } catch (error) {
      console.error("Reset error:", error);
      alert("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Lupa Password?
        </h1>
        <p className="text-gray-600 mb-6">
          Masukkan email Anda, kami akan mengirim link untuk mengganti password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Alamat Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>
      </div>
    </div>
  );
}
