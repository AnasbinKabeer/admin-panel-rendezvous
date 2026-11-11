import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LiveManagementClient from "./LiveManagementClient";

export default async function LivePage() {
    // const cookieStore = await cookies();
    // const token = cookieStore.get("admin_token")?.value;

    // if (!token) {
    //     redirect("/login");
    // }

    return <LiveManagementClient />;
}