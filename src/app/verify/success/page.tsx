export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Verifikasi Email Berhasil ✅
        </h1>
        <p className="text-gray-700 mb-6">
          Akun Anda telah berhasil diverifikasi. Silakan login untuk
          melanjutkan.
        </p>
        <a
          href="/login"
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded transition"
        >
          Login Sekarang
        </a>
      </div>
    </div>
  );
}
