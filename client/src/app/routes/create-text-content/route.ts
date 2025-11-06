import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { catchError } from "../route_utils";

export async function POST(request: NextRequest) {
    const sessionTokenCookie = (await cookies()).get("session_token");
    const token = sessionTokenCookie?.value;

    if (!token) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    try {
        const response = await fetch(`http://127.0.0.1:8000/contents/text`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ detail: data.detail || "Failed to create content" }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        return catchError(error, 
            "An internal server error occured. Reason: ", 
            "An internal server error occured. Reason unknown."
        );
    }
}