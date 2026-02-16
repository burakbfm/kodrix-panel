"use client";

import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, FileText, FileSpreadsheet, FileVideo, FileImage, FileCode, File, Presentation } from "lucide-react";
import { useState } from "react";

interface FileAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploaded_at: string;
    uploaded_by?: string;
}

interface FileUploadProps {
    bucket: "program-files" | "lesson-files" | "assignment-files";
    path: string; // e.g., "program-id" or "class-id/lesson-id"
    existingFiles?: FileAttachment[];
    onFilesChange: (files: FileAttachment[]) => void;
    maxSizeMB?: number;
    allowedTypes?: string[];
    maxFiles?: number;
    inputId?: string; // Optional custom ID for the input element to avoid collisions and hydration mismatches
}

export default function FileUpload({
    bucket,
    path,
    existingFiles = [],
    onFilesChange,
    maxSizeMB = 50,
    allowedTypes = ["*"],
    maxFiles = 10,
    inputId,
}: FileUploadProps) {
    const [files, setFiles] = useState<FileAttachment[]>(existingFiles);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const supabase = createClient();

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const getFileIcon = (fileName: string, mimeType: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();

        if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
            return <FileImage className="w-5 h-5 text-purple-500" />;
        }
        if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi'].includes(ext || '')) {
            return <FileVideo className="w-5 h-5 text-red-500" />;
        }
        if (['pdf'].includes(ext || '')) {
            return <FileText className="w-5 h-5 text-red-600" />;
        }
        if (['doc', 'docx'].includes(ext || '')) {
            return <FileText className="w-5 h-5 text-blue-600" />;
        }
        if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
            return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
        }
        if (['ppt', 'pptx'].includes(ext || '')) {
            return <Presentation className="w-5 h-5 text-orange-500" />;
        }
        if (['zip', 'rar', '7z'].includes(ext || '')) {
            return <FileCode className="w-5 h-5 text-gray-600" />; // Using FileCode as generic archive for now or Box
        }
        return <File className="w-5 h-5 text-gray-500" />;
    };

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        if (files.length + fileList.length > maxFiles) {
            alert(`Maksimum ${maxFiles} dosya yükleyebilirsiniz!`);
            return;
        }

        setUploading(true);

        try {
            const uploadPromises = Array.from(fileList).map(async (file) => {
                // Check file size
                if (file.size > maxSizeMB * 1024 * 1024) {
                    throw new Error(`${file.name} çok büyük (max ${maxSizeMB}MB)`);
                }

                // Check file type if restrictions exist
                if (allowedTypes[0] !== "*") {
                    const ext = file.name.split(".").pop()?.toLowerCase();
                    if (!ext || !allowedTypes.includes(ext)) {
                        throw new Error(
                            `${file.name} desteklenmeyen dosya tipi (izin verilenler: ${allowedTypes.join(", ")})`
                        );
                    }
                }

                // Generate unique filename
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(7);
                const fileName = `${timestamp}_${randomStr}_${file.name}`;
                const filePath = `${path}/${fileName}`;

                // Upload to Supabase Storage
                const { data, error } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file, {
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (error) throw error;

                // Get public URL
                const {
                    data: { publicUrl },
                } = supabase.storage.from(bucket).getPublicUrl(filePath);

                // Get current user
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                return {
                    id: crypto.randomUUID(),
                    name: file.name,
                    url: publicUrl,
                    size: file.size,
                    type: file.type,
                    uploaded_at: new Date().toISOString(),
                    uploaded_by: user?.id,
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            const newFiles = [...files, ...uploadedFiles];
            setFiles(newFiles);
            onFilesChange(newFiles);
        } catch (error: any) {
            console.error("Upload error:", error);
            alert(error.message || "Dosya yüklenirken hata oluştu!");
        } finally {
            setUploading(false);
        }
    };

    const removeFile = async (fileToRemove: FileAttachment) => {
        try {
            // Extract path from URL
            const urlParts = fileToRemove.url.split(`/${bucket}/`);
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from(bucket).remove([filePath]);
            }

            const newFiles = files.filter((f) => f.id !== fileToRemove.id);
            setFiles(newFiles);
            onFilesChange(newFiles);
        } catch (error) {
            console.error("Remove error:", error);
            alert("Dosya silinirken hata oluştu!");
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleUpload(e.dataTransfer.files);
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${dragActive
                    ? "border-kodrix-purple dark:border-amber-500 bg-purple-50 dark:bg-amber-900/10"
                    : "border-gray-300 dark:border-gray-700"
                    } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    multiple
                    id={inputId || `file-upload-${path}`}
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                    disabled={uploading}
                    accept={allowedTypes[0] === "*" ? "*" : allowedTypes.map(t => `.${t}`).join(",")}
                />
                <label
                    htmlFor={inputId || `file-upload-${path}`}
                    className="cursor-pointer flex flex-col items-center"
                >
                    {uploading ? (
                        <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                    ) : (
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    )}
                    <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">
                        {uploading ? "Yükleniyor..." : "Dosya Yükle"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sürükle bırak veya tıkla (max {maxSizeMB}MB)
                    </p>
                    {allowedTypes[0] !== "*" && (
                        <p className="text-xs text-gray-400 mt-1">
                            {allowedTypes.join(", ").toUpperCase()}
                        </p>
                    )}
                </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Yüklenen Dosyalar ({files.length})
                    </p>
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getFileIcon(file.name, file.type)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-3 py-1 bg-kodrix-purple dark:bg-amber-500 text-white dark:text-gray-900 rounded-md hover:opacity-80 transition"
                                >
                                    İndir
                                </a>
                                <button
                                    onClick={() => removeFile(file)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
