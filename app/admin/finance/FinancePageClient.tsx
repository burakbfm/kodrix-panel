"use client";

import { useState } from "react";
import Link from "next/link";
import {
    DollarSign, TrendingUp, Users, AlertCircle,
    CheckCircle, Clock, ArrowRight, Search, Plus, Trash2, TrendingDown,
    GraduationCap, LayoutDashboard, ChevronLeft, ChevronRight
} from "lucide-react";
import { AddPaymentButton } from "@/components/AddPaymentButton";
import { createExpense, deleteExpense } from "@/app/admin/actions";
import { useDebounce } from "use-debounce";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface FinancePageClientProps {
    students: any[];
    teachers: any[];
    payments: any[];
    expenses: any[];
    monthlyStats: any[];
}

export function FinancePageClient({ students, teachers, payments, expenses, monthlyStats }: FinancePageClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'expenses'>('students');
    const [expenseCategory, setExpenseCategory] = useState("teacher_payment");

    // --- AGGREGATE PAYMENTS BY STUDENT ---
    const studentPaymentStats = new Map();
    payments.forEach(p => {
        const current = studentPaymentStats.get(p.student_id) || { agreed: 0, paid: 0, count: 0 };
        studentPaymentStats.set(p.student_id, {
            agreed: current.agreed + (p.agreed_amount || 0),
            paid: current.paid + (p.paid_amount || 0),
            count: current.count + 1
        });
    });

    // --- AGGREGATE PAYMENTS BY TEACHER ---
    const teacherPaymentStats = new Map();
    expenses.filter(e => e.teacher_id).forEach(e => {
        const current = teacherPaymentStats.get(e.teacher_id) || 0;
        teacherPaymentStats.set(e.teacher_id, current + (e.amount || 0));
    });

    // --- FILTER LISTS ---
    const searchLower = debouncedSearch.toLowerCase();

    const filteredStudents = students.filter(student =>
        (student.full_name?.toLowerCase().includes(searchLower)) ||
        (student.email?.toLowerCase().includes(searchLower)) ||
        (student.school_number?.toLowerCase().includes(searchLower))
    );

    const filteredTeachers = teachers.filter(teacher =>
        (teacher.full_name?.toLowerCase().includes(searchLower)) ||
        (teacher.email?.toLowerCase().includes(searchLower)) ||
        (teacher.subject_field?.toLowerCase().includes(searchLower))
    );

    const filteredExpenses = expenses.filter(expense =>
        (expense.title?.toLowerCase().includes(searchLower)) ||
        (expense.description?.toLowerCase().includes(searchLower)) ||
        (expense.profiles?.full_name?.toLowerCase().includes(searchLower))
    );


    // --- CALCULATE TOTALS ---
    const totalStudents = students.length;
    const studentsWithAgreements = new Set(payments.map(p => p.student_id)).size;
    const totalAgreed = payments.reduce((sum, p) => sum + (p.agreed_amount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netBalance = totalPaid - totalExpenses;


    // --- PAGINATION LOGIC ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset page on tab/search change
    // Note: In Next.js App Router client components, we can use key prop on the tab content to reset state 
    // or use a simple effect. Since we want to use useEffect, we need to import it.
    // Instead of importing useEffect, we can just reset in the set functions or derive state if possible.
    // But simplest is to just manually reset when tab changes.

    // We'll handle the reset in the tab switching function.
    const handleTabChange = (tab: 'students' | 'teachers' | 'expenses') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    // Calculate pagination
    const getCurrentData = () => {
        if (activeTab === 'students') return filteredStudents;
        if (activeTab === 'teachers') return filteredTeachers;
        return filteredExpenses;
    };

    const currentData = getCurrentData();
    const totalItems = currentData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = currentData.slice(startIndex, endIndex);

    const renderPagination = () => {
        if (totalItems === 0) return null;

        return (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <span>Satır sayısı:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 focus:ring-2 focus:ring-kodrix-purple"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">
                        {startIndex + 1}-{Math.min(endIndex, totalItems)} / {totalItems} kayıt
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Simple logic to show window of pages could be added here, 
                                // for now just showing first 5 or simpler logic if pages > 5
                                // Let's keep it simple: Current Page display
                                return null;
                            })}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {currentPage}
                            </span>
                            <span className="mx-1">/</span>
                            <span>{totalPages}</span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 space-y-8">


            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-kodrix-purple dark:text-amber-500" />
                        Finans Yönetimi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Öğrenci ödemeleri, öğretmen maaşları ve gider takibi
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-md"
                    >
                        <TrendingDown className="w-5 h-5" />
                        Gider Ekle
                    </button>
                    <AddPaymentButton
                        students={students || []}
                        payments={payments || []}
                    />
                </div>
            </div>

            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Öğrenciler</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{studentsWithAgreements} Anlaşmalı</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Beklenen</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate" title={`${totalAgreed} ₺`}>
                        {totalAgreed.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Tahsilat</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate" title={`${totalPaid} ₺`}>
                        {totalPaid.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Giderler</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate" title={`${totalExpenses} ₺`}>
                        {totalExpenses.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-kodrix-purple dark:border-amber-500 shadow-sm border-l-4 border-l-kodrix-purple dark:border-l-amber-500">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Net Kasa</span>
                    </div>
                    <p className={`text-lg font-bold truncate ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {netBalance.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
            </div>

            {/* Analytics Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-kodrix-purple dark:border-amber-500 p-6 shadow-sm h-96">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-gray-500" />
                    Aylık Finansal Durum
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={monthlyStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                            itemStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="income" name="Gelir" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Gider" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Content Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => handleTabChange('students')}
                    className={`pb-3 px-1 font-medium text-sm transition ${activeTab === 'students' ? 'text-kodrix-purple dark:text-amber-500 border-b-2 border-kodrix-purple dark:border-amber-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Öğrenci Ödemeleri
                </button>
                <button
                    onClick={() => handleTabChange('teachers')}
                    className={`pb-3 px-1 font-medium text-sm transition ${activeTab === 'teachers' ? 'text-kodrix-purple dark:text-amber-500 border-b-2 border-kodrix-purple dark:border-amber-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Öğretmen Ödemeleri
                </button>
                <button
                    onClick={() => handleTabChange('expenses')}
                    className={`pb-3 px-1 font-medium text-sm transition ${activeTab === 'expenses' ? 'text-kodrix-purple dark:text-amber-500 border-b-2 border-kodrix-purple dark:border-amber-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Gider Listesi
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-kodrix-purple dark:border-amber-500 overflow-hidden shadow-sm">

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {activeTab === 'students' && <Users className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />}
                        {activeTab === 'teachers' && <GraduationCap className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />}
                        {activeTab === 'expenses' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {activeTab === 'students' ? 'Öğrenci Listesi' : activeTab === 'teachers' ? 'Öğretmen Listesi' : 'Tüm Giderler'}
                        <span className="ml-2 text-xs font-normal text-gray-500">({totalItems} kayıt)</span>
                    </h2>

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset page on search
                            }}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        {activeTab === 'students' && (
                            <>
                                <thead className="bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Öğrenci</th>
                                        <th className="p-4 text-center">Anlaşma Sayısı</th>
                                        <th className="p-4 text-right">Toplam Anlaşma</th>
                                        <th className="p-4 text-right">Toplam Ödenen</th>
                                        <th className="p-4 text-right">Kalan</th>
                                        <th className="p-4">Durum</th>
                                        <th className="p-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {(paginatedData as typeof students).map((student) => {
                                        const stats = studentPaymentStats.get(student.id) || { agreed: 0, paid: 0, count: 0 };
                                        const remaining = stats.agreed - stats.paid;
                                        const percentage = stats.agreed > 0 ? (stats.paid / stats.agreed) * 100 : 0;

                                        let statusColor = "gray";
                                        let statusText = "Anlaşma Yok";
                                        if (stats.count > 0) {
                                            if (remaining <= 0) { statusColor = "green"; statusText = "Tamamlandı"; }
                                            else if (stats.paid > 0) { statusColor = "blue"; statusText = "Devam Ediyor"; }
                                            else { statusColor = "yellow"; statusText = "Ödeme Bekliyor"; }
                                        }

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-kodrix-purple/10 text-kodrix-purple dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                                                            {(student.full_name || student.email)?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{student.full_name || "İsimsiz"}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{student.school_number || student.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {stats.count > 0 ? (
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium border border-gray-200 dark:border-gray-700">
                                                            {stats.count} Adet
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                                                    {stats.agreed > 0 ? `${stats.agreed.toLocaleString('tr-TR')} ₺` : "-"}
                                                </td>
                                                <td className="p-4 text-right font-semibold text-green-600 dark:text-green-400">
                                                    {stats.paid > 0 ? `${stats.paid.toLocaleString('tr-TR')} ₺` : "-"}
                                                </td>
                                                <td className="p-4 text-right font-semibold text-amber-600 dark:text-amber-400">
                                                    {remaining > 0 ? `${remaining.toLocaleString('tr-TR')} ₺` : "-"}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs px-2 py-0.5 rounded border border-${statusColor}-500/30 bg-${statusColor}-500/10 text-${statusColor}-600 dark:text-${statusColor}-400`}>
                                                                {statusText}
                                                            </span>
                                                        </div>
                                                        {stats.count > 0 && stats.agreed > 0 && (
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                                                                <div
                                                                    className={`h-1.5 rounded-full bg-${statusColor}-500`}
                                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Link href={`/admin/finance/${student.id}`} className="inline-flex items-center gap-1 text-kodrix-purple dark:text-amber-400 hover:opacity-80 text-sm font-medium transition">Detay <ArrowRight className="w-4 h-4" /></Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                Kayıt bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        )}

                        {activeTab === 'teachers' && (
                            <>
                                <thead className="bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Öğretmen</th>
                                        <th className="p-4">Branş</th>
                                        <th className="p-4 text-right">Toplam Ödeme Yapılan</th>
                                        <th className="p-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {(paginatedData as typeof teachers).map((teacher) => {
                                        const paid = teacherPaymentStats.get(teacher.id) || 0;
                                        return (
                                            <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                                                            {teacher.full_name?.[0] || 'T'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{teacher.full_name}</div>
                                                            <div className="text-xs text-gray-500">{teacher.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{teacher.subject_field || "-"}</td>
                                                <td className="p-4 text-right font-bold text-gray-900 dark:text-white">{paid > 0 ? `${paid.toLocaleString('tr-TR')} ₺` : "-"}</td>
                                                <td className="p-4 text-right">
                                                    <Link href={`/admin/finance/teacher/${teacher.id}`} className="text-kodrix-purple dark:text-amber-500 hover:opacity-80 text-sm font-medium">Detay</Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTeachers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                Kayıt bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        )}

                        {activeTab === 'expenses' && (
                            <>
                                <thead className="bg-gray-50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Başlık / Açıklama</th>
                                        <th className="p-4">Kategori</th>
                                        <th className="p-4">İlgili Kişi</th>
                                        <th className="p-4">Tarih</th>
                                        <th className="p-4 text-right">Tutar</th>
                                        <th className="p-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {(paginatedData as typeof expenses).map((expense) => (
                                        <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{expense.title}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{expense.description}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs border ${expense.category === 'teacher_payment' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}>
                                                    {expense.category === 'teacher_payment' ? 'Öğretmen Ödemesi' : 'Diğer Gider'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                                {expense.profiles?.full_name || "-"}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {new Date(expense.payment_date).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td className="p-4 text-right font-bold text-red-600 dark:text-red-400">
                                                - {expense.amount?.toLocaleString("tr-TR")} ₺
                                            </td>
                                            <td className="p-4 text-right">
                                                <form action={deleteExpense}>
                                                    <input type="hidden" name="expenseId" value={expense.id} />
                                                    <button type="submit" className="text-gray-400 hover:text-red-500 transition">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                Henüz gider kaydı yok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {renderPagination()}
            </div>

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-kodrix-purple dark:border-amber-500 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yeni Gider Ekle</h2>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">&times;</button>
                        </div>

                        <form action={async (formData) => {
                            await createExpense(formData);
                            setIsExpenseModalOpen(false);
                            setExpenseCategory("teacher_payment"); // reset
                        }} className="p-6 space-y-4 overflow-y-auto">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık</label>
                                <input type="text" name="title" required placeholder="Örn: Maaş Ödemesi" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tutar (TL)</label>
                                    <input type="number" name="amount" required step="0.01" min="0" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih</label>
                                    <input type="date" name="paymentDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                                <select
                                    name="category"
                                    value={expenseCategory}
                                    onChange={(e) => setExpenseCategory(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple"
                                >
                                    <option value="teacher_payment">Öğretmen Ödemesi</option>
                                    <option value="other">Diğer Gider</option>
                                </select>
                            </div>

                            {expenseCategory === 'teacher_payment' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öğretmen Seç</label>
                                    <select
                                        name="teacherId"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                                <textarea name="description" rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black/20 p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple" />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">İptal</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-lg font-bold hover:opacity-90 transition">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
