// Ders Yönetim Sistemi Tipleri

export type LessonMaterialType = 'pdf' | 'video' | 'link' | 'file' | 'document';
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface Lesson {
    id: string;
    lesson_number: number;
    title: string;
    description: string | null;
    content: string | null;
    duration_minutes: number;
    order: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface LessonMaterial {
    id: string;
    lesson_id: string;
    type: LessonMaterialType;
    title: string;
    file_url: string | null;
    file_size: number | null;
    order: number;
    created_at: string;
}

export interface ClassLesson {
    id: string;
    class_id: string;
    lesson_id: string;
    teacher_id: string | null;
    scheduled_date: string | null;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
    notes: string | null;
    assigned_at: string;
    updated_at: string;
}

export interface StudentLessonProgress {
    id: string;
    student_id: string;
    class_lesson_id: string;
    status: LessonProgressStatus;
    progress_percentage: number;
    started_at: string | null;
    completed_at: string | null;
    last_accessed_at: string | null;
}

export interface LessonAssignment {
    id: string;
    class_lesson_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    max_score: number;
    created_at: string;
}

export interface StudentSubmission {
    id: string;
    assignment_id: string;
    student_id: string;
    file_url: string | null;
    notes: string | null;
    submitted_at: string;
    score: number | null;
    feedback: string | null;
    graded_at: string | null;
    graded_by: string | null;
}

// Genişletilmiş tipler (JOIN sonuçları için)
export interface LessonWithMaterials extends Lesson {
    materials: LessonMaterial[];
}

export interface ClassLessonWithDetails extends ClassLesson {
    lesson: Lesson;
    class: {
        id: string;
        name: string;
    };
    teacher: {
        id: string;
        full_name: string;
    } | null;
}

export interface StudentProgressWithLesson extends StudentLessonProgress {
    class_lesson: ClassLessonWithDetails;
}
