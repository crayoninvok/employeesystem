"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  params: { token: string };
}

export default function ResetPasswordPage({ params }: Props) {
  const { token } = params;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      alert("Password tidak cocok");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Password berhasil diubah. Silakan login kembali.");
        router.push("/login");
      } else {
        alert(data.message || "Gagal reset password");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Reset Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password baru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
          />
          <input
            type="password"
            placeholder="Konfirmasi password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border border-gray-300 px-4 py-2 rounded-lg"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
          >
            {isSubmitting ? "Menyimpan..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
