import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

type Context = {
    params: Promise<{ path: string[] }>;
};

async function proxyRequest(
    request: NextRequest,
    context: Context
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Admin authentication required",
                },
                { status: 401 }
            );
        }

        const { path } = await context.params;

        if (!path?.length) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid API path",
                },
                { status: 400 }
            );
        }

        const backendUrl = process.env.BACKEND_API_URL;

        if (!backendUrl) {
            throw new Error("BACKEND_API_URL is not configured");
        }

        const cleanBaseUrl = backendUrl.replace(/\/+$/, "");

        const safePath = path.map(segment =>
            encodeURIComponent(segment)
        ).join("/");

        const url = `${cleanBaseUrl}/admin/live/${safePath}${request.nextUrl.search}`;

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
        };

        const contentType = request.headers.get("content-type");

        if (contentType) {
            headers["Content-Type"] = contentType;
        }

        const options: RequestInit = {
            method: request.method,
            headers,
            cache: "no-store",
        };

        if (!["GET", "HEAD"].includes(request.method)) {
            options.body = await request.text();
        }

        const response = await fetch(url, options);

        const responseText = await response.text();

        return new NextResponse(responseText, {
            status: response.status,
            headers: {
                "Content-Type":
                    response.headers.get("content-type") ||
                    "application/json",
                "Cache-Control": "no-store",
            },
        });

    } catch (error) {
        console.error("Live API proxy error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to connect to Rendezvous backend",
            },
            { status: 500 }
        );
    }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;