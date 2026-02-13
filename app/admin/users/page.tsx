import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, GraduationCap, School, Plus, Search, Edit } from "lucide-react";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { SearchToolbar } from "@/components/SearchToolbar";

export const revalidate = 0;

export default async function UsersPage({ searchParams }: { searchParams: { tab?: string, query?: string } }) {
  const supabase = await createClient();
  const { tab, query } = await searchParams;
  const activeTab = tab || "student";

  // Build query
  let queryBuilder = supabase
    .from("profiles")
    .select("*")
    .eq("role", activeTab);

  // Apply search filter if exists
  if (query) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,school_number.ilike.%${query}%`);
  }

  const { data: users, error } = await queryBuilder;

  // Log errors for debugging
  if (error) {
    console.error("❌ Users fetch error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      tab: activeTab
    });
  }

  return (
    <div className="p-8 space-y-6">

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-kodrix-purple dark:text-amber-500" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistemdeki tüm öğretmen ve öğrencileri yönet.
          </p>
        </div>

        <Link
          href="/admin/users/new"
          className="bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Kişi Ekle
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-1">
        <Link
          href="/admin/users?tab=student"
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition border-b-2 ${activeTab === 'student'
            ? 'border-kodrix-purple dark:border-amber-500 text-kodrix-purple dark:text-amber-500 bg-gray-50 dark:bg-gray-800'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
        >
          <GraduationCap className="w-5 h-5" />
          Öğrenciler
        </Link>
        <Link
          href="/admin/users?tab=teacher"
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition border-b-2 ${activeTab === 'teacher'
            ? 'border-green-500 text-green-600 dark:text-green-400 bg-gray-50 dark:bg-gray-800'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
        >
          <School className="w-5 h-5" />
          Öğretmenler
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <SearchToolbar placeholder="İsim, e-posta veya okul numarası ile ara..." />

      {/* User Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-5 pl-6">Kullanıcı Bilgisi</th>
                <th className="p-5">Kimlik / No</th>
                <th className="p-5">Rol</th>
                <th className="p-5 pr-6 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users?.map((user) => (
                <tr key={user.id} className="group hover:bg-white dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-sm">
                  <td className="p-5 pl-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105 ${user.role === 'student'
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 dark:text-blue-400'
                        : 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 text-purple-600 dark:text-amber-400'
                        }`}>
                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-amber-400 transition-colors">
                          {user.full_name || user.email}
                        </p>
                        {user.full_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{user.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-5 font-mono text-sm text-gray-500 dark:text-gray-400 bg-transparent">
                    {user.school_number ? (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">{user.school_number}</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700">-</span>
                    )}
                  </td>
                  <td className="p-5">
                    {user.role === 'student' ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md border border-blue-100 dark:border-blue-800">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Öğrenci
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-purple-50 dark:bg-amber-900/20 text-purple-600 dark:text-amber-400 px-2.5 py-1.5 rounded-md border border-purple-100 dark:border-amber-800/50">
                        <School className="w-3.5 h-3.5" />
                        Öğretmen
                      </div>
                    )}
                  </td>
                  <td className="p-5 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-purple-600 dark:hover:text-amber-400 rounded-lg transition"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.full_name || user.email}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {users?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {error ? (
                      <div>
                        <p className="font-medium text-red-500 mb-1">Veri yüklenirken hata oluştu</p>
                        <p className="text-sm">Console'da detayları kontrol edin</p>
                      </div>
                    ) : (
                      `Henüz kayıtlı ${activeTab === 'student' ? 'öğrenci' : 'öğretmen'} yok.`
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
}