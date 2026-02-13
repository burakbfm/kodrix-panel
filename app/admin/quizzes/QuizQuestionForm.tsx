"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Check, Image as ImageIcon, Circle, CheckCircle2, GripVertical } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import MarkdownEditor from "@/components/MarkdownEditor";
import { addQuestion } from "./actions";

interface Answer {
    id: string;
    text: string;
    image: string | null;
    isCorrect: boolean;
}

interface QuizQuestionFormProps {
    quizId: string;
}

export default function QuizQuestionForm({ quizId }: QuizQuestionFormProps) {
    const [questionText, setQuestionText] = useState("");
    const [questionImage, setQuestionImage] = useState<string | null>(null);
    const [points, setPoints] = useState(10);
    const [answers, setAnswers] = useState<Answer[]>([
        { id: "1", text: "", image: null, isCorrect: false },
        { id: "2", text: "", image: null, isCorrect: false },
        { id: "3", text: "", image: null, isCorrect: false },
        { id: "4", text: "", image: null, isCorrect: false },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleAddAnswer = () => {
        setAnswers([
            ...answers,
            { id: Math.random().toString(36).substr(2, 9), text: "", image: null, isCorrect: false },
        ]);
    };

    const handleRemoveAnswer = (id: string) => {
        setAnswers(answers.filter((a) => a.id !== id));
    };

    const handleAnswerChange = (id: string, field: keyof Answer, value: any) => {
        setAnswers(
            answers.map((a) => (a.id === id ? { ...a, [field]: value } : a))
        );
    };

    const toggleCorrectAnswer = (id: string) => {
        // For multiple choice (single correct), unselect others
        // If we want multiple correct answers, remove the map logic
        setAnswers(
            answers.map((a) => ({
                ...a,
                isCorrect: a.id === id ? !a.isCorrect : false, // Force single selection for now
            }))
        );
    };

    const resetForm = () => {
        setQuestionText("");
        setQuestionImage(null);
        setPoints(10);
        setAnswers([
            { id: "1", text: "", image: null, isCorrect: false },
            { id: "2", text: "", image: null, isCorrect: false },
            { id: "3", text: "", image: null, isCorrect: false },
            { id: "4", text: "", image: null, isCorrect: false },
        ]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!questionText.trim()) {
            alert("Lütfen soru metnini giriniz.");
            return;
        }

        const validAnswers = answers.filter(a => a.text.trim() || a.image);
        if (validAnswers.length < 2) {
            alert("En az 2 cevap seçeneği girmelisiniz.");
            return;
        }

        const hasCorrectAnswer = answers.some(a => a.isCorrect);
        if (!hasCorrectAnswer) {
            alert("Lütfen en az bir doğru cevap işaretleyiniz.");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("quiz_id", quizId);
            formData.append("question_text", questionText);
            if (questionImage) formData.append("question_image", questionImage);
            formData.append("points", points.toString());

            // Clean answers for submission
            const answersPayload = answers
                .filter(a => a.text.trim() || a.image)
                .map(({ text, image, isCorrect }) => ({
                    text,
                    image,
                    isCorrect
                }));

            formData.append("answers", JSON.stringify(answersPayload));

            const result = await addQuestion(formData);

            if (result?.error) {
                alert(result.error);
            } else {
                resetForm();
                // Optional toast success
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("Bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-kodrix-purple dark:text-amber-500" />
                Yeni Soru Ekle
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Soru Metni
                        </label>
                        <MarkdownEditor
                            value={questionText}
                            onChange={setQuestionText}
                            placeholder="Sorunuzu buraya yazın..."
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Soru Görseli (İsteğe bağlı)
                        </label>
                        <ImageUpload
                            path={`quiz-images/${quizId}`}
                            value={questionImage}
                            onChange={setQuestionImage}
                            className="w-full"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-32">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Puan
                            </label>
                            <input
                                type="number"
                                value={points}
                                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple dark:focus:ring-amber-500 transition outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 my-6"></div>

                {/* Answers Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Cevap Seçenekleri
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Doğru cevabı işaretlemeyi unutmayın
                        </span>
                    </div>

                    <div className="space-y-3">
                        {answers.map((answer, index) => (
                            <div
                                key={answer.id}
                                className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl border-2 transition-all ${answer.isCorrect
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                                    : "border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                                    }`}
                            >
                                {/* Correct Toggle */}
                                <div className="flex md:flex-col items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleCorrectAnswer(answer.id)}
                                        className={`p-2 rounded-full transition-all ${answer.isCorrect
                                            ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                                            }`}
                                        title={answer.isCorrect ? "Doğru Cevap" : "Doğru Olarak İşaretle"}
                                    >
                                        {answer.isCorrect ? <Check className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>
                                    <span className="text-xs font-bold text-gray-400 md:hidden">Doğru Cevap</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    <input
                                        type="text"
                                        value={answer.text}
                                        onChange={(e) => handleAnswerChange(answer.id, "text", e.target.value)}
                                        placeholder={`${index + 1}. Seçenek metni`}
                                        className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 outline-none focus:ring-2 transition ${answer.isCorrect
                                            ? "border-green-200 dark:border-green-800 focus:ring-green-500"
                                            : "border-gray-200 dark:border-gray-700 focus:ring-kodrix-purple dark:focus:ring-amber-500"
                                            }`}
                                    />

                                    {/* Image Toggle or Preview */}
                                    <div className="flex items-start gap-2">
                                        {!answer.image ? (
                                            <button
                                                type="button"
                                                onClick={() => handleAnswerChange(answer.id, "image", "placeholder")} // Just to show UI, real upload below
                                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-kodrix-purple dark:hover:text-amber-500 transition"
                                            >
                                                {/* Actually hide this button and just render ImageUpload properly */}
                                            </button>
                                        ) : null}

                                        <div className="w-full">
                                            <ImageUpload
                                                path={`quiz-images/${quizId}/answers`}
                                                value={answer.image}
                                                onChange={(url) => handleAnswerChange(answer.id, "image", url)}
                                                label="Resim Ekle"
                                                size="sm"
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Remove Button */}
                                <div className="flex items-start">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAnswer(answer.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition"
                                        title="Seçeneği Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleAddAnswer}
                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:text-kodrix-purple dark:hover:text-amber-500 hover:border-kodrix-purple dark:hover:border-amber-500 hover:bg-purple-50 dark:hover:bg-amber-900/10 transition flex items-center justify-center gap-2 font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Seçenek Ekle
                    </button>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-kodrix-purple to-purple-800 dark:from-amber-500 dark:to-amber-600 text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-amber-500/20 hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>Kaydediliyor...</>
                        ) : (
                            <>
                                <CheckCircle2 className="w-6 h-6" />
                                Soruyu ve Cevapları Kaydet
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
