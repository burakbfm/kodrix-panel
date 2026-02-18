import {
    Activity, LogIn, LogOut, BookOpen, AlertTriangle, MessageCircle,
    CreditCard, UserPlus, FileText
} from "lucide-react";

export const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; gradient: string }> = {
    login: { label: "Giriş", icon: LogIn, color: "text-green-500", gradient: "from-green-500 to-emerald-600" },
    logout: { label: "Çıkış", icon: LogOut, color: "text-gray-500", gradient: "from-gray-500 to-gray-600" },
    lesson_start: { label: "Ders Başlat", icon: BookOpen, color: "text-blue-500", gradient: "from-blue-500 to-cyan-600" },
    lesson_complete: { label: "Ders Tamamla", icon: BookOpen, color: "text-indigo-500", gradient: "from-indigo-500 to-blue-600" },
    quiz_attempt: { label: "Quiz Denemesi", icon: FileText, color: "text-purple-500", gradient: "from-purple-500 to-violet-600" },
    error: { label: "Hata", icon: AlertTriangle, color: "text-red-500", gradient: "from-red-500 to-rose-600" },
    chat_create: { label: "Sohbet Oluştur", icon: MessageCircle, color: "text-teal-500", gradient: "from-teal-500 to-emerald-600" },
    enrollment: { label: "Kayıt", icon: UserPlus, color: "text-amber-500", gradient: "from-amber-500 to-orange-500" },
    payment: { label: "Ödeme", icon: CreditCard, color: "text-pink-500", gradient: "from-pink-500 to-rose-600" },
    system: { label: "Sistem", icon: Activity, color: "text-gray-400", gradient: "from-gray-400 to-gray-500" },
};
