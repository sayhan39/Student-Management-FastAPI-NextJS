import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { catchError } from "../route_utils";

export async function GET() {
    const sessionTokenCookie = (await cookies()).get("session_token");
    const token = sessionTokenCookie?.value;
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const fastApiUrl = `http://127.0.0.1:8000/get-all-classes`;
        
        const response = await fetch(fastApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch class list');
        }

        const classList = await response.json();
        return NextResponse.json(classList);

    } catch (error) {
        return catchError(error, "Error fetching class list. Reason: ", "Error fetching class list.");
    }
}