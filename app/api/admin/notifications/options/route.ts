import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const token = (await cookies()).get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const response = await fetch(
            `${process.env.BACKEND_API_URL}/admin/notifications/options`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        const result = await response.json();

        return NextResponse.json(result, { status: response.status });
    } catch {
        return NextResponse.json(
            { success: false, message: "Failed to load options" },
            { status: 500 }
        );
    }
}