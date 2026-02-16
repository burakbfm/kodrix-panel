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
    <div className="flex flex-col min-h-screen">

      {/* Top Navbar - Glass Effect */}
      <nav className="sticky top-0 z-40 w-full bg-white/70 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 flex justify-between items-center transition-all">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-400 dark:to-orange-500">
          KodriX <span className="text-gray-600 dark:text-gray-400 font-medium">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-kodrix-purple to-amber-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.email?.split("@")[0]}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">

        {/* Welcome Section */}
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-r from-kodrix-purple to-purple-800 dark:from-indigo-950 dark:to-purple-950 p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">Hoş Geldin, Şampiyon! 🚀</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Bugün yeni bir şeyler öğrenmek için harika bir gün. Derslerine kaldığın yerden devam et ve potansiyelini keşfet.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
          <span className="w-1 h-8 bg-kodrix-purple dark:bg-amber-500 rounded-full"></span>
          Derslerim
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments?.map((kayit: any) => (
            <Link
              key={kayit.class_id}
              href={`/class/${kayit.class_id}`}
              className="block group"
            >
              <div className="relative h-full bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-6 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-kodrix-purple/10 dark:group-hover:shadow-amber-500/10 group-hover:border-kodrix-purple/30 dark:group-hover:border-amber-500/30 overflow-hidden">

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-kodrix-purple/5 to-transparent dark:from-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-4 group-hover:bg-kodrix-purple dark:group-hover:bg-amber-500 transition-colors duration-300">
                    <span className="text-2xl group-hover:text-white transition-colors duration-300">📚</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-kodrix-purple dark:group-hover:text-amber-500 transition-colors">
                    {kayit.classes.name}
                  </h3>

                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                    Canlı derslere, kayıtlara ve ödevlerine buradan ulaşabilirsin.
                  </p>

                  <div className="flex items-center text-sm font-semibold text-kodrix-purple dark:text-amber-500">
                    Derse Git
                    <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* No classes message */}
          {(!enrollments || enrollments.length === 0) && (
            <div className="col-span-full text-center p-12 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
              <div className="text-6xl mb-4">📂</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz Dersin Yok</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Yöneticin sana bir sınıf atadığında burada göreceksin.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}