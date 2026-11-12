
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

async function handler(request: NextRequest) {
    try {
        if (!BACKEND_URL) {
            throw new Error("BACKEND_API_URL is not configured");
        }

        const response = await fetch(
            `${BACKEND_URL}/api/schedule`,
            {
                method: request.method,
                headers: {
                    "Content-Type": "application/json",
                    ...(request.headers.get("authorization")
                        ? {
                            Authorization: request.headers.get("authorization")!,
                        }
                        : {}),
                },
                body: ["GET", "HEAD"].includes(request.method)
                    ? undefined
                    : await request.text(),
                cache: "no-store",
            }
        );

        const data = await response.text();

        return new NextResponse(data, {
            status: response.status,
            headers: {
                "Content-Type":
                    response.headers.get("content-type") ||
                    "application/json",
            },
        });
    } catch (error) {
        console.error("Schedule proxy:", error);

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Backend connection failed",
            },
            { status: 502 }
        );
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
