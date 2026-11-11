import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const token = (await cookies()).get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const q = request.nextUrl.searchParams.get("q") || "";

        const response = await fetch(
            `${process.env.BACKEND_API_URL}/admin/notifications/participants?q=${encodeURIComponent(q)}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        const result = await response.json();

        return NextResponse.json(result, { status: response.status });
    } catch {
        return NextResponse.json(
            { success: false, message: "Participant search failed" },
            { status: 500 }
        );
    }
}