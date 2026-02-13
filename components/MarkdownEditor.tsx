"use client";

import { useState } from "react";
import { Eye, Code, Bold, Italic, Link as LinkIcon, List, Heading1 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
}

export default function MarkdownEditor({
    value,
    onChange,
    placeholder = "Metin giriniz...",
    rows = 4,
    className = "",
}: MarkdownEditorProps) {
    const [view, setView] = useState<"write" | "preview">("write");

    const insertText = (before: string, after: string = "") => {
        const textarea = document.querySelector('textarea:focus') as HTMLTextAreaElement;

        // If textarea is not focused but view is write, try to find it
        const targetTextarea = textarea || document.querySelector(`textarea[placeholder="${placeholder}"]`) as HTMLTextAreaElement;

        if (!targetTextarea) {
            onChange(value + before + "metin" + after);
            return;
        }

        const start = targetTextarea.selectionStart;
        const end = targetTextarea.selectionEnd;
        const text = targetTextarea.value;

        // Handle case where selection might be missing if we just clicked the button without focus
        // We'll append if no focus, or use the last known focus if we could track it (simplifying to append or use current cursor)

        const beforeText = text.substring(0, start);
        const afterText = text.substring(end, text.length);
        const selection = text.substring(start, end) || "metin";

        const newValue = beforeText + before + selection + after + afterText;
        onChange(newValue);

        // Restore focus (timeout needed for react render cycle sometimes)
        setTimeout(() => {
            targetTextarea.focus();
            targetTextarea.setSelectionRange(start + before.length, start + before.length + selection.length);
        }, 0);
    };

    return (
        <div className={`border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setView("write")}
                        className={`p-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition ${view === "write"
                            ? "bg-white dark:bg-gray-700 text-kodrix-purple dark:text-amber-500 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Code className="w-4 h-4" />
                        Yaz
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("preview")}
                        className={`p-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition ${view === "preview"
                            ? "bg-white dark:bg-gray-700 text-kodrix-purple dark:text-amber-500 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        Önizleme
                    </button>
                </div>

                {view === "write" && (
                    <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                        <button
                            type="button"
                            onClick={() => insertText("# ")}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            title="Başlık"
                        >
                            <Heading1 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertText("**", "**")}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            title="Kalın"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertText("*", "*")}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            title="İtalik"
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertText("[", "](url)")}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            title="Link"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertText("- ")}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            title="Liste"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Editor Area */}
            <div className="relative">
                {view === "write" ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none resize-y min-h-[150px] font-mono text-sm"
                    />
                ) : (
                    <div
                        className="w-full px-4 py-3 min-h-[150px] prose dark:prose-invert prose-sm max-w-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                        {value ? (
                            <ReactMarkdown>{value}</ReactMarkdown>
                        ) : (
                            <span className="text-gray-400 italic">Önizleme yok</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
