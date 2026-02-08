import { createClient } from "@/lib/supabase/server";
import { createClass } from "../actions";
import Link from "next/link";
import { BookOpen, Users, FileText, Plus } from "lucide-react";
import { DeleteClassButton } from "@/components/DeleteClassButton";

export const revalidate = 0;

export default async function AdminClassesPage() {
  const supabase = await createClient();

  // Fetch classes with enrollment and lesson counts
  const { data: classes, error } = await supabase
    .from("classes")
    .select(`
      *,
      enrollments(count),
      lessons(count)
    `)
    .order("created_at", { ascending: false });

  // Log errors for debugging
  if (error) {
    console.error("❌ Classes fetch error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-kodrix-purple dark:text-amber-500" />
          Sınıf Yönetimi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sınıfları oluştur, düzenle ve ders ekle.
        </p>
      </div>

      {/* Create Class Form */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Yeni Sınıf Oluştur
        </h2>
        <div className="flex gap-4">
          <form action={createClass} className="flex-1 flex gap-4">
            <input
              name="name"
              type="text"
              required
              placeholder="Örn: 12-A Sayısal veya Python Grubu"
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent"
            />
            <button className="bg-kodrix-purple dark:bg-amber-500 hover:bg-kodrix-purple/90 dark:hover:bg-amber-600 text-white dark:text-gray-900 font-bold px-6 py-3 rounded-lg transition flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Oluştur
            </button>
          </form>
        </div>
      </div>

      {/* Classes Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          Mevcut Sınıflar
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
            Toplam: {classes?.length || 0}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls: any) => (
            <div
              key={cls.id}
              className="bg-white dark:bg-gray-900 border border-kodrix-purple dark:border-amber-500 rounded-xl p-6 flex flex-col justify-between hover:shadow-lg transition-all group shadow-sm"
            >

              {/* Header */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition">
                  {cls.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-600 text-[10px] font-mono truncate">
                  ID: {cls.id}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Student Count */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Öğrenci</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1">
                    <Users className="w-4 h-4" />
                    {cls.enrollments?.[0]?.count || 0}
                  </div>
                </div>

                {/* Lesson Count */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Ders</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1">
                    <FileText className="w-4 h-4" />
                    {cls.lessons?.[0]?.count || 0}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-auto">
                <Link
                  href={`/admin/classes/${cls.id}`}
                  className="flex-1 bg-kodrix-purple dark:bg-amber-500 hover:bg-kodrix-purple/90 dark:hover:bg-amber-600 text-white dark:text-gray-900 text-center py-3 rounded-lg font-bold text-sm transition shadow-sm"
                >
                  Yönet & Ders Ekle →
                </Link>

                {/* Delete Button */}
                <DeleteClassButton classId={cls.id} className={cls.name} />
              </div>
            </div>
          ))}

          {/* Empty State */}
          {classes?.length === 0 && (
            <div className="col-span-3 text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              {error ? (
                <div>
                  <p className="text-red-500 font-medium mb-1">Veri yüklenirken hata oluştu</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Console'da detayları kontrol edin</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Henüz hiç sınıf yok.
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    Yukarıdaki formdan yeni bir tane oluştur.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}