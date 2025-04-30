export default function EmailSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-4">
          Cek Email Anda
        </h1>
        <p className="text-gray-600">
          Kami telah mengirimkan link untuk mengganti password ke email Anda.
          Silakan cek inbox atau folder spam Anda.
        </p>
        <div className="mt-6">
          <a
            href="/login"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    </div>
  );
}
