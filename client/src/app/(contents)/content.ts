export interface ContentMetadata {
    id: number;
    title: string | null;
    file_type: string | null;
    author: string | null;
    created_at: string | null;
    created_by: string | null;
    message?: string;
}

export interface TextContent extends ContentMetadata {
    text_content: string;
    class_levels?: string[] | null;
    course_codes?: string[] | null;
}

export interface CourseConstraintGetRequest {
    content_id?: number;
}

export interface ContentConstraint {
    class_levels?: string[] | null;
    course_codes?: string[] | null;
}

export interface AddContentResponse {
    content: ContentMetadata;
    message?: string;
    class_levels?: string[] | null;
    course_codes?: string[] | null;
}