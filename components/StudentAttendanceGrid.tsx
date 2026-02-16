import { CheckCircle, XCircle, CircleSlash } from "lucide-react";

interface Lesson {
    id: string;
    title: string;
    date: string | null;
}

interface AttendanceRecord {
    lesson_id: string;
    status: string; // 'present' | 'absent'
}

interface StudentAttendanceGridProps {
    lessons: Lesson[];
    attendance: AttendanceRecord[];
}

export default function StudentAttendanceGrid({ lessons, attendance }: StudentAttendanceGridProps) {
    // Map lesson_id -> status
    const attendanceMap = new Map<string, string>();
    attendance.forEach(record => {
        attendanceMap.set(record.lesson_id, record.status);
    });

    return (
        <div className="flex flex-wrap gap-1.5 max-w-[480px]">
            {lessons.map((lesson, index) => {
                const status = attendanceMap.get(lesson.id);
                let bgColor = "bg-gray-200 dark:bg-gray-700";
                let borderColor = "border-gray-300 dark:border-gray-600";
                let title = `${index + 1}. ${lesson.title || "İsimsiz Ders"}`;

                if (status === "present") {
                    bgColor = "bg-green-500 hover:bg-green-600";
                    borderColor = "border-green-600";
                    title += " (Geldi)";
                } else if (status === "absent") {
                    bgColor = "bg-red-500 hover:bg-red-600";
                    borderColor = "border-red-600";
                    title += " (Gelmedi)";
                } else {
                    title += " (İşlenmedi / Kayıt Yok)";
                }

                return (
                    <div
                        key={lesson.id}
                        className={`w-6 h-6 rounded-md border ${bgColor} ${borderColor} transition-colors cursor-help`}
                        title={title}
                    />
                );
            })}
        </div>
    );
}
