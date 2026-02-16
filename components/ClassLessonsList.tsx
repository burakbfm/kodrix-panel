"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Folder, Calendar, Video, MessageSquare, Edit, Save, BookOpen,
    ChevronDown, ChevronRight, Clock
} from "lucide-react";
import LessonAttachments from "@/components/LessonAttachments";
import LessonToggleButton from "@/components/LessonToggleButton";
import { SubmitButton } from "@/components/SubmitButton";
import { toggleLessonActive, updateLessonDetails } from "@/app/admin/classes/class-actions";

interface ClassLessonsListProps {
    classId: string;
    studentCount: number;
    lessonsWithAttendance: any[]; // Using any for simplicity as per existing code patterns, or define interface
}

export default function ClassLessonsList({
    classId,
    studentCount,
    lessonsWithAttendance
}: ClassLessonsListProps) {

    // Group lessons by module_name, preserving order
    const groupedLessons: Record<string, any[]> = {};
    const moduleOrder: string[] = []; // To track the order of modules based on lesson dates
    const noModuleLessons: any[] = [];

    lessonsWithAttendance.forEach((lesson) => {
        if (lesson.module_name) {
            if (!groupedLessons[lesson.module_name]) {
                groupedLessons[lesson.module_name] = [];
                moduleOrder.push(lesson.module_name);
            }
            groupedLessons[lesson.module_name].push(lesson);
        } else {
            noModuleLessons.push(lesson);
        }
    });

    // Use the captured order instead of alphabetical sort
    const moduleNames = moduleOrder;

    // State for expanded modules
    // Default: all expanded or first one? User usually wants to see current stuff.
    // Let's default to all expanded for now, or maybe just the first one?
    // "Modül modül listelesene modüle tıklayınca modüldeki ders kartları gelsin" implies they might want them collapsed initially?
    // Let's start with all collapsed except the first one if exists, or just all collapsed.
    // Actually, usually "General" (no module) should be visible?

    // Let's initialize with all collapsed to reduce "clutter".
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const toggleModule = (moduleName: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    if (lessonsWithAttendance.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Henüz ders yok</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Önce bir program atayın, dersler otomatik olarak tanımlanacak
                </p>
                <Link
                    href={`/admin/classes/${classId}?tab=programs`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kodrix-purple to-purple-600 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                    <BookOpen className="w-5 h-5" />
                    Program Ata
                </Link>
            </div>
        );
    }

    const renderLessonCard = (lesson: any) => {
        const attendanceRate = studentCount > 0
            ? (lesson.attendance_count / studentCount) * 100
            : 0;

        return (
            <div
                key={lesson.id}
                className={`bg-white dark:bg-gray-900 rounded-xl border p-6 transition mb-4 ${lesson.is_active
                    ? "border-green-300 dark:border-green-700 shadow-sm"
                    : "border-gray-200 dark:border-gray-800 opacity-75"
                    }`}
            >
                {/* Lesson Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {lesson.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${lesson.is_active
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500"
                                }`}>
                                {lesson.is_active ? "Aktif" : "Pasif"}
                            </span>
                        </div>
                        {/* Module name is shown in header in old version. Here we are inside a module group, so maybe redundant? 
                            But if it's in 'noModuleLessons', we might not show it. 
                            Users might still double check. Let's keep it but maybe smaller. 
                            Actually if we are in an accordion "Module 1", repeating "Module 1" is redundant.
                        */}
                        {lesson.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{lesson.description}</p>
                        )}
                    </div>

                    {/* Toggle Active Button */}
                    <LessonToggleButton
                        isActive={lesson.is_active}
                        lessonId={lesson.id}
                        classId={classId}
                        toggleAction={toggleLessonActive}
                    />
                </div>

                {/* Lesson Info & Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {/* Left: Attendance + Link */}
                    <div className="space-y-3">
                        {/* Attendance Badge */}
                        {lesson.is_active && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Katılım:</span>
                                <span className={`px-3 py-1 rounded-full text-white font-bold text-xs ${attendanceRate === 100 ? "bg-green-500" :
                                    attendanceRate >= 75 ? "bg-yellow-500" :
                                        attendanceRate >= 50 ? "bg-orange-500" : "bg-red-500"
                                    }`}>
                                    {lesson.attendance_count}/{studentCount} ({Math.round(attendanceRate)}%)
                                </span>
                                <Link
                                    href={`/admin/classes/${classId}/attendance/new?lesson_id=${lesson.id}`}
                                    className="text-sm text-kodrix-purple dark:text-amber-500 hover:underline font-semibold"
                                >
                                    Yoklama Al →
                                </Link>
                            </div>
                        )}

                        {/* Attachments */}
                        <LessonAttachments attachments={lesson.source_lesson?.attachments || lesson.attachments} />

                        {/* Meeting Link */}
                        {(lesson.meeting_link || lesson.source_lesson?.meeting_link) && (
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-blue-500" />
                                <a
                                    href={lesson.meeting_link || lesson.source_lesson?.meeting_link}
                                    target="_blank"
                                    rel="noopener"
                                    className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                                >
                                    Toplantı Linki
                                </a>
                            </div>
                        )}

                        {/* Teacher Notes */}
                        {lesson.teacher_notes && (
                            <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-yellow-500 mt-0.5" />
                                <p className="text-sm text-gray-700 dark:text-gray-300">{lesson.teacher_notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Edit Controls */}
                    <form action={updateLessonDetails} className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        <input type="hidden" name="lesson_id" value={lesson.id} />
                        <input type="hidden" name="class_id" value={classId} />

                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Edit className="w-4 h-4" />
                            Dersi Düzenle
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                name="lesson_date"
                                defaultValue={lesson.lesson_date || ""}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-kodrix-purple"
                                placeholder="Tarih"
                            />
                            <input
                                type="time"
                                name="lesson_time"
                                defaultValue={lesson.lesson_time?.slice(0, 5) || ""}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-kodrix-purple"
                                placeholder="Saat"
                            />
                        </div>
                        <div className="space-y-2">
                            <input
                                type="url"
                                name="meeting_link"
                                defaultValue={lesson.meeting_link || lesson.source_lesson?.meeting_link || ""}
                                placeholder="Toplantı linki (Zoom, Meet vb.)"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-1 focus:ring-kodrix-purple"
                            />
                            <textarea
                                name="teacher_notes"
                                defaultValue={lesson.teacher_notes || ""}
                                placeholder="Ders notu ekle..."
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none focus:ring-1 focus:ring-kodrix-purple"
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <SubmitButton
                                className="px-4 py-2 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:shadow-md transition"
                                loadingText="Kaydediliyor..."
                            >
                                <Save className="w-3.5 h-3.5" />
                                Kaydet
                            </SubmitButton>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">

            {/* Render Modules */}
            {moduleNames.map(moduleName => {
                const isExpanded = expandedModules[moduleName];
                const lessons = groupedLessons[moduleName];
                const activeCount = lessons.filter(l => l.is_active).length;

                return (
                    <div key={moduleName} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <button
                            onClick={() => toggleModule(moduleName)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                                <div className="flex items-center gap-2">
                                    <Folder className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg text-left">{moduleName}</h3>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {lessons.length} Ders
                                </span>
                            </div>
                            <div className="text-sm text-gray-500">
                                {activeCount} Aktif
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
                                {lessons.map(renderLessonCard)}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Render Lessons without Module */}
            {noModuleLessons.length > 0 && (
                <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 pl-2 border-l-4 border-gray-300 dark:border-gray-700 ml-1">
                        Diğer Dersler
                    </h3>
                    <div className="grid gap-4">
                        {noModuleLessons.map(renderLessonCard)}
                    </div>
                </div>
            )}
        </div>
    );
}
