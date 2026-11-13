import { NextRequest } from "next/server";
import { adminBackendRequest } from "@/lib/adminBackend";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.qrToken) {
            return Response.json(
                {
                    success: false,
                    message: "QR token is required",
                },
                { status: 400 }
            );
        }

        return adminBackendRequest(
            "/glocal/merchant/preview",
            { qrToken: body.qrToken }
        );
    } catch {
        return Response.json(
            {
                success: false,
                message: "Invalid request",
            },
            { status: 400 }
        );
    }
}