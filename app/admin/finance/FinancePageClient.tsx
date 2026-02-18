"use client";

import { useState } from "react";
import Link from "next/link";
import {
    DollarSign, TrendingUp, Users, AlertCircle,
    CheckCircle, Clock, ArrowRight, Search, Plus, Trash2, TrendingDown,
    GraduationCap, LayoutDashboard, ChevronLeft, ChevronRight, Wallet, PiggyBank, Receipt
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
    const teacherExpenses = expenses.filter(e => e.category === 'teacher_payment').reduce((sum, e) => sum + (e.amount || 0), 0);
    const otherExpenses = expenses.filter(e => e.category !== 'teacher_payment').reduce((sum, e) => sum + (e.amount || 0), 0);
    const netBalance = totalPaid - totalExpenses;

    // --- PAGINATION LOGIC ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleTabChange = (tab: 'students' | 'teachers' | 'expenses') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

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
            <div className="p-5 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Satır:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 outline-none transition"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium">
                        {startIndex + 1}-{Math.min(endIndex, totalItems)} / {totalItems}
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-xs min-w-[50px] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">

            {/* ═══════ HERO HEADER ═══════ */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-700 dark:from-teal-700 dark:to-emerald-800 p-10 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <DollarSign className="w-10 h-10 text-white/80" />
                            Finans Yönetimi
                        </h1>
                        <p className="text-white/70 text-lg">
                            Öğrenci ödemeleri, öğretmen maaşları ve gider takibi
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-700 rounded-2xl hover:bg-emerald-50 hover:scale-[1.02] transition-all duration-200 font-bold whitespace-nowrap shadow-lg"
                        >
                            <TrendingDown className="w-5 h-5" />
                            Gider Ekle
                        </button>
                        <AddPaymentButton students={students || []} payments={payments || []} />
                    </div>
                </div>
            </div>

            {/* ═══════ OVERVIEW STAT CARDS ═══════ */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Students */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-wider">Öğrenci</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{totalStudents}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-semibold">{studentsWithAgreements} Anlaşmalı</p>
                </div>

                {/* Expected */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 uppercase tracking-wider">Beklenen</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white truncate" title={`${totalAgreed} ₺`}>
                        {totalAgreed.toLocaleString('tr-TR')} ₺
                    </p>
                </div>

                {/* Collected */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 uppercase tracking-wider">Tahsilat</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white truncate" title={`${totalPaid} ₺`}>
                        {totalPaid.toLocaleString('tr-TR')} ₺
                    </p>
                </div>

                {/* Net Balance */}
                <div className={`backdrop-blur-md rounded-3xl p-6 border shadow-xl shadow-gray-200/30 dark:shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${netBalance >= 0
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 border-emerald-200 dark:border-emerald-800/30'
                    : 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/10 border-rose-200 dark:border-rose-800/30'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${netBalance >= 0
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                            }`}>
                            <PiggyBank className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${netBalance >= 0
                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                            }`}>Net Kasa</span>
                    </div>
                    <p className={`text-2xl font-black truncate ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {netBalance.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
            </div>

            {/* ═══════ EXPENSE BREAKDOWN ═══════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Teacher Expenses */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Öğretmen Gideri</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white truncate" title={`${teacherExpenses} ₺`}>
                        {teacherExpenses.toLocaleString('tr-TR')} ₺
                    </p>
                </div>

                {/* Other Expenses */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 uppercase tracking-wider">Ekstra Gider</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white truncate" title={`${otherExpenses} ₺`}>
                        {otherExpenses.toLocaleString('tr-TR')} ₺
                    </p>
                </div>

                {/* Total Expenses */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 uppercase tracking-wider">Toplam Gider</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white truncate" title={`${totalExpenses} ₺`}>
                        {totalExpenses.toLocaleString('tr-TR')} ₺
                    </p>
                </div>
            </div>

            {/* ═══════ ANALYTICS CHART ═══════ */}
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-8 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    Aylık Finansal Durum
                </h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                            <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                                itemStyle={{ color: '#F3F4F6' }}
                                cursor={{ fill: 'rgba(107, 114, 128, 0.08)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="income" name="Gelir" fill="#10B981" radius={[8, 8, 0, 0]} barSize={24} />
                            <Bar dataKey="expense" name="Gider" fill="#EF4444" radius={[8, 8, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ═══════ TABS ═══════ */}
            <div className="flex gap-2 p-1.5 bg-gray-100/80 dark:bg-white/5 rounded-2xl w-fit border border-gray-200 dark:border-white/10 backdrop-blur-sm">
                <button onClick={() => handleTabChange('students')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'students'
                        ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-md'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}>
                    <Users className="w-4 h-4" />
                    Öğrenci Ödemeleri
                </button>
                <button onClick={() => handleTabChange('teachers')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'teachers'
                        ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-md'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}>
                    <GraduationCap className="w-4 h-4" />
                    Öğretmen Ödemeleri
                </button>
                <button onClick={() => handleTabChange('expenses')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'expenses'
                        ? 'bg-white dark:bg-gray-800 text-red-500 dark:text-red-400 shadow-md'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}>
                    <Receipt className="w-4 h-4" />
                    Gider Listesi
                </button>
            </div>

            {/* ═══════ TAB CONTENT ═══════ */}
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl shadow-gray-200/30 dark:shadow-black/10">

                {/* Search Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-black/10">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                        {activeTab === 'students' && <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
                        {activeTab === 'teachers' && <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
                        {activeTab === 'expenses' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {activeTab === 'students' ? 'Öğrenci Listesi' : activeTab === 'teachers' ? 'Öğretmen Listesi' : 'Tüm Giderler'}
                        <span className="ml-2 text-[11px] font-bold text-gray-500 bg-white dark:bg-white/10 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10">{totalItems} kayıt</span>
                    </h2>

                    <div className="relative w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-all outline-none placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">

                        {/* ── STUDENTS TABLE ── */}
                        {activeTab === 'students' && (
                            <>
                                <thead className="bg-gray-50/80 dark:bg-black/20 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-100 dark:border-white/5">
                                    <tr>
                                        <th className="p-5 pl-8">Öğrenci</th>
                                        <th className="p-5 text-center">Anlaşma</th>
                                        <th className="p-5 text-right">Toplam</th>
                                        <th className="p-5 text-right">Ödenen</th>
                                        <th className="p-5 text-right">Kalan</th>
                                        <th className="p-5">Durum</th>
                                        <th className="p-5 pr-8 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {(paginatedData as typeof students).map((student) => {
                                        const stats = studentPaymentStats.get(student.id) || { agreed: 0, paid: 0, count: 0 };
                                        const remaining = stats.agreed - stats.paid;
                                        const percentage = stats.agreed > 0 ? (stats.paid / stats.agreed) * 100 : 0;

                                        let statusColor = "gray";
                                        let statusText = "Anlaşma Yok";
                                        if (stats.count > 0) {
                                            if (remaining <= 0) { statusColor = "emerald"; statusText = "Tamamlandı"; }
                                            else if (stats.paid > 0) { statusColor = "blue"; statusText = "Devam Ediyor"; }
                                            else { statusColor = "amber"; statusText = "Ödeme Bekliyor"; }
                                        }

                                        const badgeClasses: Record<string, string> = {
                                            emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50",
                                            blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50",
                                            amber: "bg-amber-50 dark:bg-amber-900/20 text-teal-600 dark:text-teal-400 border-amber-100 dark:border-amber-800/50",
                                            gray: "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10"
                                        };
                                        const barColors: Record<string, string> = {
                                            emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500", gray: "bg-gray-300"
                                        };

                                        return (
                                            <tr key={student.id} className="group hover:bg-teal-50/50 dark:hover:bg-teal-900/[0.05] transition-all duration-200">
                                                <td className="p-5 pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-sm shadow-sm">
                                                            {(student.full_name || student.email)?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors text-sm">{student.full_name || "İsimsiz"}</p>
                                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{student.school_number || student.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    {stats.count > 0 ? (
                                                        <span className="px-2.5 py-1 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold border border-gray-100 dark:border-white/10">
                                                            {stats.count} Adet
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-5 text-right font-bold text-sm text-gray-900 dark:text-white">
                                                    {stats.agreed > 0 ? `${stats.agreed.toLocaleString('tr-TR')} ₺` : "-"}
                                                </td>
                                                <td className="p-5 text-right font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                    {stats.paid > 0 ? `${stats.paid.toLocaleString('tr-TR')} ₺` : "-"}
                                                </td>
                                                <td className="p-5 text-right font-bold text-sm text-teal-600 dark:text-teal-400">
                                                    {remaining > 0 ? `${remaining.toLocaleString('tr-TR')} ₺` : "-"}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                        <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold w-fit ${badgeClasses[statusColor]}`}>
                                                            {statusText}
                                                        </span>
                                                        {stats.count > 0 && stats.agreed > 0 && (
                                                            <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-500 ${barColors[statusColor]}`}
                                                                    style={{ width: `${Math.min(percentage, 100)}%` }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5 pr-8 text-right">
                                                    <Link href={`/admin/finance/${student.id}`}
                                                        className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 text-xs font-bold transition bg-teal-50 dark:bg-teal-500/10 px-3.5 py-2 rounded-xl border border-teal-200 dark:border-teal-500/20 hover:shadow-sm hover:scale-105">
                                                        Detay <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                                                        <Search className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Kayıt bulunamadı.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        )}

                        {/* ── TEACHERS TABLE ── */}
                        {activeTab === 'teachers' && (
                            <>
                                <thead className="bg-gray-50/80 dark:bg-black/20 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-100 dark:border-white/5">
                                    <tr>
                                        <th className="p-5 pl-8">Öğretmen</th>
                                        <th className="p-5">Branş</th>
                                        <th className="p-5 text-right">Toplam Ödeme</th>
                                        <th className="p-5 pr-8 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {(paginatedData as typeof teachers).map((teacher) => {
                                        const paid = teacherPaymentStats.get(teacher.id) || 0;
                                        return (
                                            <tr key={teacher.id} className="group hover:bg-teal-500/[0.03] dark:hover:bg-teal-900/[0.05] transition-all duration-200">
                                                <td className="p-5 pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-sm">
                                                            {teacher.full_name?.[0] || 'T'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{teacher.full_name}</div>
                                                            <div className="text-[11px] text-gray-500 font-medium mt-0.5">{teacher.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-sm text-gray-600 dark:text-gray-400 font-medium">{teacher.subject_field || "-"}</td>
                                                <td className="p-5 text-right font-bold text-sm text-gray-900 dark:text-white">{paid > 0 ? `${paid.toLocaleString('tr-TR')} ₺` : "-"}</td>
                                                <td className="p-5 pr-8 text-right">
                                                    <Link href={`/admin/finance/teacher/${teacher.id}`}
                                                        className="text-teal-600 dark:text-teal-400 hover:text-amber-700 dark:hover:text-amber-400 text-xs font-bold bg-teal-500/5 dark:bg-teal-500/10 px-3.5 py-2 rounded-xl border border-teal-500/10 dark:border-teal-500/20 hover:shadow-sm hover:scale-105 transition-all inline-flex items-center gap-1.5">
                                                        Detay <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTeachers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                                                        <Search className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Kayıt bulunamadı.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        )}

                        {/* ── EXPENSES TABLE ── */}
                        {activeTab === 'expenses' && (
                            <>
                                <thead className="bg-gray-50/80 dark:bg-black/20 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-100 dark:border-white/5">
                                    <tr>
                                        <th className="p-5 pl-8">Başlık / Açıklama</th>
                                        <th className="p-5">Kategori</th>
                                        <th className="p-5">İlgili Kişi</th>
                                        <th className="p-5">Tarih</th>
                                        <th className="p-5 text-right">Tutar</th>
                                        <th className="p-5 pr-8 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {(paginatedData as typeof expenses).map((expense) => (
                                        <tr key={expense.id} className="group hover:bg-red-50/30 dark:hover:bg-red-900/[0.03] transition-all duration-200">
                                            <td className="p-5 pl-8">
                                                <div className="font-bold text-sm text-gray-900 dark:text-white">{expense.title}</div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{expense.description}</div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${expense.category === 'teacher_payment'
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'
                                                    : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
                                                    }`}>
                                                    {expense.category === 'teacher_payment' ? 'Öğretmen Ödemesi' : 'Diğer Gider'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                {expense.profiles?.full_name || "-"}
                                            </td>
                                            <td className="p-5 text-sm text-gray-600 dark:text-gray-300 font-mono text-xs">
                                                {new Date(expense.payment_date).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td className="p-5 text-right font-bold text-sm text-red-600 dark:text-red-400">
                                                - {expense.amount?.toLocaleString("tr-TR")} ₺
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <form action={deleteExpense}>
                                                    <input type="hidden" name="expenseId" value={expense.id} />
                                                    <button type="submit" className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl hover:scale-110">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-16 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                                                        <Receipt className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Henüz gider kaydı yok.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>

                {/* PAGINATION */}
                {renderPagination()}
            </div>

            {/* ═══════ EXPENSE MODAL ═══════ */}
            {
                isExpenseModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsExpenseModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gradient-to-r from-red-50 to-teal-50 dark:from-red-900/10 dark:to-teal-900/10 rounded-t-3xl">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                    Yeni Gider Ekle
                                </h2>
                                <button onClick={() => setIsExpenseModalOpen(false)} className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:scale-110 transition-all shadow-sm">
                                    ✕
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form action={async (formData) => {
                                await createExpense(formData);
                                setIsExpenseModalOpen(false);
                                setExpenseCategory("teacher_payment");
                            }} className="p-6 space-y-5 overflow-y-auto">

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Başlık</label>
                                    <input type="text" name="title" required placeholder="Örn: Maaş Ödemesi"
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-transparent outline-none transition" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Tutar (TL)</label>
                                        <input type="number" name="amount" required step="0.01" min="0"
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-transparent outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Tarih</label>
                                        <input type="date" name="paymentDate" required defaultValue={new Date().toISOString().split('T')[0]}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-transparent outline-none transition" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Kategori</label>
                                    <select name="category" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-transparent outline-none transition">
                                        <option value="teacher_payment">Öğretmen Ödemesi</option>
                                        <option value="other">Diğer Gider</option>
                                    </select>
                                </div>

                                {expenseCategory === 'teacher_payment' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Öğretmen Seç</label>
                                        <select name="teacherId"
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-transparent outline-none transition">
                                            <option value="">Seçiniz...</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Açıklama</label>
                                    <textarea name="description" rows={3}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-500 focus:border-transparent outline-none transition resize-none" />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button type="button" onClick={() => setIsExpenseModalOpen(false)}
                                        className="flex-1 px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                        İptal
                                    </button>
                                    <button type="submit"
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-[1.01] transition-all">
                                        Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
