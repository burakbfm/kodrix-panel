// YENİ Ders Yönetim Sistemi Tipleri - Hiyerarşik Yapı

export type LessonMaterialType = 'pdf' | 'video' | 'link' | 'file' | 'document';
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

// Program (Kurs)
export interface Program {
    id: string;
    title: string;
    description: string | null;
    total_lessons: number;
    total_modules: number;
    duration_weeks: number | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

// Modül
export interface Module {
    id: string;
    program_id: string;
    title: string;
    description: string | null;
    order: number;
    created_at: string;
}

// Ders
export interface Lesson {
    id: string;
    module_id: string;
    lesson_number: number;
    title: string;
    description: string | null;
    content: string | null;
    meeting_link: string | null;  // Katılım linki
    duration_minutes: number;
    order: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

// Ders Materyali
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

// Sınıf-Program Ataması
export interface ClassProgram {
    id: string;
    class_id: string;
    program_id: string;
    teacher_id: string | null;
    start_date: string | null;
    is_active: boolean;
    notes: string | null;
    assigned_at: string;
    updated_at: string;
}

// Öğrenci İlerlemesi
export interface StudentLessonProgress {
    id: string;
    student_id: string;
    lesson_id: string;
    status: LessonProgressStatus;
    progress_percentage: number;
    started_at: string | null;
    completed_at: string | null;
    last_accessed_at: string | null;
}

// Ödev
export interface LessonAssignment {
    id: string;
    lesson_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    max_score: number;
    created_at: string;
}

// Ödev Gönderimi
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

// Genişletilmiş Tipler
export interface ProgramWithModules extends Program {
    modules: ModuleWithLessons[];
}

export interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

export interface LessonWithMaterials extends Lesson {
    materials: LessonMaterial[];
}

export interface ClassProgramWithDetails extends ClassProgram {
    program: Program;
    class: {
        id: string;
        name: string;
    };
    teacher: {
        id: string;
        full_name: string;
    } | null;
}
