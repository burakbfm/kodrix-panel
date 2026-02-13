import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, BookOpen, TrendingUp, Plus, DollarSign } from "lucide-react";
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
    <div className="p-8 space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Yönetim Paneli
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sistem genelinde istatistikler ve hızlı erişim
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Students Card */}
        <Link href="/admin/users" className="group">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Toplam</span>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Toplam Öğrenci
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {studentCount || 0}
              </p>
            </div>
          </div>
        </Link>

        {/* Classes Card */}
        <Link href="/admin/classes" className="group">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">Aktif</span>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Aktif Sınıflar
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {classCount || 0}
              </p>
            </div>
          </div>
        </Link>

        {/* Teachers Card */}
        <Link href="/admin/users?role=teacher" className="group">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">Eğitmen</span>
            </div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Öğretmenler
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {teacherCount || 0}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Financial Overview */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Finansal Genel Bakış
        </h2>
        <DashboardCharts stats={monthlyStats || []} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <Link
            href="/admin/users/new"
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all group"
          >
            <Plus className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg">Kullanıcı Ekle</h3>
            <p className="text-blue-100 text-sm mt-1">Yeni öğrenci veya öğretmen kaydı</p>
          </Link>

          <Link
            href="/admin/classes"
            className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all group"
          >
            <BookOpen className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg">Sınıf Yönetimi</h3>
            <p className="text-purple-100 text-sm mt-1">Sınıfları ve dersleri düzenle</p>
          </Link>

          <Link
            href="/admin/finance"
            className="p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all group"
          >
            <DollarSign className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg">Finans</h3>
            <p className="text-green-100 text-sm mt-1">Ödeme takibi ve raporlama</p>
          </Link>

          <Link
            href="/admin/users"
            className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all group"
          >
            <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-lg">Kullanıcılar</h3>
            <p className="text-orange-100 text-sm mt-1">Tüm kullanıcıları görüntüle</p>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Sistem Durumu
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            Veritabanı bağlantısı aktif. Sistem sorunsuz çalışıyor.
          </p>
        </div>
      </div>
    </div>
  );
}