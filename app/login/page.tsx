import { login } from "./actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
        
        {/* Üst Başlık Kısmı */}
        <div className="bg-gray-900 p-6 text-center border-b border-gray-700">
          <h2 className="text-3xl font-bold text-yellow-400">🚀 KodriX</h2>
          <p className="text-gray-400 mt-2 text-sm">Öğrenci Giriş Paneli</p>
        </div>

        {/* Giriş Formu */}
        <form className="p-8 space-y-6">
          
          {/* Okul Numarası Kutusu */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Okul Numarası
            </label>
            <input
              name="schoolNumber"
              type="text"
              required
              placeholder="Örn: 202401"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            />
          </div>

          {/* Şifre Kutusu */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Şifre
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            />
          </div>

          {/* Giriş Butonu */}
          <button
            formAction={login}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02]"
          >
            Giriş Yap
          </button>
        </form>
        
        {/* Alt Bilgi */}
        <div className="bg-gray-900/50 p-4 text-center text-xs text-gray-500">
          Giriş yapamıyor musun? Öğretmeninle iletişime geç.
        </div>
      </div>
    </div>
  );
}