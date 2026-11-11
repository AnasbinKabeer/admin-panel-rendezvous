"use client"
import type { Metadata } from "next";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import { useState } from "react";

import "../globals.css";
// export const metadata: Metadata = {
//   title: "Rendezvous Admin",
//   description: "Rendezvous 2026 Management Dashboard",
// };

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <html lang="en">
            <body>
                <div className="min-h-screen">
                    <AdminSidebar
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    <div className="min-h-screen lg:pl-[255px]">
                        <AdminHeader
                            onMenuClick={() => setSidebarOpen(true)}
                        />
                        {children}
                    </div>
                </div>


            </body>
        </html>
    );
}