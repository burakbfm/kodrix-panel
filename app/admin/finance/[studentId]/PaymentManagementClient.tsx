"use client";

import { useState } from "react";
import {
    createPaymentAgreement,
    addPaymentTransaction,
    updatePaymentAgreement,
} from "@/app/admin/actions";
import { Save, Plus, DollarSign, ChevronDown, ChevronUp, Edit2, X, Wallet } from "lucide-react";

interface PaymentFormProps {
    studentId: string;
    studentName: string;
    payments: any[]; // List of agreements
    transactions?: any[];
}

export default function PaymentManagementClient({ studentId, studentName, payments }: PaymentFormProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activePaymentId, setActivePaymentId] = useState<string | null>(null); // For adding transaction

    return (
        <div className="space-y-6">

            {/* Header / Add New Agreement Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-kodrix-purple dark:text-amber-500" />
                    Ödeme Anlaşmaları
                </h2>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-kodrix-purple hover:bg-kodrix-purple/90 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-gray-900 font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Anlaşma Ekle
                    </button>
                )}
            </div>

            {/* Create New Agreement Form */}
            {isCreating && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                            Yeni Ödeme Anlaşması
                        </h3>
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form action={createPaymentAgreement} className="space-y-4">
                        <input type="hidden" name="studentId" value={studentId} />

                        <div>
                            <label className="text-sm text-gray-700 dark:text-gray-400 block mb-2">Anlaşma Başlığı (Örn: React Kursu)</label>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="Örn: Yazılım Uzmanlığı Eğitimi"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700 dark:text-gray-400 block mb-2">Anlaşılan Tutar (₺)</label>
                            <input
                                type="number"
                                name="agreedAmount"
                                required
                                min="0"
                                step="0.01"
                                placeholder="Örn: 15000"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-700 dark:text-gray-400 block mb-2">Notlar (Opsiyonel)</label>
                            <textarea
                                name="notes"
                                rows={2}
                                placeholder="Ödeme planı detayları..."
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-kodrix-purple hover:bg-kodrix-purple/90 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-gray-900 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Kaydet
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List of Agreements */}
            <div className="space-y-6">
                {payments?.map((payment) => {
                    const isEditing = editingId === payment.id;
                    const isAddingPayment = activePaymentId === payment.id;
                    const remaining = payment.agreed_amount - payment.paid_amount;
                    const progress = payment.agreed_amount > 0 ? (payment.paid_amount / payment.agreed_amount) * 100 : 0;

                    return (
                        <div key={payment.id} className="bg-white dark:bg-gray-800 rounded-xl border border-kodrix-purple dark:border-amber-500 overflow-hidden shadow-sm">
                            {/* Card Header / Summary */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {payment.title || "Genel Anlaşma"}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(payment.created_at).toLocaleDateString("tr-TR")} tarihinde oluşturuldu
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEditingId(isEditing ? null : payment.id)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Edit Mode */}
                                {isEditing ? (
                                    <form action={updatePaymentAgreement} className="space-y-4 mb-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <input type="hidden" name="paymentId" value={payment.id} />
                                        <input type="hidden" name="studentId" value={studentId} />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Başlık</label>
                                                <input type="text" name="title" defaultValue={payment.title} className="w-full bg-white dark:bg-gray-700 rounded p-2 text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-kodrix-purple" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tutar</label>
                                                <input type="number" name="agreedAmount" defaultValue={payment.agreed_amount} className="w-full bg-white dark:bg-gray-700 rounded p-2 text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-kodrix-purple" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Notlar</label>
                                            <input type="text" name="notes" defaultValue={payment.notes} className="w-full bg-white dark:bg-gray-700 rounded p-2 text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-kodrix-purple" />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded">İptal</button>
                                            <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded">Güncelle</button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Display Stats */
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Anlaşılan</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{parseFloat(payment.agreed_amount).toLocaleString('tr-TR')} ₺</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-500/20">
                                            <p className="text-xs text-green-600 dark:text-green-400">Ödenen</p>
                                            <p className="text-lg font-bold text-green-700 dark:text-green-400">{parseFloat(payment.paid_amount).toLocaleString('tr-TR')} ₺</p>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                            <p className="text-xs text-amber-600 dark:text-amber-400">Kalan</p>
                                            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{remaining.toLocaleString('tr-TR')} ₺</p>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                                    <div
                                        className={`h-full ${remaining <= 0 ? 'bg-green-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>

                                {payment.notes && !isEditing && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-3 mb-4">
                                        "{payment.notes}"
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {!isAddingPayment ? (
                                        <button
                                            onClick={() => setActivePaymentId(payment.id)}
                                            className="w-full py-2 bg-green-600 hover:bg-green-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-gray-900 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Ödeme Ekle
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setActivePaymentId(null)}
                                            className="w-full py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition"
                                        >
                                            İptal
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Add Payment Form */}
                            {isAddingPayment && (
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-t border-gray-200 dark:border-gray-700 animate-in fade-in">
                                    <h4 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-green-500" />
                                        Ödeme Kaydı Gir
                                    </h4>
                                    <form action={addPaymentTransaction} className="space-y-4">
                                        <input type="hidden" name="paymentId" value={payment.id} />
                                        <input type="hidden" name="studentId" value={studentId} />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tutar (₺)</label>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="1000"
                                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tarih</label>
                                                <input
                                                    type="date"
                                                    name="paymentDate"
                                                    required
                                                    defaultValue={new Date().toISOString().split('T')[0]}
                                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Yöntem</label>
                                                <select
                                                    name="paymentMethod"
                                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                >
                                                    <option value="cash">Nakit</option>
                                                    <option value="bank_transfer">Banka Havalesi</option>
                                                    <option value="credit_card">Kredi Kartı</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Not</label>
                                                <input
                                                    type="text"
                                                    name="notes"
                                                    placeholder="Opsiyonel"
                                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg transition text-sm"
                                        >
                                            Ödemeyi Kaydet
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    );
                })}

                {payments && payments.length === 0 && !isCreating && (
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Henüz hiç ödeme anlaşması yok.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-kodrix-purple dark:text-amber-500 hover:underline font-medium"
                        >
                            + İlk Anlaşmayı Oluştur
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
