
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

async function DashboardContent() {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
        redirect("/login");
    }

    try {
        const response = await fetch(
            `${process.env.BACKEND_API_URL}/admin/dashboard`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            }
        );

        if (response.status === 401 || response.status === 403) {
            redirect("/login");
        }

        if (!response.ok) {
            return (
                <DashboardClient
                    dashboardData={null}
                    error="Unable to load dashboard statistics."
                />
            );
        }

        const result = await response.json();

        return (
            <DashboardClient
                dashboardData={result.data}
                error={null}
            />
        );
    } catch (error) {
        // Preserve Next.js redirect errors
        if (
            error &&
            typeof error === "object" &&
            "digest" in error &&
            typeof error.digest === "string" &&
            error.digest.startsWith("NEXT_REDIRECT")
        ) {
            throw error;
        }

        return (
            <DashboardClient
                dashboardData={null}
                error="Cannot connect to the backend API."
            />
        );
    }
}

function DashboardSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-32 bg-gray-200 rounded-xl"
                    />
                ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
