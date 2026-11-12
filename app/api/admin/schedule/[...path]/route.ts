
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL!;

async function proxyRequest(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await context.params;

        const searchParams = request.nextUrl.searchParams.toString();

        const endpoint = `${BACKEND_URL}/api/schedule/${path.join("/")}${searchParams ? `?${searchParams}` : ""
            }`;

        const headers = new Headers();

        headers.set("Content-Type", "application/json");

        // Forward admin authentication cookie if your backend uses it.
        const cookie = request.headers.get("cookie");
        if (cookie) headers.set("Cookie", cookie);

        const authorization = request.headers.get("authorization");
        if (authorization) headers.set("Authorization", authorization);

        const response = await fetch(endpoint, {
            method: request.method,
            headers,
            body: ["GET", "HEAD"].includes(request.method)
                ? undefined
                : await request.text(),
            cache: "no-store",
        });

        const data = await response.text();

        return new NextResponse(data, {
            status: response.status,
            headers: {
                "Content-Type":
                    response.headers.get("content-type") || "application/json",
            },
        });
    } catch (error) {
        console.error("Schedule proxy error:", error);

        return NextResponse.json(
            { success: false, message: "Backend connection failed" },
            { status: 502 }
        );
    }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
