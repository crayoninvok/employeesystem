"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

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
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [karyawan, setKaryawan] = useState<User[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.role !== "ADMIN") {
      router.push("/login");
      return;
    }

    const fetchAbsensi = async () => {
      const res = await fetch("/api/absensi/all", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setAbsensi(data.data);
      } else {
        alert(data.message);
      }
    };

    const fetchKaryawan = async () => {
      const res = await fetch("/api/user/all", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setKaryawan(data.data);
      } else {
        alert(data.message);
      }
    };

    fetchAbsensi();
    fetchKaryawan();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const absensiHariIni = absensi.filter((absen) => {
    const absenDate = new Date(absen.date);
    absenDate.setHours(0, 0, 0, 0);
    return absenDate.getTime() === today.getTime();
  });

  const totalHadir = absensiHariIni.length;
  const totalTidakHadir = karyawan.length - totalHadir;

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white font-semibold px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Statistik Total */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex gap-6">
        <div className="flex-1 text-center">
          <h2 className="text-3xl font-bold text-green-600">{totalHadir}</h2>
          <p className="text-gray-600">Total Hadir Hari Ini</p>
        </div>
        <div className="flex-1 text-center">
          <h2 className="text-3xl font-bold text-red-600">{totalTidakHadir}</h2>
          <p className="text-gray-600">Total Tidak Hadir Hari Ini</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Cari Nama Karyawan"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="border p-2 rounded w-full md:w-1/3"
          />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="border p-2 rounded w-full md:w-1/3"
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Data Absensi</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b py-2">Nama</th>
              <th className="border-b py-2">Email</th>
              <th className="border-b py-2">Tanggal</th>
              <th className="border-b py-2">Check-in</th>
              <th className="border-b py-2">Check-out</th>
            </tr>
          </thead>
          <tbody>
            {filteredAbsensi.map((absen) => (
              <tr key={absen.id}>
                <td className="py-2">{absen.user.name}</td>
                <td className="py-2">{absen.user.email}</td>
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
    </div>
  );
}
