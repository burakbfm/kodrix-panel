"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addQuestion(formData: FormData) {
    const supabase = await createClient();
    const quizId = formData.get("quiz_id") as string;
    const questionText = formData.get("question_text") as string;
    const questionImage = formData.get("question_image") as string;
    const questionType = formData.get("question_type") as string || "multiple_choice";
    const points = parseInt(formData.get("points") as string) || 1;
    const answersJSON = formData.get("answers") as string;

    if (!quizId || !questionText) {
        return { error: "Soru metni zorunludur." };
    }

    // Get max order
    const { data: questions } = await supabase
        .from("quiz_questions")
        .select("order_index")
        .eq("quiz_id", quizId);

    const maxOrder = questions && questions.length > 0
        ? Math.max(...questions.map(q => q.order_index || 0))
        : 0;

    // Create question
    const { data: newQuestion, error: questionError } = await supabase
        .from("quiz_questions")
        .insert({
            quiz_id: quizId,
            question_text: questionText,
            image_url: questionImage || null,
            question_type: questionType,
            points: points,
            order_index: maxOrder + 1,
        })
        .select()
        .single();

    if (questionError) {
        console.error("Soru ekleme hatası:", questionError);
        return { error: "Soru eklenirken bir hata oluştu." };
    }

    // Create answers
    if (answersJSON) {
        try {
            const answers = JSON.parse(answersJSON);
            const answersData = answers.map((ans: any, index: number) => ({
                question_id: newQuestion.id,
                answer_text: ans.text,
                image_url: ans.image || null,
                is_correct: ans.isCorrect,
                order_index: index + 1,
            }));

            if (answersData.length > 0) {
                const { error: answersError } = await supabase
                    .from("quiz_answers")
                    .insert(answersData);

                if (answersError) {
                    console.error("Cevap ekleme hatası:", answersError);
                    // Optional: Delete question if answers failed? 
                    // For now just return error but keep question
                    return { error: "Soru eklendi fakat cevaplar kaydedilemedi." };
                }
            }
        } catch (e) {
            console.error("Answer parsing error:", e);
            return { error: "Cevap formatı hatalı." };
        }
    }

    revalidatePath(`/admin/quizzes/${quizId}`);
    return { success: true };
}

export async function updateQuiz(formData: FormData) {
    const supabase = await createClient();
    const id = formData.get("id") as string;

    const updates = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        time_limit_minutes: parseInt(formData.get("time_limit_minutes") as string) || null,
        passing_score: parseInt(formData.get("passing_score") as string) || 70,
        difficulty: formData.get("difficulty") as string,
        show_correct_answers: formData.get("show_correct_answers") === "true",
        shuffle_questions: formData.get("shuffle_questions") === "true",
        shuffle_answers: formData.get("shuffle_answers") === "true",
    };

    const { error } = await supabase
        .from("quizzes")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("Quiz güncelleme hatası:", error);
        return { error: "Güncelleme başarısız." };
    }

    revalidatePath(`/admin/quizzes/${id}`);
    return { success: true };
}

export async function deleteQuestion(formData: FormData) {
    const supabase = await createClient();
    const questionId = formData.get("question_id") as string;
    const quizId = formData.get("quiz_id") as string;

    // Delete answers first (though cascade might handle it, explicit is safer if no cascade)
    await supabase.from("quiz_answers").delete().eq("question_id", questionId);

    const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", questionId);

    if (error) {
        console.error("Soru silme hatası:", error);
        return { error: "Silme işlemi başarısız." };
    }

    revalidatePath(`/admin/quizzes/${quizId}`);
    return { success: true };
}

export async function approveQuiz(formData: FormData) {
    const supabase = await createClient();
    const quizId = formData.get("quiz_id") as string;

    const { error } = await supabase
        .from("quizzes")
        .update({ status: 'published' })
        .eq("id", quizId);

    if (error) {
        console.error("Quiz onaylama hatası:", error);
        return { error: "Onaylama işlemi başarısız." };
    }

    revalidatePath("/admin/quizzes");
    return { success: true };
}
