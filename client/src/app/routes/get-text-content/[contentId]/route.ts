import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { catchError } from "../../route_utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
    const sessionTokenCookie = (await cookies()).get("session_token");
    const token = sessionTokenCookie?.value;
    const { contentId } = await params;

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/contents/text/${contentId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        console.log("data: " + JSON.stringify(data));

        if (!response.ok) {
            return NextResponse.json({ detail: data.detail || "Failed to fetch content" }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        return catchError(error, 
            "An internal server error occured. Reason: ", 
            "An internal server error occured. Reason unknown."
        );
    }
}