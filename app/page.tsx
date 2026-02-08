import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  // 1. Check who is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Auth error:", authError);
    redirect("/login");
  }

  // If no user is logged in, redirect to login
  if (!user) {
    redirect("/login");
  }

  // Check user role - redirect admins to admin panel
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("❌ Profile fetch error:", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    });
  }

  // If admin, redirect to admin panel
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  // 2. Fetch enrolled classes for this student
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select(`
      class_id,
      classes (
        id,
        name
      )
    `)
    .eq("user_id", user.id);

  if (enrollmentError) {
    console.error("❌ Enrollment fetch error:", {
      message: enrollmentError.message,
      details: enrollmentError.details,
      hint: enrollmentError.hint,
      code: enrollmentError.code
    });
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Top Navbar */}
      <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center transition-colors">
        <div className="text-xl font-bold text-kodrix-purple dark:text-amber-500">KodriX</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user.email?.split("@")[0]}
          </span>
          <form action="/auth/signout" method="post">
            <button className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition">
              Çıkış
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Derslerim</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments?.map((kayit: any) => (
            <Link
              key={kayit.class_id}
              href={`/class/${kayit.class_id}`}
              className="block"
            >
              <div className="group relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-kodrix-purple dark:hover:border-amber-500 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer h-full">
                {/* Top accent bar */}
                <div className="h-2 w-full bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-yellow-500" />

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition">
                    {kayit.classes.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                    Canlı derslere ve kayıtlara ulaşmak için tıkla.
                  </p>

                  <div className="mt-6 flex items-center text-kodrix-purple dark:text-amber-500 text-sm font-medium">
                    Derse Git <span className="ml-2 group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* No classes message */}
          {(!enrollments || enrollments.length === 0) && (
            <div className="col-span-2 text-center p-10 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 border-dashed transition-colors">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Henüz atanmış bir dersiniz yok.
              </p>
              {enrollmentError && (
                <p className="text-red-500 text-sm mt-2">
                  Veri çekme hatası. Lütfen yöneticinize başvurun.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}