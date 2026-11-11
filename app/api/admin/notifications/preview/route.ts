import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const token = (await cookies()).get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const payload = await request.json();

        const response = await fetch(
            `${process.env.BACKEND_API_URL}/admin/notifications/preview`,
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

        return NextResponse.json(result, { status: response.status });
    } catch {
        return NextResponse.json(
            { success: false, message: "Audience preview failed" },
            { status: 500 }
        );
    }
}