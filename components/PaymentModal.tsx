"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { addPaymentTransaction } from "@/app/admin/actions";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentId: string;
    studentId: string;
    studentName: string;
}

export function PaymentModal({
    isOpen,
    onClose,
    paymentId,
    studentId,
    studentName
}: PaymentModalProps) {

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Ödeme Ekle
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {studentName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <form action={addPaymentTransaction} className="p-6 space-y-4">
                        <input type="hidden" name="paymentId" value={paymentId} />
                        <input type="hidden" name="studentId" value={studentId} />

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ödeme Tutarı (₺)
                            </label>
                            <input
                                type="number"
                                name="amount"
                                required
                                min="0"
                                step="0.01"
                                placeholder="1000"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple focus:border-transparent"
                            />
                        </div>

                        {/* Payment Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ödeme Tarihi
                            </label>
                            <input
                                type="date"
                                name="paymentDate"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple focus:border-transparent"
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ödeme Yöntemi
                            </label>
                            <select
                                name="paymentMethod"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple focus:border-transparent"
                            >
                                <option value="cash">Nakit</option>
                                <option value="bank_transfer">Banka Havalesi</option>
                                <option value="credit_card">Kredi Kartı</option>
                                <option value="other">Diğer</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Not (Opsiyonel)
                            </label>
                            <textarea
                                name="notes"
                                rows={3}
                                placeholder="Ödeme hakkında notlar..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kodrix-purple focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 rounded-lg bg-kodrix-purple hover:bg-kodrix-purple/90 text-white font-medium transition"
                            >
                                Ödemeyi Kaydet
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
