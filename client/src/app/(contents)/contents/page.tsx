"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
                const textContents = data.filter(c => c.file_type === 'text/plain');
                setContents(textContents);
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
                    <Link
                        href={`/contents/${content.id}`}
                        key={content.id}
                        className="block p-4 bg-background rounded-lg shadow-md hover:bg-background/80 transition duration-150 ease-in-out"
                    >
                        <h2 className="text-lg font-bold text-textprimary truncate">{content.title}</h2>
                        <p className="text-sm text-textsecondary">
                            By: {content.author || 'Unknown'}
                        </p>
                        <p className="text-xs text-textsecondary mt-2">
                            Created: {content.created_at ? new Date(content.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ContentList;