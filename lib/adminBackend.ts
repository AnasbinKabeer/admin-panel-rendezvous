
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function adminBackendRequest(
    endpoint: string,
    body: Record<string, unknown>
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Admin session expired. Please log in again.",
                },
                { status: 401 }
            );
        }

        if (!BACKEND_API_URL) {
            throw new Error("BACKEND_API_URL is not configured");
        }

        const response = await fetch(
            `${BACKEND_API_URL}${endpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
                cache: "no-store",
            }
        );

        const data = await response.json().catch(() => ({
            success: false,
            message: "Invalid response from backend",
        }));

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("Admin backend proxy error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to connect to backend",
            },
            { status: 500 }
        );
    }
}
