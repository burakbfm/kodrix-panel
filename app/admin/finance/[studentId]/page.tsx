import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, User, Phone, Mail, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import PaymentManagementClient from "./PaymentManagementClient";
import { DeleteTransactionButton } from "@/components/DeleteTransactionButton";

export const revalidate = 0;

export default async function StudentFinanceDetailPage({ params }: { params: { studentId: string } }) {
    const supabase = await createClient();
    const { studentId } = await params;

    // Fetch student information
    const { data: student } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

    if (!student) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Öğrenci bulunamadı</h1>
                    <Link href="/admin/finance" className="text-blue-400 hover:text-blue-300">
                        ← Finans sayfasına dön
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch payment agreements (Multiple)
    const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

    // Fetch payment transactions for ALL agreements
    const paymentIds = payments?.map(p => p.id) || [];

    let transactions: any[] = [];

    if (paymentIds.length > 0) {
        const { data: txs } = await supabase
            .from("payment_transactions")
            .select(`
                *,
                payments (
                    title
                )
            `)
            .in("payment_id", paymentIds)
            .order("payment_date", { ascending: false });

        transactions = txs || [];
    }

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

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Öğrenci Ödeme Detayı</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Student Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 sticky top-8 shadow-sm">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold text-3xl mx-auto mb-4">
                                {(student.full_name || student.email)?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{student.full_name || "İsimsiz"}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{student.school_number || "No bilgisi yok"}</p>
                        </div>

                        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">E-posta</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{student.email}</p>
                                </div>
                            </div>

                            {student.parent_name && (
                                <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Veli</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{student.parent_name}</p>
                                    </div>
                                </div>
                            )}

                            {student.parent_phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Veli Telefon</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{student.parent_phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Kayıt Tarihi</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {new Date(student.created_at).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment Management */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Payment Agreement & Transaction Form */}
                    <PaymentManagementClient
                        studentId={studentId}
                        studentName={student.full_name || student.email}
                        payments={payments || []}
                        transactions={transactions}
                    />

                    {/* Payment History */}
                    {transactions && transactions.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-kodrix-purple dark:border-amber-500 overflow-hidden shadow-sm">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white">Ödeme Geçmişi</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="p-4">Tarih</th>
                                            <th className="p-4">Anlaşma</th>
                                            <th className="p-4">Tutar</th>
                                            <th className="p-4">Yöntem</th>
                                            <th className="p-4">Not</th>
                                            <th className="p-4 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {transactions.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="p-4 text-gray-900 dark:text-white">
                                                    {new Date(transaction.payment_date).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {transaction.payments?.title || "Genel"}
                                                </td>
                                                <td className="p-4 font-bold text-green-600 dark:text-green-400">
                                                    +{parseFloat(transaction.amount).toLocaleString('tr-TR')} ₺
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                        {transaction.payment_method === 'cash' ? 'Nakit' :
                                                            transaction.payment_method === 'bank_transfer' ? 'Havale' :
                                                                transaction.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Diğer'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                                                    {transaction.notes || "-"}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <DeleteTransactionButton
                                                        transactionId={transaction.id}
                                                        studentId={studentId}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

}
