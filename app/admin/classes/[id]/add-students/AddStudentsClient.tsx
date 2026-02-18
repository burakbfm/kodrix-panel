"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Search } from "lucide-react";
import { enrollStudents } from "@/app/admin/actions";

interface Student {
    id: string;
    full_name: string;
    email: string;
    school_number: string | null;
}

interface AddStudentsClientProps {
    classId: string;
    className: string;
    availableStudents: Student[];
}

export default function AddStudentsClient({
    classId,
    className,
    availableStudents
}: AddStudentsClientProps) {
    const router = useRouter();
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter students based on search
    const filteredStudents = availableStudents.filter((student) => {
        const query = searchQuery.toLowerCase();
        return (
            student.full_name?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query) ||
            student.school_number?.toLowerCase().includes(query)
        );
    });

    const toggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedStudents.size === 0) {
            alert("Lütfen en az bir öğrenci seçin");
            return;
        }

        setLoading(true);

        const studentIds = Array.from(selectedStudents);

        try {
            await enrollStudents(classId, studentIds);
            // Success! Hard redirect to force cache refresh
            window.location.href = `/admin/classes/${classId}?tab=students`;
        } catch (error: any) {
            console.error("Öğrenci ekleme hatası:", error);
            alert("Öğrenci eklenirken hata oluştu: " + error.message);
            setLoading(false);
        }

        // Success! Hard redirect to force cache refresh
        window.location.href = `/admin/classes/${classId}?tab=students`;
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <Link
                    href={`/admin/classes/${classId}?tab=students`}
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Geri Dön
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Öğrenci Ekle
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {className} sınıfına öğrenci ekleyin
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="İsim, email veya okul numarası ile ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 focus:border-transparent transition outline-none"
                            />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {filteredStudents.length} öğrenci bulundu
                            {selectedStudents.size > 0 && ` • ${selectedStudents.size} seçili`}
                        </p>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Mevcut Öğrenciler
                    </h2>

                    {filteredStudents.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredStudents.map((student) => (
                                <label
                                    key={student.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition cursor-pointer ${selectedStudents.has(student.id)
                                        ? "bg-kodrix-purple/10 dark:bg-amber-500/10 border-2 border-kodrix-purple dark:border-amber-500"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.has(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-kodrix-purple dark:text-amber-500 focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500"
                                    />
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 flex items-center justify-center font-semibold text-white dark:text-gray-900">
                                        {student.full_name?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {student.full_name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {student.school_number || student.email}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            {searchQuery ? (
                                <>
                                    <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        "{searchQuery}" için sonuç bulunamadı
                                    </p>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Tüm öğrenciler bu sınıfa zaten kayıtlı
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href={`/admin/classes/${classId}?tab=students`}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        disabled={selectedStudents.size === 0 || loading}
                        className="px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? "Ekleniyor..." : `${selectedStudents.size} Öğrenciyi Ekle`}
                    </button>
                </div>
            </form>
        </div>
    );
}
