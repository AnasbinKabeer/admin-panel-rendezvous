import { NextRequest } from "next/server";
import { adminBackendRequest } from "@/lib/adminBackend";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (
            !body.qrToken ||
            !Number.isInteger(Number(body.amount)) ||
            Number(body.amount) <= 0 ||
            !body.idempotencyKey
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Valid QR token, amount and idempotency key are required",
                },
                { status: 400 }
            );
        }

        return adminBackendRequest(
            "/glocal/merchant/redeem",
            {
                qrToken: body.qrToken,
                amount: Number(body.amount),
                idempotencyKey: body.idempotencyKey,
            }
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