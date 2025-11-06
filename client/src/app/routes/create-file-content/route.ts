import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { catchError } from "../route_utils";

// This route handles POST requests for new file content (multipart/form-data)
const POST = async(request: NextRequest) => {
    const sessionTokenCookie = (await cookies()).get("session_token");
    const token = sessionTokenCookie?.value;

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // Get the FormData from the request
    const formData = await request.formData();

    try {
        // Proxy the request to the FastAPI backend's create file endpoint
        const response = await fetch(`http://127.0.0.1:8000/contents/file`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                // 'Content-Type' is set automatically by 'fetch' for FormData
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ detail: data.detail || "Failed to create file content" }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        return catchError(error, 
            "An internal server error occured. Reason: ", 
            "An internal server error occured. Reason unknown."
        );
    }
}

export { POST }