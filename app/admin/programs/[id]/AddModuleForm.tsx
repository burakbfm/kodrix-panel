"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addModule } from "./actions";
// @ts-ignore
import NProgress from "nprogress";

interface AddModuleFormProps {
    programId: string;
}

export default function AddModuleForm({ programId }: AddModuleFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            NProgress.start();
            await addModule(formData);
            // On success, the Server Action revalidates the path. 
            // The loading bar should complete.
            NProgress.done();
            // Reset form? The form element is not easily accessible here unless we use useRef.
            // But since this is a server action, the page content updates.
            // We can just reload the page or let revalidate handle it.
            // Actually, we should clear the inputs.
            const form = document.querySelector('form[id="add-module-form"]') as HTMLFormElement;
            if (form) form.reset();
        } catch (error) {
            console.error(error);
            alert("Modül eklenirken hata oluştu.");
            NProgress.done();
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            id="add-module-form"
            action={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8 shadow-sm"
        >
            <input type="hidden" name="program_id" value={programId} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-kodrix-purple dark:text-amber-500" />
                Yeni Modül Ekle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                    type="text"
                    name="module_title"
                    required
                    placeholder="Modül Başlığı"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none disabled:opacity-50"
                />
                <input
                    type="text"
                    name="module_description"
                    placeholder="Modül Açıklaması (İsteğe bağlı)"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-kodrix-purple/20 focus:border-kodrix-purple dark:focus:ring-amber-500 transition outline-none disabled:opacity-50"
                />
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition font-semibold disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    {isSubmitting ? "Ekleniyor..." : "Modül Ekle"}
                </button>
            </div>
        </form>
    );
}
