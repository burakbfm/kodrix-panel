import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, User, Mail, GraduationCap } from "lucide-react";
import Link from "next/link";
import { TeacherFinanceClient } from "./TeacherFinanceClient";

export const revalidate = 0;

export default async function TeacherFinanceDetailPage({ params }: { params: { teacherId: string } }) {
    const supabase = await createClient();
    const { teacherId } = await params;

    // Fetch teacher information
    const { data: teacher } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", teacherId)
        .single();

    if (!teacher) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Öğretmen bulunamadı</h1>
                    <Link href="/admin/finance" className="text-kodrix-purple dark:text-amber-500 hover:underline">
                        ← Finans sayfasına dön
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch expenses for this teacher
    const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("payment_date", { ascending: false });

    const totalPaid = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8">

            {/* Header with back button */}
            <div className="mb-8">
                <Link
                    href="/admin/finance"
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm mb-4 inline-flex items-center gap-1 transition"
                >
                    <ArrowLeft className="w-4 h-4" /> Finans Listesine Dön
                </Link>

                <h1 className="text-3xl font-bold mt-4 flex items-center gap-3">
                    <div className="p-2 bg-kodrix-purple/10 dark:bg-amber-500/10 rounded-lg">
                        <GraduationCap className="w-8 h-8 text-kodrix-purple dark:text-amber-500" />
                    </div>
                    Öğretmen Finans Detayı
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Teacher Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm sticky top-8">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold text-3xl mx-auto mb-4">
                                {(teacher.full_name || teacher.email)?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold">{teacher.full_name || "İsimsiz"}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{teacher.subject_field || "Branş Belirtilmemiş"}</p>
                        </div>

                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">E-posta</p>
                                    <p className="text-sm font-medium">{teacher.email}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Toplam Ödeme</p>
                                <p className="text-2xl font-bold text-kodrix-purple dark:text-amber-500">
                                    {totalPaid.toLocaleString('tr-TR')} ₺
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment Management */}
                <div className="lg:col-span-2">
                    <TeacherFinanceClient
                        teacherId={teacherId}
                        teacherName={teacher.full_name || teacher.email}
                        expenses={expenses || []}
                    />
                </div>
            </div>
        </div>
    );
}
