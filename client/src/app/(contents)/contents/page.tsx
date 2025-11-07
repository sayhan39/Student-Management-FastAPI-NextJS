"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/auth-context";
import { useContent } from "@/app/contexts/content-context";
import { ContentMetadata } from "../content";
import { catchError } from "@/app/routes/route_utils";

const ContentList = () => {
    const { contents, setContents, setSelectedContent } = useContent();
    const { role, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchContents = async () => {
            try {
                setLoading(true);
                const response = await fetch('/routes/get-content-list', {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Failed to fetch contents");
                }
                const data: ContentMetadata[] = await response.json();
                setContents(data);
            } catch (error: unknown) {
                catchError(error, "Error fetching contents: ", "Unknown error while fetching contents");
            } finally {
                setLoading(false);
            }
        };

        fetchContents();
    }, [setContents]);

    const handleCreateClick = () => {
        setSelectedContent(null);
        router.push('/content-form-view');
    };

    const handleContentClick = (content_id: number, content_file_type: string | null) => {
        if (content_file_type === 'text/plain') {
            router.push(`/contents/${content_id}`);
        }
    };

    const handleEdit = (content: ContentMetadata) => {
        setSelectedContent(content);
        router.push(`/content-form-view`);
    };

    const handleDownload = async (content: ContentMetadata) => {
        try {
            const response = await fetch(`http://127.0.0.1:3000/routes/download-content/${content.id}`);
            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = content.title || 'download'; 
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Download error:', err);
        }
    };

    if (authLoading || loading) {
        return <p className="p-4 text-center">Loading...</p>;
    }

    if (error) {
        return <p className="p-4 text-center text-destructive">Error: {error}</p>;
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-center items-center mb-4">
                {role === "A" && (
                    <button
                        onClick={handleCreateClick}
                        className="py-2 px-4 bg-primary hover:bg-primary/90 rounded-lg shadow-md text-textprimary font-bold focus:outline-none focus:ring-1 focus:ring-primary transition duration-150 ease-in-out"
                    >
                        + Create Content
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                {contents.map((content) => (
                    <div
                        key={content.id}
                        className="flex justify-between items-center p-4 bg-background rounded-lg shadow-md"
                    >
                        <div 
                            onClick={() => handleContentClick(content.id, content.file_type)}
                            className={`flex flex-col ${content.file_type === 'text/plain' ? 'cursor-pointer hover:bg-background/80' : 'cursor-default'} transition duration-150 ease-in-out p-1 rounded`}
                        >
                            <h2 className="text-lg font-bold text-textprimary truncate">{content.title}</h2>
                            <p className="text-sm text-textsecondary">
                                Type: {content.file_type}
                            </p>
                            <p className="text-sm text-textsecondary">
                                By: {content.author || 'Unknown'}
                            </p>
                            <p className="text-xs text-textsecondary mt-2">
                                Created: {content.created_at ? new Date(content.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            {content.file_type !== 'text/plain' && (
                                <button
                                    onClick={() => handleDownload(content)}
                                    className="py-1 px-3 bg-green-600 hover:bg-green-700 rounded-md shadow-sm text-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-green-500"
                                >
                                    Download
                                </button>
                            )}

                            {role === "A" && (
                                <button
                                    onClick={() => handleEdit(content)}
                                    className="py-1 px-3 bg-yellow-500 hover:bg-yellow-600 rounded-md shadow-sm text-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContentList;