import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_API_URL;

async function getToken() {
    const cookieStore = await cookies();
    return cookieStore.get("admin_token")?.value;
}

export async function GET() {
    try {
        const token = await getToken();

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const response = await fetch(
            `${backendUrl}/admin/notifications`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        const result = await response.json();

        return NextResponse.json(result, {
            status: response.status,
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Backend connection failed" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await getToken();

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const payload = await request.json();

        const response = await fetch(
            `${backendUrl}/admin/notifications/send`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                cache: "no-store",
            }
        );

        const result = await response.json();

        return NextResponse.json(result, {
            status: response.status,
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Backend connection failed" },
            { status: 500 }
        );
    }
}