"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!token) {
      Swal.fire({
        title: "Token Tidak Valid",
        text: "Link reset password tidak valid atau sudah kadaluarsa",
        icon: "error",
        confirmButtonColor: "#4F46E5",
      }).then(() => {
        router.push("/login");
      });
    }
  }, [token, router]);

  const checkPasswordStrength = (pass: string): void => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!token) {
      Swal.fire({
        title: "Error",
        text: "Token tidak ditemukan",
        icon: "error",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        title: "Password Tidak Cocok",
        text: "Pastikan password dan konfirmasi password sama",
        icon: "warning",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    if (password.length < 8) {
      Swal.fire({
        title: "Password Terlalu Pendek",
        text: "Password harus minimal 8 karakter",
        icon: "warning",
        confirmButtonColor: "#4F46E5",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          title: "Berhasil!",
          text: "Password berhasil direset. Silakan login dengan password baru Anda.",
          icon: "success",
          confirmButtonColor: "#4F46E5",
        }).then(() => {
          router.push("/login");
        });
      } else {
        Swal.fire({
          title: "Gagal Reset Password",
          text: data.message || "Gagal mereset password. Silakan coba lagi.",
          icon: "error",
          confirmButtonColor: "#4F46E5",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Terjadi Kesalahan",
        text: "Sistem tidak dapat memproses permintaan Anda saat ini",
        icon: "error",
        confirmButtonColor: "#4F46E5",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (password.length === 0) return "";
    if (passwordStrength === 1) return "Lemah";
    if (passwordStrength === 2) return "Sedang";
    if (passwordStrength === 3) return "Kuat";
    return "Sangat Kuat";
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-100 to-purple-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600 mt-2">
            Buat password baru untuk akun Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password Baru
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="Masukkan password baru"
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={password}
                onChange={handlePasswordChange}
                minLength={8}
              />
              {password && (
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${getStrengthColor()}`}
                      style={{ width: `${passwordStrength * 25}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    Kekuatan Password:{" "}
                    <span className="font-medium">{getStrengthText()}</span>
                  </p>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password minimal 8 karakter dengan kombinasi huruf besar, kecil,
              angka, dan simbol
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Ulangi password baru"
              required
              className={`w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                confirmPassword && password !== confirmPassword
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Password tidak cocok</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Memproses...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>

          <div className="text-center mt-4">
            <a
              href="/login"
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Kembali ke halaman login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
