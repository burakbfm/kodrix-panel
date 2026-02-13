"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const PROGRAM_ICONS = [
    // Programming Languages
    { id: "js", label: "JavaScript", emoji: "🟨", colors: { light: "from-yellow-400 to-yellow-600", dark: "from-yellow-500 to-yellow-700" } },
    { id: "python", label: "Python", emoji: "🐍", colors: { light: "from-blue-400 to-blue-600", dark: "from-blue-500 to-blue-700" } },
    { id: "react", label: "React", emoji: "⚛️", colors: { light: "from-cyan-400 to-cyan-600", dark: "from-cyan-500 to-cyan-700" } },
    { id: "nodejs", label: "Node.js", emoji: "🟩", colors: { light: "from-green-400 to-green-600", dark: "from-green-500 to-green-700" } },
    { id: "html", label: "HTML", emoji: "🌐", colors: { light: "from-orange-400 to-orange-600", dark: "from-orange-500 to-orange-700" } },
    { id: "css", label: "CSS", emoji: "🎨", colors: { light: "from-blue-400 to-purple-500", dark: "from-blue-500 to-purple-600" } },
    { id: "java", label: "Java", emoji: "☕", colors: { light: "from-red-400 to-red-600", dark: "from-red-500 to-red-700" } },
    { id: "csharp", label: "C#", emoji: "💜", colors: { light: "from-purple-400 to-purple-600", dark: "from-purple-500 to-purple-700" } },
    { id: "cpp", label: "C++", emoji: "🔵", colors: { light: "from-blue-500 to-blue-700", dark: "from-blue-600 to-blue-800" } },
    { id: "php", label: "PHP", emoji: "🐘", colors: { light: "from-indigo-400 to-indigo-600", dark: "from-indigo-500 to-indigo-700" } },
    { id: "ruby", label: "Ruby", emoji: "💎", colors: { light: "from-red-400 to-pink-500", dark: "from-red-500 to-pink-600" } },
    { id: "go", label: "Go", emoji: "🐹", colors: { light: "from-cyan-400 to-cyan-600", dark: "from-cyan-500 to-cyan-700" } },
    { id: "rust", label: "Rust", emoji: "🦀", colors: { light: "from-orange-500 to-red-600", dark: "from-orange-600 to-red-700" } },
    { id: "swift", label: "Swift", emoji: "🍎", colors: { light: "from-orange-400 to-red-500", dark: "from-orange-500 to-red-600" } },
    { id: "kotlin", label: "Kotlin", emoji: "🟣", colors: { light: "from-purple-400 to-purple-600", dark: "from-purple-500 to-purple-700" } },

    // Tools & Platforms
    { id: "sql", label: "SQL", emoji: "🗄️", colors: { light: "from-blue-400 to-indigo-500", dark: "from-blue-500 to-indigo-600" } },
    { id: "git", label: "Git", emoji: "🌿", colors: { light: "from-orange-400 to-red-500", dark: "from-orange-500 to-red-600" } },
    { id: "docker", label: "Docker", emoji: "🐳", colors: { light: "from-blue-400 to-blue-600", dark: "from-blue-500 to-blue-700" } },
    { id: "scratch", label: "Scratch", emoji: "🐱", colors: { light: "from-orange-400 to-yellow-500", dark: "from-orange-500 to-yellow-600" } },

    // AI & Technology
    { id: "ai", label: "Yapay Zeka (AI)", emoji: "🤖", colors: { light: "from-purple-400 to-pink-500", dark: "from-purple-500 to-pink-600" } },
    { id: "ml", label: "Machine Learning", emoji: "🧠", colors: { light: "from-indigo-400 to-purple-500", dark: "from-indigo-500 to-purple-600" } },
    { id: "robotics", label: "Robotik", emoji: "🦾", colors: { light: "from-gray-400 to-gray-600", dark: "from-gray-500 to-gray-700" } },

    // Mathematics & Sciences
    { id: "math", label: "Matematik", emoji: "🧮", colors: { light: "from-blue-400 to-cyan-500", dark: "from-blue-500 to-cyan-600" } },
    { id: "physics", label: "Fizik", emoji: "🔭", colors: { light: "from-indigo-400 to-blue-500", dark: "from-indigo-500 to-blue-600" } },
    { id: "chemistry", label: "Kimya", emoji: "🧪", colors: { light: "from-green-400 to-emerald-500", dark: "from-green-500 to-emerald-600" } },
    { id: "biology", label: "Biyoloji", emoji: "🧬", colors: { light: "from-emerald-400 to-green-500", dark: "from-emerald-500 to-green-600" } },
    { id: "science", label: "Fen Bilgisi", emoji: "🔬", colors: { light: "from-teal-400 to-cyan-500", dark: "from-teal-500 to-cyan-600" } },

    // Languages & Literature
    { id: "turkish", label: "Türkçe", emoji: "🇹🇷", colors: { light: "from-red-400 to-red-600", dark: "from-red-500 to-red-700" } },
    { id: "english", label: "İngilizce", emoji: "🇬🇧", colors: { light: "from-blue-400 to-indigo-500", dark: "from-blue-500 to-indigo-600" } },
    { id: "literature", label: "Edebiyat", emoji: "📖", colors: { light: "from-amber-400 to-orange-500", dark: "from-amber-500 to-orange-600" } },

    // Arts & Music
    { id: "art", label: "Görsel Sanatlar", emoji: "🎨", colors: { light: "from-pink-400 to-rose-500", dark: "from-pink-500 to-rose-600" } },
    { id: "music", label: "Müzik", emoji: "🎵", colors: { light: "from-purple-400 to-fuchsia-500", dark: "from-purple-500 to-fuchsia-600" } },
    { id: "drama", label: "Tiyatro & Drama", emoji: "🎭", colors: { light: "from-violet-400 to-purple-500", dark: "from-violet-500 to-purple-600" } },

    // Social Sciences
    { id: "geography", label: "Coğrafya", emoji: "🌍", colors: { light: "from-green-400 to-blue-500", dark: "from-green-500 to-blue-600" } },
    { id: "history", label: "Tarih", emoji: "🏛️", colors: { light: "from-amber-400 to-yellow-500", dark: "from-amber-500 to-yellow-600" } },

    // Physical Education
    { id: "pe", label: "Beden Eğitimi", emoji: "⚽", colors: { light: "from-green-400 to-lime-500", dark: "from-green-500 to-lime-600" } },

    // General
    { id: "general", label: "Genel Eğitim", emoji: "📚", colors: { light: "from-blue-400 to-indigo-500", dark: "from-blue-500 to-indigo-600" } },
    { id: "code", label: "Genel Kodlama", emoji: "💻", colors: { light: "from-kodrix-purple to-purple-600", dark: "from-amber-500 to-amber-600" } },
];

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (iconId: string) => void;
}

export default function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const currentIcon = PROGRAM_ICONS.find(icon => icon.id === selectedIcon) || PROGRAM_ICONS[PROGRAM_ICONS.length - 1];

    return (
        <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Program İkonu
            </label>

            {/* Selected Icon Display */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-kodrix-purple dark:hover:border-amber-500 transition"
            >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentIcon.colors.light} dark:bg-gradient-to-br dark:${currentIcon.colors.dark} flex items-center justify-center text-2xl`}>
                    {currentIcon.emoji}
                </div>
                <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {currentIcon.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        İkon seçmek için tıklayın
                    </p>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Icon Grid Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 mt-2 w-full max-h-96 overflow-y-auto bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {PROGRAM_ICONS.map((icon) => (
                                <button
                                    key={icon.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(icon.id);
                                        setIsOpen(false);
                                    }}
                                    className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition ${selectedIcon === icon.id
                                        ? 'border-kodrix-purple dark:border-amber-500 bg-purple-50 dark:bg-amber-900/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-kodrix-purple dark:hover:border-amber-500'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${icon.colors.light} dark:bg-gradient-to-br dark:${icon.colors.dark} flex items-center justify-center text-xl`}>
                                        {icon.emoji}
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                                        {icon.label}
                                    </span>
                                    {selectedIcon === icon.id && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-kodrix-purple dark:bg-amber-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white dark:text-gray-900" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Export icons for use in other components
export { PROGRAM_ICONS };
