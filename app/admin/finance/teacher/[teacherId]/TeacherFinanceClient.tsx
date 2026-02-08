"use client";

import { useState } from "react";
import { createExpense, deleteExpense } from "@/app/admin/actions";
import { Plus, DollarSign, X, Save, Trash2, Wallet } from "lucide-react";

interface TeacherFinanceClientProps {
    teacherId: string;
    teacherName: string;
    expenses: any[];
}

export function TeacherFinanceClient({ teacherId, teacherName, expenses }: TeacherFinanceClientProps) {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="space-y-6">

            {/* Header / Add Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-kodrix-purple dark:text-amber-500" />
                    Öğretmen Ödemeleri
                </h2>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-kodrix-purple hover:bg-kodrix-purple/90 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-gray-900 font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Ödeme Yap
                    </button>
                )}
            </div>

            {/* Create Payment Form */}
            {isCreating && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                            Yeni Ödeme Kaydı
                        </h3>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form action={async (formData) => {
                        await createExpense(formData);
                        setIsCreating(false);
                    }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hidden fields */}
                        <input type="hidden" name="teacherId" value={teacherId} />
                        <input type="hidden" name="category" value="teacher_payment" />

                        <div className="col-span-2">
                            <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Başlık</label>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="Örn: Ekim Ayı Maaş Ödemesi"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Tutar (TL)</label>
                            <input
                                type="number"
                                name="amount"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Tarih</label>
                            <input
                                type="date"
                                name="paymentDate"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple outline-none"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Açıklama (Opsiyonel)</label>
                            <textarea
                                name="description"
                                rows={2}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple outline-none"
                            />
                        </div>

                        <div className="col-span-2 flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-lg font-bold hover:opacity-90 transition flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Kaydet
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List of Payments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-kodrix-purple dark:border-amber-500 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Tarih</th>
                                <th className="p-4">Başlık / Açıklama</th>
                                <th className="p-4 text-right">Tutar</th>
                                <th className="p-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(expense.payment_date).toLocaleDateString("tr-TR")}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{expense.title}</div>
                                        {expense.description && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{expense.description}</div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                        {expense.amount?.toLocaleString("tr-TR")} ₺
                                    </td>
                                    <td className="p-4 text-right">
                                        <form action={deleteExpense}>
                                            <input type="hidden" name="expenseId" value={expense.id} />
                                            <button type="submit" className="text-gray-400 hover:text-red-500 transition" title="Sil">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Henüz ödeme kaydı bulunmuyor.
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
