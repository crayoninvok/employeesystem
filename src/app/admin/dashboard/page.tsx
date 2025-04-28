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
  user: {
    name: string;
    email: string;
  };
}

interface Izin {
  id: string;
  tanggal: string;
  type: string;
  alasan: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
}

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [izinList, setIzinList] = useState<Izin[]>([]);
  const [karyawan, setKaryawan] = useState<User[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingCount, setPendingCount] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitId, setSubmitId] = useState("");

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
      if (decoded.role !== "ADMIN") {
        router.push("/login");
        return;
      }
      setUser(decoded);

      const fetchData = async () => {
        try {
          // Fetch attendance data
          const absensiRes = await fetch("/api/absensi/all", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (absensiRes.ok) {
            const absensiData = await absensiRes.json();
            setAbsensi(absensiData.data);
          }

          // Fetch employee data
          const karyawanRes = await fetch("/api/user/all", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (karyawanRes.ok) {
            const karyawanData = await karyawanRes.json();
            setKaryawan(karyawanData.data);
          }

          // Fetch leave requests
          const izinRes = await fetch("/api/izin/all", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (izinRes.ok) {
            const izinData = await izinRes.json();
            setIzinList(izinData.data);

            // Count pending requests
            const pending = izinData.data.filter(
              (izin: Izin) => izin.status === "PENDING"
            ).length;
            setPendingCount(pending);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleApproveReject = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmitLoading(true);
    setSubmitId(id);

    try {
      const res = await fetch("/api/izin/approve", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        // Update the leave request in state
        setIzinList((prevList) =>
          prevList.map((izin) => (izin.id === id ? { ...izin, status } : izin))
        );

        // Update pending count
        setPendingCount((prev) => prev - 1);
      } else {
        const data = await res.json();
        alert(
          data.message ||
            `Gagal ${status === "APPROVED" ? "menyetujui" : "menolak"} izin`
        );
      }
    } catch (error) {
      console.error("Action error:", error);
      alert("Terjadi kesalahan saat memproses permintaan");
    } finally {
      setSubmitLoading(false);
      setSubmitId("");
    }
  };

  const filteredAbsensi = absensi.filter((absen) => {
    const matchName = absen.user.name
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchDate = searchDate
      ? new Date(absen.date).toISOString().split("T")[0] === searchDate
      : true;
    return matchName && matchDate;
  });

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter attendance for today
  const absensiHariIni = absensi.filter((absen) => {
    const absenDate = new Date(absen.date);
    absenDate.setHours(0, 0, 0, 0);
    return absenDate.getTime() === today.getTime();
  });

  // Calculate statistics
  const totalHadir = absensiHariIni.length;
  const totalTidakHadir = karyawan.length - totalHadir;
  const totalKaryawan = karyawan.length;

  // Calculate on-time and late counts
  const tepatWaktu = absensiHariIni.filter((absen) => {
    if (!absen.checkIn) return false;
    const checkInTime = new Date(absen.checkIn);
    return (
      checkInTime.getHours() < 8 ||
      (checkInTime.getHours() === 8 && checkInTime.getMinutes() <= 30)
    );
  }).length;

  const terlambat = totalHadir - tepatWaktu;

  // Format date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  // Calculate izin statistics
  const totalIzin = izinList.length;
  const approvedIzin = izinList.filter(
    (izin) => izin.status === "APPROVED"
  ).length;
  const rejectedIzin = izinList.filter(
    (izin) => izin.status === "REJECTED"
  ).length;

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
                Dashboard Admin
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

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("absensi")}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "absensi"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Data Absensi
            </button>
            <button
              onClick={() => setActiveTab("izin")}
              className={`py-4 px-6 font-medium text-sm border-b-2 flex items-center ${
                activeTab === "izin"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pengajuan Izin
              {pendingCount > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Employees Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Karyawan</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {totalKaryawan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Present Today Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full mr-4">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hadir Hari Ini</p>
                    <p className="text-2xl font-bold text-green-600">
                      {totalHadir}
                    </p>
                  </div>
                </div>
              </div>

              {/* Absent Today Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tidak Hadir</p>
                    <p className="text-2xl font-bold text-red-600">
                      {totalTidakHadir}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Requests Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full mr-4">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Izin Menunggu</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {pendingCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Attendance Stats */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Statistik Kehadiran Hari Ini
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">
                          Kehadiran
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {totalHadir} dari {totalKaryawan} (
                          {totalKaryawan
                            ? Math.round((totalHadir / totalKaryawan) * 100)
                            : 0}
                          %)
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${
                              totalKaryawan
                                ? (totalHadir / totalKaryawan) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">
                          Tepat Waktu
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {tepatWaktu} dari {totalHadir} (
                          {totalHadir
                            ? Math.round((tepatWaktu / totalHadir) * 100)
                            : 0}
                          %)
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{
                            width: `${
                              totalHadir ? (tepatWaktu / totalHadir) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">
                          Terlambat
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {terlambat} dari {totalHadir} (
                          {totalHadir
                            ? Math.round((terlambat / totalHadir) * 100)
                            : 0}
                          %)
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full"
                          style={{
                            width: `${
                              totalHadir ? (terlambat / totalHadir) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Request Stats */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Statistik Pengajuan Izin
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalIzin}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Disetujui</p>
                      <p className="text-2xl font-bold text-green-600">
                        {approvedIzin}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Ditolak</p>
                      <p className="text-2xl font-bold text-red-600">
                        {rejectedIzin}
                      </p>
                    </div>
                  </div>

                  {pendingCount > 0 && (
                    <button
                      onClick={() => setActiveTab("izin")}
                      className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Lihat {pendingCount} Pengajuan Izin Menunggu
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Absensi Terbaru Hari Ini
                  </h2>
                  <p className="text-sm text-gray-500">
                    Data absensi karyawan hari ini
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("absensi")}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  Lihat Semua
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {absensiHariIni.length > 0 ? (
                      absensiHariIni.slice(0, 5).map((absen) => {
                        // Determine status
                        let status = "Belum Check-out";
                        let statusClass = "bg-yellow-100 text-yellow-800";

                        if (absen.checkIn && absen.checkOut) {
                          const checkInTime = new Date(absen.checkIn);
                          const checkInHour = checkInTime.getHours();
                          const checkInMinute = checkInTime.getMinutes();

                          if (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {absen.user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {absen.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {absen.checkIn
                                ? new Date(absen.checkIn).toLocaleTimeString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {absen.checkOut
                                ? new Date(absen.checkOut).toLocaleTimeString()
                                : "-"}
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
                          colSpan={5}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          Belum ada data absensi hari ini
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Data Tab */}
        {activeTab === "absensi" && (
          <div>
            {/* Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-4">Filter Data</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <label
                    htmlFor="searchName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nama Karyawan
                  </label>
                  <input
                    id="searchName"
                    type="text"
                    placeholder="Cari berdasarkan nama"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <label
                    htmlFor="searchDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tanggal
                  </label>
                  <input
                    id="searchDate"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="w-full md:w-1/3 flex items-end">
                  <button
                    onClick={() => {
                      setSearchName("");
                      setSearchDate("");
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Data Absensi</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {filteredAbsensi.length} data ditemukan
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
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
                    {filteredAbsensi.length > 0 ? (
                      filteredAbsensi.map((absen) => {
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
                        let status = "Belum Check-out";
                        let statusClass = "bg-yellow-100 text-yellow-800";

                        if (absen.checkIn && absen.checkOut) {
                          const checkInTime = new Date(absen.checkIn);
                          const checkInHour = checkInTime.getHours();
                          const checkInMinute = checkInTime.getMinutes();

                          if (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {absen.user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {absen.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(absen.date).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {absen.checkIn
                                ? new Date(absen.checkIn).toLocaleTimeString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {absen.checkOut
                                ? new Date(absen.checkOut).toLocaleTimeString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          colSpan={7}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          Tidak ada data yang ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Leave Requests Tab */}
        {activeTab === "izin" && (
          <div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Pengajuan Izin</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Mengelola semua pengajuan izin dari karyawan
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
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
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {izinList.length > 0 ? (
                      izinList.map((izin) => (
                        <tr key={izin.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {izin.user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {izin.user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(izin.tanggal).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {izin.type === "SAKIT"
                              ? "Sakit"
                              : izin.type === "CUTI"
                              ? "Cuti"
                              : "Izin Lainnya"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {izin.alasan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {izin.status === "PENDING" ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Menunggu
                              </span>
                            ) : izin.status === "APPROVED" ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Disetujui
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Ditolak
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {izin.status === "PENDING" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleApproveReject(izin.id, "APPROVED")
                                  }
                                  disabled={
                                    submitLoading && submitId === izin.id
                                  }
                                  className={`px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition ${
                                    submitLoading && submitId === izin.id
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {submitLoading && submitId === izin.id ? (
                                    <svg
                                      className="animate-spin h-4 w-4 text-white"
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
                                  ) : (
                                    "Setuju"
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleApproveReject(izin.id, "REJECTED")
                                  }
                                  disabled={
                                    submitLoading && submitId === izin.id
                                  }
                                  className={`px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition ${
                                    submitLoading && submitId === izin.id
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {submitLoading && submitId === izin.id ? (
                                    <svg
                                      className="animate-spin h-4 w-4 text-white"
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
                                  ) : (
                                    "Tolak"
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
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
          </div>
        )}
      </main>
    </div>
  );
}
