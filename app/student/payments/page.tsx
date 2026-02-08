import { createClient } from "@/lib/supabase/server";
import { CreditCard, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default async function StudentPaymentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch payments
    const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", user.id);

    // Fetch transactions
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

    // Calculate totals
    const totalAgreed = payments?.reduce((sum, p) => sum + (p.agreed_amount || 0), 0) || 0;
    const totalPaid = payments?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
    const remaining = totalAgreed - totalPaid;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Ödemelerim
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Ödeme geçmişiniz ve kalan bakiye durumunuz.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm border-l-4 border-l-kodrix-purple dark:border-l-amber-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Toplam Anlaşma</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAgreed.toLocaleString('tr-TR')} ₺</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm border-l-4 border-l-green-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Toplam Ödenen</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalPaid.toLocaleString('tr-TR')} ₺</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-kodrix-purple dark:border-amber-500 shadow-sm border-l-4 border-l-amber-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Kalan Bakiye</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{remaining.toLocaleString('tr-TR')} ₺</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-kodrix-purple dark:border-amber-500 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        Ödeme Geçmişi
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Tarih</th>
                                <th className="p-4">Açıklama</th>
                                <th className="p-4">Yöntem</th>
                                <th className="p-4 text-right">Tutar</th>
                                <th className="p-4 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                    <td className="p-4 text-gray-900 dark:text-white">
                                        {new Date(tx.payment_date).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        <div>
                                            {tx.payments?.title || "Ödeme"}
                                            {tx.notes && <p className="text-xs text-gray-400 mt-0.5">{tx.notes}</p>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                                        {tx.payment_method === 'cash' ? 'Nakit' :
                                            tx.payment_method === 'bank_transfer' ? 'Havale/EFT' :
                                                tx.payment_method === 'credit_card' ? 'Kredi Kartı' : 'Diğer'}
                                    </td>
                                    <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">
                                        +{parseFloat(tx.amount).toLocaleString('tr-TR')} ₺
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                                            <CheckCircle className="w-3 h-3" /> Onaylandı
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Henüz ödeme kaydı bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
