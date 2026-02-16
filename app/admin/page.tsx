import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, BookOpen, TrendingUp, Plus, DollarSign, Activity } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get statistics
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  const { count: classCount } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true });

  const { count: teacherCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher");

  // Get monthly finance stats
  const { data: monthlyStats } = await supabase.rpc("get_monthly_finance_stats");

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto">

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-black dark:to-gray-900 p-10 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-kodrix-purple/20 dark:bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Yönetim Paneli
          </h1>
          <p className="text-gray-400 text-lg">
            Sistem genelinde istatistikler ve hızlı erişim
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Students Card */}
        <Link href="/admin/users" className="group">
          <div className="relative overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full group-hover:border-blue-500/30">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">Toplam</span>
            </div>

            <div className="relative z-10">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                Toplam Öğrenci
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {studentCount || 0}
              </p>
            </div>
          </div>
        </Link>

        {/* Classes Card */}
        <Link href="/admin/classes" className="group">
          <div className="relative overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full group-hover:border-purple-500/30">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100/50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">Aktif</span>
            </div>

            <div className="relative z-10">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                Aktif Sınıflar
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {classCount || 0}
              </p>
            </div>
          </div>
        </Link>

        {/* Teachers Card */}
        <Link href="/admin/users?role=teacher" className="group">
          <div className="relative overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full group-hover:border-amber-500/30">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100/50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">Eğitmen</span>
            </div>

            <div className="relative z-10">
              <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                Öğretmenler
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {teacherCount || 0}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-8 bg-kodrix-purple dark:bg-amber-500 rounded-full"></span>
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <Link
            href="/admin/users/new"
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <Plus className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform duration-300 bg-white/20 p-1.5 rounded-lg" />
            <h3 className="font-bold text-lg mb-1">Kullanıcı Ekle</h3>
            <p className="text-blue-100 text-sm opacity-90">Yeni öğrenci veya öğretmen</p>
          </Link>

          <Link
            href="/admin/classes"
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <BookOpen className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform duration-300 bg-white/20 p-1.5 rounded-lg" />
            <h3 className="font-bold text-lg mb-1">Sınıf Yönetimi</h3>
            <p className="text-purple-100 text-sm opacity-90">Sınıfları ve dersleri düzenle</p>
          </Link>

          <Link
            href="/admin/finance"
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <DollarSign className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform duration-300 bg-white/20 p-1.5 rounded-lg" />
            <h3 className="font-bold text-lg mb-1">Finans</h3>
            <p className="text-emerald-100 text-sm opacity-90">Ödeme takibi ve raporlama</p>
          </Link>

          <Link
            href="/admin/users"
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <Users className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform duration-300 bg-white/20 p-1.5 rounded-lg" />
            <h3 className="font-bold text-lg mb-1">Kullanıcılar</h3>
            <p className="text-orange-100 text-sm opacity-90">Tüm kullanıcıları görüntüle</p>
          </Link>
        </div>
      </div>

      {/* Financial Overview & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Financial Charts */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Finansal Genel Bakış
            </h2>
          </div>
          <DashboardCharts stats={monthlyStats || []} />
        </div>

        {/* System Status */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-lg h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg">
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Sistem Durumu
            </h2>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="relative mt-1">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-ping absolute inset-0 opacity-75"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 relative"></div>
            </div>
            <div>
              <h4 className="font-bold text-green-700 dark:text-green-400 text-sm">Sistem Aktif</h4>
              <p className="text-green-600 dark:text-green-500/80 text-xs mt-1">
                Veritabanı ve servisler sorunsuz çalışıyor.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Sunucu</span>
              <span className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">TR-IST-01</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>Versiyon</span>
              <span className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">v2.4.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}