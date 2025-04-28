"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

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
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState("SAKIT");
  const [alasan, setAlasan] = useState("");
  const [riwayatIzin, setRiwayatIzin] = useState<Izin[]>([]);
  const [activeTab, setActiveTab] = useState("absensi");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [absensiStats, setAbsensiStats] = useState({
    total: 0,
    tepatWaktu: 0,
    terlambat: 0,
    tidakCheckout: 0,
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (decoded.role !== "KARYAWAN") {
        router.push("/login");
        return;
      }
      setUser(decoded);

      const fetchData = async () => {
        try {
          // Fetch absensi data
          const absensiRes = await fetch("/api/absensi/me", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (absensiRes.ok) {
            const absensiData = await absensiRes.json();
            setAbsensi(absensiData.data);

            // Calculate stats
            const stats = {
              total: absensiData.data.length,
              tepatWaktu: 0,
              terlambat: 0,
              tidakCheckout: 0,
            };

            absensiData.data.forEach((item: Absensi) => {
              if (item.checkIn && !item.checkOut) {
                stats.tidakCheckout++;
              }

              if (item.checkIn) {
                const checkInTime = new Date(item.checkIn);
                // Consider 08:30 as the deadline for tepat waktu
                const checkInHour = checkInTime.getHours();
                const checkInMinute = checkInTime.getMinutes();

                if (
                  checkInHour < 8 ||
                  (checkInHour === 8 && checkInMinute <= 30)
                ) {
                  stats.tepatWaktu++;
                } else {
                  stats.terlambat++;
                }
              }
            });

            setAbsensiStats(stats);

            // Check if there's an attendance record for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayData = absensiData.data.find((absensi: Absensi) => {
              const absensiDate = new Date(absensi.date);
              absensiDate.setHours(0, 0, 0, 0);
              return absensiDate.getTime() === today.getTime();
            });

            setTodayAbsensi(todayData || null);
          }

          // Fetch izin data
          const izinRes = await fetch("/api/izin/me", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (izinRes.ok) {
            const izinData = await izinRes.json();

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayIzin = izinData.data.find((izin: Izin) => {
              const izinDate = new Date(izin.tanggal);
              izinDate.setHours(0, 0, 0, 0);
              return (
                izinDate.getTime() === today.getTime() &&
                izin.status === "APPROVED"
              );
            });

            setIzinHariIni(todayIzin || null);
            setRiwayatIzin(izinData.data);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  const handleCheckIn = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/absensi/checkin", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "Gagal melakukan check-in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Terjadi kesalahan saat melakukan check-in");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/absensi/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "Gagal melakukan check-out");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      alert("Terjadi kesalahan saat melakukan check-out");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAjukanIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmitLoading(true);
    try {
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
        const data = await res.json();
        setIsModalOpen(false);
        setAlasan("");
        setType("SAKIT");
        // Refresh the izin list
        const refreshRes = await fetch("/api/izin/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRiwayatIzin(refreshData.data);
        }
        alert("Izin berhasil diajukan!");
      } else {
        const data = await res.json();
        alert(data.message || "Gagal mengajukan izin");
      }
    } catch (error) {
      console.error("Submit izin error:", error);
      alert("Terjadi kesalahan saat mengajukan izin");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Format the date to show day and date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Header with navigation */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Karyawan
              </h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Selamat datang,{" "}
                  <span className="font-medium">{user.name}</span> ({user.email}
                  )
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="px-4 py-2 bg-blue-50 rounded-lg text-blue-700 border border-blue-100">
                <div className="text-xs text-blue-600 mb-1">
                  Tanggal & Waktu
                </div>
                <div className="text-sm font-medium">
                  {formatDate(currentTime)}
                </div>
                <div className="text-xl font-bold">
                  {currentTime.toLocaleTimeString("id-ID")}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white border border-red-500 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance Status */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Status Kehadiran Hari Ini
              </h3>

              {izinHariIni ? (
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m-6-8h6M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-yellow-600 font-bold">
                      {izinHariIni.type === "SAKIT"
                        ? "Sakit"
                        : izinHariIni.type === "CUTI"
                        ? "Cuti"
                        : "Izin Lainnya"}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Izin disetujui untuk hari ini
                    </p>
                  </div>
                </div>
              ) : todayAbsensi ? (
                todayAbsensi.checkOut ? (
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-green-100 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-600 font-bold">
                        Sudah Check-out
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        Check-in:{" "}
                        {new Date(todayAbsensi.checkIn!).toLocaleTimeString()}
                        <br />
                        Check-out:{" "}
                        {new Date(todayAbsensi.checkOut!).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-blue-600 font-bold">
                          Sudah Check-in
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          Pada:{" "}
                          {new Date(todayAbsensi.checkIn!).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCheckOut}
                      disabled={submitLoading}
                      className={`w-full flex justify-center items-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition ${
                        submitLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {submitLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      )}
                      Check-out
                    </button>
                  </div>
                )
              ) : (
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-orange-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-orange-600 font-bold">
                        Belum Check-in
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        Silakan check-in untuk memulai hari kerja
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckIn}
                    disabled={submitLoading}
                    className={`w-full flex justify-center items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition ${
                      submitLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                    )}
                    Check-in
                  </button>
                </div>
              )}
            </div>

            {/* Leave Request */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                Pengajuan Izin
              </h3>

              <div className="h-full flex flex-col">
                <p className="text-gray-600 text-sm mb-4">
                  Jika tidak dapat hadir, silakan ajukan izin dengan mengisi
                  formulir izin
                </p>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-auto flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Ajukan Izin
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">
                Statistik Kehadiran
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Total Kehadiran</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {absensiStats.total}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Tepat Waktu</p>
                  <p className="text-2xl font-bold text-green-600">
                    {absensiStats.tepatWaktu}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Terlambat</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {absensiStats.terlambat}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Tidak Checkout</p>
                  <p className="text-2xl font-bold text-red-500">
                    {absensiStats.tidakCheckout}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("absensi")}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === "absensi"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Riwayat Absensi
              </button>
              <button
                onClick={() => setActiveTab("izin")}
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === "izin"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Riwayat Izin
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "absensi" ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Riwayat Absensi</h2>
              <p className="text-gray-500 text-sm mt-1">
                Catatan kehadiran Anda
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-out
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durasi
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {absensi.length > 0 ? (
                    absensi.map((absen, index) => {
                      const checkInTime = absen.checkIn
                        ? new Date(absen.checkIn)
                        : null;
                      const checkOutTime = absen.checkOut
                        ? new Date(absen.checkOut)
                        : null;

                      // Calculate duration if both check-in and check-out exist
                      let duration = "--:--";
                      if (checkInTime && checkOutTime) {
                        const diff =
                          checkOutTime.getTime() - checkInTime.getTime();
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor(
                          (diff % (1000 * 60 * 60)) / (1000 * 60)
                        );
                        duration = `${hours} jam ${minutes} menit`;
                      }

                      // Determine status
                      let status = "Tidak Check-in";
                      let statusClass = "bg-red-100 text-red-800";

                      if (checkInTime) {
                        const checkInHour = checkInTime.getHours();
                        const checkInMinute = checkInTime.getMinutes();

                        if (!checkOutTime) {
                          status = "Belum Check-out";
                          statusClass = "bg-yellow-100 text-yellow-800";
                        } else if (
                          checkInHour < 8 ||
                          (checkInHour === 8 && checkInMinute <= 30)
                        ) {
                          status = "Tepat Waktu";
                          statusClass = "bg-green-100 text-green-800";
                        } else {
                          status = "Terlambat";
                          statusClass = "bg-orange-100 text-orange-800";
                        }
                      }

                      return (
                        <tr key={absen.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(absen.date).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {checkInTime
                              ? checkInTime.toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {checkOutTime
                              ? checkOutTime.toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {duration}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Belum ada data absensi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Riwayat Izin</h2>
              <p className="text-gray-500 text-sm mt-1">
                Catatan pengajuan izin Anda
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis Izin
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alasan
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {riwayatIzin.length > 0 ? (
                    riwayatIzin.map((izin, index) => (
                      <tr key={izin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(izin.tanggal).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {izin.type === "SAKIT"
                            ? "Sakit"
                            : izin.type === "CUTI"
                            ? "Cuti"
                            : "Izin Lainnya"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {izin.alasan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {izin.status === "PENDING" && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Menunggu
                            </span>
                          )}
                          {izin.status === "APPROVED" && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Disetujui
                            </span>
                          )}
                          {izin.status === "REJECTED" && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Ditolak
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Belum ada pengajuan izin
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Ajukan Izin */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Pengajuan Izin
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAjukanIzin} className="p-6">
              <div className="mb-6">
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Jenis Izin
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="SAKIT">Sakit</option>
                  <option value="CUTI">Cuti</option>
                  <option value="IZIN_LAINNYA">Izin Lainnya</option>
                </select>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="alasan"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Alasan
                </label>
                <textarea
                  id="alasan"
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  rows={4}
                  placeholder="Jelaskan alasan izin Anda..."
                  className="w-full rounded-lg border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium ${
                    submitLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {submitLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Kirim Pengajuan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
