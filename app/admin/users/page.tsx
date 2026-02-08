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
          className="bg-kodrix-purple dark:bg-amber-500 hover:bg-kodrix-purple/90 dark:hover:bg-amber-600 text-white dark:text-gray-900 font-bold py-3 px-6 rounded-lg transition flex items-center gap-2 shadow-lg"
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
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
              <tr>
                <th className="p-4">Kullanıcı Bilgisi</th>
                <th className="p-4">Kimlik / No</th>
                <th className="p-4">Rol</th>
                <th className="p-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user.role === 'student'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-green-500/20 text-green-500'
                        }`}>
                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {user.full_name || user.email}
                        </p>
                        {user.full_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-gray-600 dark:text-gray-300">
                    {user.school_number || '-'}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded border ${user.role === 'student'
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                      }`}>
                      {user.role === 'student' ? 'Öğrenci' : 'Öğretmen'}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="p-2 hover:bg-blue-500/20 text-blue-500 rounded transition"
                      title="Düzenle"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <DeleteUserButton
                      userId={user.id}
                      userName={user.full_name || user.email}
                    />
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