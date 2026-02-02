import { createClient } from "@/lib/supabase/server";
import { deleteUser } from "@/app/admin/actions";
import Link from "next/link";
import { Users, GraduationCap, School, Trash2, Plus, Search } from "lucide-react";

export const revalidate = 0;

export default async function UsersPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient();
  const { tab } = await searchParams; 
  const activeTab = tab || "student"; // Varsayılan sekme: Öğrenci

  // Aktif sekmeye göre verileri çek
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", activeTab)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      
      {/* Başlık ve Ekle Butonu */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             <Users className="w-8 h-8 text-yellow-400" /> Kullanıcı Yönetimi
           </h1>
           <p className="text-gray-400 mt-1">Sistemdeki tüm öğretmen ve öğrencileri yönet.</p>
        </div>
        
        <Link 
          href="/admin/users/new" 
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition flex items-center gap-2 shadow-lg shadow-yellow-500/20"
        >
          <Plus className="w-5 h-5" /> Yeni Kişi Ekle
        </Link>
      </div>

      {/* Sekmeler (Tabs) */}
      <div className="flex gap-4 mb-6 border-b border-gray-800 pb-1">
        <Link 
          href="/admin/users?tab=student" 
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition border-b-2 ${activeTab === 'student' ? 'border-yellow-400 text-yellow-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <GraduationCap className="w-5 h-5" /> Öğrenciler
        </Link>
        <Link 
          href="/admin/users?tab=teacher" 
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition border-b-2 ${activeTab === 'teacher' ? 'border-green-400 text-green-400 bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}
        >
          <School className="w-5 h-5" /> Öğretmenler
        </Link>
      </div>

      {/* Liste */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase">
            <tr>
              <th className="p-4">Kullanıcı Bilgisi</th>
              <th className="p-4">Kimlik / No</th>
              <th className="p-4">Rol</th>
              <th className="p-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/30 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user.role === 'student' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                       {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.email}</p>
                      <p className="text-xs text-gray-500">Kayıt: {new Date(user.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-gray-300">
                  {user.school_number || user.email}
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded border ${user.role === 'student' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
                    {user.role === 'student' ? 'Öğrenci' : 'Öğretmen'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <form action={deleteUser}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button 
                      className="p-2 hover:bg-red-500/20 text-red-500 rounded transition"
                      title="Kullanıcıyı Sil"
                      onClick={(e) => { if(!confirm('Bu kullanıcıyı silmek istediğine emin misin?')) e.preventDefault(); }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {users?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Henüz kayıtlı kimse yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}