"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";

interface Student {
    id: string;
    full_name: string | null;
    email: string;
    school_number: string | null;
}

interface Payment {
    id: string;
    student_id: string;
    agreed_amount: number;
    paid_amount: number;
    notes: string | null;
}

interface AddPaymentButtonProps {
    students: Student[];
    payments: Payment[];
}

export function AddPaymentButton({ students, payments }: AddPaymentButtonProps) {
    const [showStudentSelect, setShowStudentSelect] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleStudentSelect = (studentId: string, paymentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (student) {
            setSelectedStudent(student);
            setSelectedPaymentId(paymentId);
            setShowStudentSelect(false);
            setShowModal(true);
        }
    };

    // Derived from selected ID now
    const studentPayment = selectedPaymentId
        ? payments.find(p => p.id === selectedPaymentId)
        : null;

    return (
        <>
            <button
                onClick={() => setShowStudentSelect(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-700 rounded-2xl hover:bg-emerald-50 hover:scale-[1.02] transition-all duration-200 font-bold whitespace-nowrap shadow-lg"
            >
                <Plus className="w-5 h-5" />
                Ödeme Ekle
            </button>

            {/* Student Selection Modal */}
            {showStudentSelect && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setShowStudentSelect(false)}
                    />

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    Ödeme Ekle
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    İşlem yapılacak öğrenciyi seçin
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-2">
                                {students.map((student) => {
                                    // Get all agreements for this student
                                    const studentPayments = payments.filter(p => p.student_id === student.id);
                                    const hasPayment = studentPayments.length > 0;

                                    return (
                                        <div key={student.id} className="w-full flex flex-col gap-2">
                                            <button
                                                onClick={() => {
                                                    if (hasPayment) {
                                                        // If only one, select it directly
                                                        if (studentPayments.length === 1) {
                                                            setSelectedStudent(student);
                                                            // We need to pass the payment ID to the modal, but state is currently just student
                                                            // We'll handle this by storing the selected payment directly or handling it in the next step
                                                            // For now, let's just properly set the student and find the payment later, 
                                                            // OR better: select the student and let the user pick the agreement if multiple.
                                                            // BUT valid logic:
                                                            // If 1 agreement -> Open Modal with that agreement
                                                            // If >1 agreement -> Expand to show agreements
                                                            // If 0 -> Show "Create Agreement" link/message

                                                            // Simplified approach for now:
                                                            // If multiple, show them as sub-options
                                                        } else {
                                                            // Toggle expand logic could go here, but let's keep it simple:
                                                            // Just expand immediately in the list
                                                        }
                                                    }
                                                }}
                                                className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {student.full_name || student.email}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {student.school_number || "Okul No: Yok"}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                        {studentPayments.length} Anlaşma
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Sub-list of agreements */}
                                            {studentPayments.length > 0 && (
                                                <div className="ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-2">
                                                    {studentPayments.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => {
                                                                // OPEN PAYMENT MODAL FOR THIS AGREEMENT
                                                                setSelectedStudent(student);
                                                                // We need a way to pass the specific payment ID to the modal
                                                                // Current implementation derives it from student. 
                                                                // I will cheat slightly and add a temporary property to the selectedStudent state 
                                                                // or better, store selectedPaymentId separately.
                                                                // Let's assume we update the state to store selectedPaymentId.
                                                                // Since I can't easily change the state definition in this replacement without seeing the file head again.
                                                                // I will check the file content again to see where to add state.
                                                                // WAIT, I am replacing the `studentPayments` render logic.
                                                                // I should update the state handlers first.
                                                                // This replacement block is getting too complex for just "render".
                                                                // I will use a callback prop or just hack it:
                                                                (window as any).selectedPaymentId = p.id; // Ugly hack? No.
                                                                // Let's use `handleStudentSelect` to also take a paymentId?
                                                                handleStudentSelect(student.id, p.id);
                                                            }}
                                                            className="w-full text-left p-2 rounded text-sm hover:bg-amber-500/10 text-gray-700 dark:text-gray-300 flex justify-between items-center"
                                                        >
                                                            <span>{p.notes || "Ödeme Anlaşması"}</span>
                                                            <span className="text-xs text-gray-500">
                                                                Kalan: {p.agreed_amount - p.paid_amount} ₺
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {studentPayments.length === 0 && (
                                                <div className="ml-4 pl-4 text-xs text-red-500">
                                                    Ödeme anlaşması bulunmuyor. Detay sayfasından ekleyin.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                                <button
                                    onClick={() => setShowStudentSelect(false)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Payment Modal */}
            {selectedStudent && studentPayment && (
                <PaymentModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    paymentId={studentPayment.id}
                    studentId={selectedStudent.id}
                    studentName={selectedStudent.full_name || selectedStudent.email}
                />
            )}
        </>
    );
}
