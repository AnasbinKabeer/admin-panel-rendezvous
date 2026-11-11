import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_API_URL;

        if (!backendUrl) {
            throw new Error("BACKEND_API_URL is missing");
        }

        const response = await fetch(`${backendUrl}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success || !result.token) {
            return NextResponse.json(
                {
                    success: false,
                    message: result.message || "Login failed",
                },
                { status: response.status || 401 }
            );
        }

        const res = NextResponse.json({
            success: true,
            message: "Login successful",
            admin: result.admin,
        });

        res.cookies.set("admin_token", result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 8 * 60 * 60,
        });

        return res;
    } catch (error) {
        console.error("Admin login API:", error);

        return NextResponse.json(
            { success: false, message: "Unable to connect to the backend" },
            { status: 500 }
        );
    }
}