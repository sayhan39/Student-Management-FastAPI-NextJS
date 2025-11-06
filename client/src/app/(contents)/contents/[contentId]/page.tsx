"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/auth-context';
import { TextContent } from '../../content';
import { catchError } from '@/app/routes/route_utils';
import { useContent } from '@/app/contexts/content-context';
import Link from 'next/link';

const ContentDetailView = () => {
    const { contentId } = useParams();
    const { role, loading: authLoading } = useAuth();
    const { setSelectedContent } = useContent();
    const router = useRouter();
    
    const [content, setContent] = useState<TextContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        if (!contentId) return;

        const fetchContent = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/routes/get-text-content/${contentId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to fetch content');
                }
                const data: TextContent = await response.json();
                setContent(data);
            } catch (error: unknown) {
                catchError(error, "Error fetching content: ", "Unknown error fetching content");
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [contentId]);

    const handleEditClick = () => {
        if (!content) return;
        setSelectedContent(content);
        router.push('/content-form-view');
    };

    if (authLoading || loading) {
        return <p className="p-4 text-center">Loading...</p>;
    }

    if (error) {
        return <p className="p-4 text-center text-destructive">Error: {error}</p>;
    }

    if (!content) {
        return <p className="p-4 text-center">Content not found.</p>;
    }

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <Link href="/contents" className="py-2 px-4 bg-surface hover:bg-surface/80 rounded-lg shadow-md text-textprimary font-bold">
                    &larr; Back to List
                </Link>
                {role === 'A' && (
                    <button
                        onClick={handleEditClick}
                        className="py-2 px-4 bg-primary hover:bg-primary/90 rounded-lg shadow-md text-textprimary font-bold"
                    >
                        Edit
                    </button>
                )}
            </div>

            <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
            <p className="text-sm text-textsecondary mb-4">
                By {content.author || 'Unknown'} on {content.created_at ? new Date(content.created_at).toLocaleDateString() : 'N/A'}
            </p>

            <div className="p-4 bg-surface rounded-md min-h-[300px]">
                <p style={{ whiteSpace: 'pre-wrap' }}>{content.text_content}</p>
            </div>
        </div>
    );
};

export default ContentDetailView;