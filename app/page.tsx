import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
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
    } catch {
        return (
            <DashboardClient
                dashboardData={null}
                error="Cannot connect to the backend API."
            />
        );
    }
}