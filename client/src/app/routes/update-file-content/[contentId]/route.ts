import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { catchError } from "../../route_utils";

// This route handles PUT requests for file content (multipart/form-data)
const PUT = async(request: NextRequest, { params }: { params: Promise<{ contentId: string }> }) => {
    const sessionTokenCookie = (await cookies()).get("session_token");
    const token = sessionTokenCookie?.value;
    const { contentId } = await params;

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    try {
        const response = await fetch(`http://127.0.0.1:8000/contents/file/${contentId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ detail: data.detail || "Failed to update file content" }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        return catchError(error, 
            "An internal server error occured. Reason: ", 
            "An internal server error occured. Reason unknown."
        );
    }
}

export { PUT }