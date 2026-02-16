"use client";

import { useState } from "react";
import { FileText, Download, Lock, ChevronDown, ChevronUp, MonitorPlay, File } from "lucide-react";
import Link from "next/link";

interface Attachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    category?: 'document' | 'slide';
}

interface LessonAttachmentsProps {
    attachments: Attachment[] | string | null; // Can be JSON string or parsed array
}

export default function LessonAttachments({ attachments }: LessonAttachmentsProps) {
    const [showStudent, setShowStudent] = useState(false);
    const [showTeacher, setShowTeacher] = useState(false);

    if (!attachments) return null;

    let parsedAttachments: Attachment[] = [];
    try {
        if (typeof attachments === 'string') {
            parsedAttachments = JSON.parse(attachments);
        } else if (Array.isArray(attachments)) {
            parsedAttachments = attachments;
        }
    } catch (e) {
        console.error("Failed to parse attachments", e);
        return null;
    }

    if (parsedAttachments.length === 0) return null;

    // slide -> Student
    // document -> Teacher
    // others -> Student (fallback)
    const teacherFiles = parsedAttachments.filter(f => f.category === 'document');
    const studentFiles = parsedAttachments.filter(f => f.category === 'slide' || (f.category !== 'document'));

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="mt-4 space-y-3">
            {/* Student Files Toggle */}
            {studentFiles.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setShowStudent(!showStudent)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        <div className="flex items-center gap-2">
                            <MonitorPlay className="w-4 h-4 text-blue-500" />
                            <span>Öğrenci Materyalleri ({studentFiles.length})</span>
                        </div>
                        {showStudent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showStudent && (
                        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-2">
                            {studentFiles.map((file, idx) => (
                                <Link
                                    key={file.id || idx}
                                    href={file.url}
                                    target="_blank"
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group transition"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                            <File className="w-4 h-4" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">{formatSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Teacher Files Toggle */}
            {teacherFiles.length > 0 && (
                <div className="border border-amber-200 dark:border-amber-900/30 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setShowTeacher(!showTeacher)}
                        className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition text-sm font-medium text-amber-800 dark:text-amber-400"
                    >
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Öğretmen Materyalleri ({teacherFiles.length})</span>
                        </div>
                        {showTeacher ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showTeacher && (
                        <div className="p-3 bg-white dark:bg-gray-900 border-t border-amber-200 dark:border-amber-900/30 space-y-2">
                            {teacherFiles.map((file, idx) => (
                                <Link
                                    key={file.id || idx}
                                    href={file.url}
                                    target="_blank"
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 border border-transparent hover:border-amber-200 dark:hover:border-amber-900/30 group transition"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-600 dark:text-amber-400">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">{formatSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <Download className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
