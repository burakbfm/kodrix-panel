// ============================================
// CLASS LESSONS, QUIZZES & ASSIGNMENTS TYPES
// ============================================

// Base types for class lessons
export interface ClassLesson {
    id: string;
    class_id: string;
    program_id: string | null;
    title: string;
    module_name: string | null;
    description: string | null;
    lesson_date: string;
    lesson_time: string | null;
    duration_minutes: number;
    meeting_link: string | null;
    recording_link: string | null;
    teacher_notes: string | null;
    is_active: boolean;
    teacher_id: string | null;
    created_at: string;
    updated_at: string;
}

export type ClassLessonInsert = Omit<ClassLesson, 'id' | 'created_at' | 'updated_at'>;
export type ClassLessonUpdate = Partial<ClassLessonInsert>;

export interface Quiz {
    id: string;
    title: string;
    description: string | null;
    time_limit_minutes: number | null;
    passing_score: number;
    show_correct_answers: boolean;
    shuffle_questions: boolean;
    shuffle_answers: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export type QuizInsert = Omit<Quiz, 'id' | 'created_at' | 'updated_at'>;
export type QuizUpdate = Partial<QuizInsert>;

export interface QuizQuestion {
    id: string;
    quiz_id: string;
    question_text: string;
    question_image_url: string | null;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    points: number;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export type QuizQuestionInsert = Omit<QuizQuestion, 'id' | 'created_at' | 'updated_at'>;

export interface QuizAnswer {
    id: string;
    question_id: string;
    answer_text: string | null;
    answer_image_url: string | null;
    is_correct: boolean;
    order_index: number;
    created_at: string;
}

export type QuizAnswerInsert = Omit<QuizAnswer, 'id' | 'created_at'>;

export interface ClassQuiz {
    id: string;
    class_id: string;
    quiz_id: string;
    lesson_id: string | null;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    assigned_by: string | null;
    created_at: string;
}

export type ClassQuizInsert = Omit<ClassQuiz, 'id' | 'created_at'>;

export interface QuizSubmission {
    id: string;
    class_quiz_id: string;
    student_id: string;
    score: number | null;
    total_points: number | null;
    percentage: number | null;
    started_at: string | null;
    submitted_at: string;
}

export type QuizSubmissionInsert = Omit<QuizSubmission, 'id' | 'submitted_at'>;

export interface QuizSubmissionAnswer {
    id: string;
    submission_id: string;
    question_id: string;
    selected_answer_id: string | null;
    text_answer: string | null;
    is_correct: boolean | null;
    points_earned: number | null;
    created_at: string;
}

export interface ClassAssignment {
    id: string;
    class_id: string;
    lesson_id: string | null;
    title: string;
    description: string;
    due_date: string;
    max_points: number;
    is_active: boolean;
    allow_late_submission: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export type ClassAssignmentInsert = Omit<ClassAssignment, 'id' | 'created_at' | 'updated_at'>;
export type ClassAssignmentUpdate = Partial<ClassAssignmentInsert>;

export interface ClassAssignmentSubmission {
    id: string;
    assignment_id: string;
    student_id: string;
    submission_text: string | null;
    file_url: string | null;
    file_name: string | null;
    submitted_at: string;
    is_late: boolean;
    score: number | null;
    feedback: string | null;
    graded_by: string | null;
    graded_at: string | null;
}

export type ClassAssignmentSubmissionInsert = Omit<ClassAssignmentSubmission, 'id' | 'submitted_at'>;


// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface ClassLessonWithDetails extends ClassLesson {
    class?: {
        id: string;
        name: string;
    };
    program?: {
        id: string;
        title: string;
    };
    teacher?: {
        id: string;
        full_name: string;
    };
    attendance_count?: number;
    total_students?: number;
    attendance_rate?: number;
}

export interface QuizWithQuestions extends Quiz {
    quiz_questions: (QuizQuestion & {
        quiz_answers: QuizAnswer[];
    })[];
}

export interface ClassQuizWithDetails extends ClassQuiz {
    quiz?: QuizWithQuestions;
    class?: {
        id: string;
        name: string;
    };
    lesson?: ClassLessonWithDetails;
    submission_count?: number;
    average_score?: number;
}

export interface ClassAssignmentWithDetails extends ClassAssignment {
    class?: {
        id: string;
        name: string;
    };
    lesson?: ClassLessonWithDetails;
    created_by_profile?: {
        id: string;
        full_name: string;
    };
    submission_count?: number;
    total_students?: number;
    submission_rate?: number;
}

export interface ClassAssignmentSubmissionWithDetails extends ClassAssignmentSubmission {
    student?: {
        id: string;
        full_name: string;
        email: string;
        school_number?: string;
    };
    assignment?: ClassAssignmentWithDetails;
    graded_by_profile?: {
        id: string;
        full_name: string;
    };
}

export interface QuizSubmissionWithDetails extends QuizSubmission {
    student?: {
        id: string;
        full_name: string;
        email: string;
    };
    class_quiz?: ClassQuizWithDetails;
    quiz_submission_answers?: QuizSubmissionAnswer[];
}

// ============================================
// UTILITY TYPES
// ============================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRate {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    percentage: number;
    color: 'green' | 'yellow' | 'orange' | 'red';
}

export interface SubmissionStats {
    submitted: number;
    pending: number;
    graded: number;
    total: number;
    submission_rate: number;
    average_score?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export const calculateAttendanceRate = (
    present: number,
    total: number
): AttendanceRate['color'] => {
    if (total === 0) return 'red';
    const percentage = (present / total) * 100;

    if (percentage === 100) return 'green';
    if (percentage >= 75) return 'yellow';
    if (percentage >= 50) return 'orange';
    return 'red';
};

export const getAttendanceRateColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
};

export const formatAttendanceRate = (present: number, total: number): string => {
    return `${present}/${total}`;
};

export const calculateQuizScore = (score: number, totalPoints: number): number => {
    if (totalPoints === 0) return 0;
    return Math.round((score / totalPoints) * 100);
};
