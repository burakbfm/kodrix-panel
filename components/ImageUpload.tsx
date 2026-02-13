"use client";

import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string | null) => void;
    bucket?: string;
    path: string;
    label?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export default function ImageUpload({
    value,
    onChange,
    bucket = "quiz-files",
    path,
    label = "Resim Ekle",
    className = "",
    size = "md",
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
            const filePath = `${path}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Resim yüklenirken bir hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        onChange(null);
        // Optional: Delete from storage if needed, but often better to keep or clean up later
    };

    const sizeClasses = {
        sm: "w-24 h-24",
        md: "w-full h-48",
        lg: "w-full h-64",
    };

    if (value) {
        return (
            <div className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${size === "sm" ? "w-24 h-24 flex-shrink-0" : "w-full h-48"}`}>
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={handleRemove}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm"
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="relative w-full h-full">
                    <Image
                        src={value}
                        alt="Uploaded content"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            <label className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${sizeClasses[size]}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    {size !== "sm" && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {uploading ? "Yükleniyor..." : label}
                        </p>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}
