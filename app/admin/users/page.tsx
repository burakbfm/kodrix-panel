import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, GraduationCap, School, Plus, Search, Edit, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { SearchToolbar } from "@/components/SearchToolbar";

export const revalidate = 0;

export default async function UsersPage({ searchParams }: { searchParams: { tab?: string, query?: string, page?: string, perPage?: string } }) {
  const supabase = await createClient();
  const { tab, query, page, perPage } = await searchParams;
  const activeTab = tab || "student";
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const itemsPerPage = parseInt(perPage || "10", 10);

  let queryBuilder = supabase
    .from("profiles")
    .select("*")
    .eq("role", activeTab);

  if (query) {
    queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,school_number.ilike.%${query}%`);
  }

  const { data: users, error } = await queryBuilder;

  let userClassMap = new Map<string, { id: string; name: string }[]>();

  if (users && users.length > 0) {
    const userIds = users.map(u => u.id);

    if (activeTab === "student") {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, classes(id, name)")
        .in("user_id", userIds);

      enrollments?.forEach((e: any) => {
        if (e.classes) {
          const current = userClassMap.get(e.user_id) || [];
          current.push(e.classes);
          userClassMap.set(e.user_id, current);
        }
      });
    } else {
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, teacher_id")
        .in("teacher_id", userIds);

      classes?.forEach((cls: any) => {
        const current = userClassMap.get(cls.teacher_id) || [];
        current.push({ id: cls.id, name: cls.name });
        userClassMap.set(cls.teacher_id, current);
      });
    }
  }

  if (error) {
    console.error("❌ Users fetch error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      tab: activeTab
    });
  }

  // Pagination
  const totalItems = users?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users?.slice(startIndex, endIndex) || [];

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (query) params.set('query', query);
    params.set('page', String(p));
    if (itemsPerPage !== 10) params.set('perPage', String(itemsPerPage));
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Header & Add Button */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 p-10 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-10 h-10 text-blue-200" />
              Kullanıcı Yönetimi
            </h1>
            <p className="text-blue-100 text-lg">
              Sistemdeki tüm öğretmen ve öğrencileri yönetin.
            </p>
          </div>
          <Link
            href="/admin/users/new"
            className="px-8 py-4 bg-white text-blue-700 dark:text-blue-900 rounded-2xl hover:shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all duration-200 font-bold flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Yeni Kişi Ekle
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl w-fit border border-gray-200 dark:border-white/5">
        <Link
          href="/admin/users?tab=student"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'student'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          <GraduationCap className="w-5 h-5" />
          Öğrenciler
        </Link>
        <Link
          href="/admin/users?tab=teacher"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'teacher'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          <School className="w-5 h-5" />
          Öğretmenler
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
        <SearchToolbar placeholder="İsim, e-posta veya okul numarası ile ara..." />
      </div>

      {/* User Table */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 dark:bg-black/20 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="p-6 pl-8">Kullanıcı Bilgisi</th>
                <th className="p-6">Kimlik / No</th>
                <th className="p-6">Sınıf</th>
                <th className="p-6">Rol</th>
                <th className="p-6 pr-8 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedUsers.map((user) => {
                const userClasses = userClassMap.get(user.id) || [];
                return (
                  <tr key={user.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-200">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${user.role === 'student'
                          ? 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-700 dark:text-blue-300'
                          : 'bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 text-indigo-700 dark:text-indigo-300'
                          }`}>
                          {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold">{user.school_number}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">-</span>
                      )}
                    </td>
                    <td className="p-5">
                      {userClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {userClasses.map((cls) => (
                            <Link key={cls.id} href={`/admin/classes/${cls.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                              <BookOpen className="w-3 h-3" />
                              {cls.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">Atanmamış</span>
                      )}
                    </td>
                    <td className="p-5">
                      {user.role === 'student' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                          <GraduationCap className="w-3.5 h-3.5" />
                          Öğrenci
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                          <School className="w-3.5 h-3.5" />
                          Öğretmen
                        </div>
                      )}
                    </td>
                    <td className="p-5 pr-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-200">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2.5 hover:bg-white dark:hover:bg-white/10 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
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
                )
              })}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-500 dark:text-gray-400">
                    {error ? (
                      <div>
                        <p className="font-bold text-red-500 mb-2">Veri yüklenirken hata oluştu</p>
                        <p className="text-sm bg-red-50 dark:bg-red-900/10 p-2 rounded-lg inline-block">Console'da detayları kontrol edin</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-lg font-medium">Sonuç bulunamadı</p>
                        <p className="text-sm opacity-60 mt-1">
                          {activeTab === 'student' ? 'Öğrenci' : 'Öğretmen'} kriterlerine uygun kayıt yok.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="p-5 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">
              {startIndex + 1}-{Math.min(endIndex, totalItems)} / {totalItems}
            </span>
            <div className="flex items-center gap-1">
              {currentPage > 1 ? (
                <Link href={buildPageUrl(currentPage - 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1.5 opacity-30 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500 font-bold text-xs min-w-[50px] text-center">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link href={buildPageUrl(currentPage + 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="p-1.5 opacity-30 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}