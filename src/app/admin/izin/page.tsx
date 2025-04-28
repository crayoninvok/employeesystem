"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

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

export default function IzinAdminPage() {
  const router = useRouter();
  const [izinList, setIzinList] = useState<Izin[]>([]);

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

    const fetchIzin = async () => {
      const res = await fetch("/api/izin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setIzinList(data.data);
      } else {
        alert(data.message);
      }
    };

    fetchIzin();
  }, [router]);

  const handleApproveReject = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/izin/approve", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });

    if (res.ok) {
      alert(`Izin ${status.toLowerCase()}!`);
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-800">
      <h1 className="text-2xl font-bold mb-6">List Pengajuan Izin</h1>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b py-2">Nama</th>
              <th className="border-b py-2">Email</th>
              <th className="border-b py-2">Tanggal</th>
              <th className="border-b py-2">Tipe</th>
              <th className="border-b py-2">Alasan</th>
              <th className="border-b py-2">Status</th>
              <th className="border-b py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {izinList.map((izin) => (
              <tr key={izin.id}>
                <td className="py-2">{izin.user.name}</td>
                <td className="py-2">{izin.user.email}</td>
                <td className="py-2">
                  {new Date(izin.tanggal).toLocaleDateString()}
                </td>
                <td className="py-2">{izin.type}</td>
                <td className="py-2">{izin.alasan}</td>
                <td className="py-2">{izin.status}</td>
                <td className="py-2 flex gap-2">
                  {izin.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleApproveReject(izin.id, "APPROVED")}
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveReject(izin.id, "REJECTED")}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
