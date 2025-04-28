"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface Absensi {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface Izin {
  id: string;
  tanggal: string;
  type: string;
  status: string;
  alasan: string;
}

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  name: string;
}

export default function KaryawanDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [todayAbsensi, setTodayAbsensi] = useState<Absensi | null>(null);
  const [izinHariIni, setIzinHariIni] = useState<Izin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState("SAKIT");
  const [alasan, setAlasan] = useState("");
  const [riwayatIzin, setRiwayatIzin] = useState<Izin[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.role !== "KARYAWAN") {
      router.push("/login");
      return;
    }
    setUser(decoded);

    const fetchAbsensi = async () => {
      const res = await fetch("/api/absensi/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setAbsensi(data.data);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayData = data.data.find((absensi: Absensi) => {
          const absensiDate = new Date(absensi.date);
          absensiDate.setHours(0, 0, 0, 0);
          return absensiDate.getTime() === today.getTime();
        });

        setTodayAbsensi(todayData || null);
      }
    };

    const fetchIzin = async () => {
      const res = await fetch("/api/izin/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIzin = data.data.find((izin: Izin) => {
          const izinDate = new Date(izin.tanggal);
          izinDate.setHours(0, 0, 0, 0);
          return (
            izinDate.getTime() === today.getTime() && izin.status === "APPROVED"
          );
        });

        setIzinHariIni(todayIzin || null);
        setRiwayatIzin(data.data); // <-- semua izin untuk riwayat
      }
    };


    fetchAbsensi();
    fetchIzin();
  }, [router]);

  const handleCheckIn = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/absensi/checkin", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      alert("Check-in berhasil!");
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/absensi/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      alert("Check-out berhasil!");
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  const handleAjukanIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/izin/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tanggal: new Date().toISOString(),
        type,
        alasan,
      }),
    });

    if (res.ok) {
      alert("Izin berhasil diajukan!");
      setIsModalOpen(false);
      setAlasan("");
      setType("SAKIT");
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Karyawan</h1>
          {user && (
            <p className="text-sm mt-1">
              {user.name} ({user.email}) - {user.role}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Tombol Checkin/Checkout atau Status Izin */}
      <div className="flex gap-4 mb-6">
        {izinHariIni ? (
          <p className="text-yellow-600 font-semibold">
            Hari ini {izinHariIni.type.replace("_", " ")} (izin disetujui)
          </p>
        ) : todayAbsensi ? (
          todayAbsensi.checkOut ? (
            <p className="text-green-600 font-semibold">
              Sudah Check-in dan Check-out hari ini ✅
            </p>
          ) : (
            <button
              onClick={handleCheckOut}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
            >
              Check-out
            </button>
          )
        ) : (
          <button
            onClick={handleCheckIn}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
          >
            Check-in
          </button>
        )}

        {/* Tombol Ajukan Izin */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
        >
          Ajukan Izin
        </button>
      </div>

      {/* Modal Ajukan Izin */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Form Ajukan Izin</h2>
            <form onSubmit={handleAjukanIzin} className="flex flex-col gap-4">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="SAKIT">Sakit</option>
                <option value="CUTI">Cuti</option>
                <option value="IZIN_LAINNYA">Izin Lainnya</option>
              </select>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Alasan izin..."
                className="border p-2 rounded"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Riwayat Absensi */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4">Riwayat Absensi</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b py-2">Tanggal</th>
              <th className="border-b py-2">Check-in</th>
              <th className="border-b py-2">Check-out</th>
            </tr>
          </thead>
          <tbody>
            {absensi.map((absen) => (
              <tr key={absen.id}>
                <td className="py-2">
                  {new Date(absen.date).toLocaleDateString()}
                </td>
                <td className="py-2">
                  {absen.checkIn
                    ? new Date(absen.checkIn).toLocaleTimeString()
                    : "-"}
                </td>
                <td className="py-2">
                  {absen.checkOut
                    ? new Date(absen.checkOut).toLocaleTimeString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Riwayat Izin */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4">Riwayat Izin</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b py-2">Tanggal</th>
              <th className="border-b py-2">Jenis Izin</th>
              <th className="border-b py-2">Alasan</th>
              <th className="border-b py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {riwayatIzin.length > 0 ? (
              riwayatIzin.map((izin) => (
                <tr key={izin.id}>
                  <td className="py-2">
                    {new Date(izin.tanggal).toLocaleDateString()}
                  </td>
                  <td className="py-2">{izin.type.replace("_", " ")}</td>
                  <td className="py-2">{izin.alasan}</td>
                  <td className="py-2">
                    {izin.status === "PENDING" && (
                      <span className="text-yellow-500 font-semibold">
                        Menunggu
                      </span>
                    )}
                    {izin.status === "APPROVED" && (
                      <span className="text-green-600 font-semibold">
                        Disetujui
                      </span>
                    )}
                    {izin.status === "REJECTED" && (
                      <span className="text-red-500 font-semibold">
                        Ditolak
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 text-center" colSpan={4}>
                  Belum ada pengajuan izin
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
