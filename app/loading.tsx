export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl">
        
        {/* Dönen Çember */}
        <div className="relative w-16 h-16">
          <div className="absolute w-16 h-16 border-4 border-gray-600 rounded-full"></div>
          <div className="absolute w-16 h-16 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
        </div>

        {/* Yazı */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-1">KodriX</h3>
          <p className="text-sm text-yellow-400 animate-pulse">Veriler Yükleniyor...</p>
        </div>
      </div>
    </div>
  );
}