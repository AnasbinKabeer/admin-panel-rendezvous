"use client";

import { Menu, Search, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface AdminHeaderProps {
    onMenuClick: () => void;
}

export default function AdminHeader(

    {
        onMenuClick,
    }: AdminHeaderProps) {

    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/auth/logout", {
            method: "POST",
        });

        router.replace("/login");
        router.refresh();
    }
    return (
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e8eeeb] bg-white/95 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="text-gray-500 lg:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={21} />
                </button>

                <div>
                    <p className="text-sm font-semibold text-gray-800">
                        Management Console
                    </p>
                    <p className="hidden text-[11px] text-gray-400 sm:block">
                        Rendezvous / 2026
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    aria-label="Search"
                    className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 sm:flex"
                >
                    <Search size={18} />
                </button>

                <button
                    aria-label="Notifications"
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <Bell size={18} />
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                </button>

                <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="flex h-9 items-center gap-2 rounded-lg border border-[#e8eeeb] px-3 text-xs text-gray-600 transition hover:bg-gray-50"
                >
                    <LogOut size={15} />
                    <span className="hidden sm:inline">Sign out</span>
                </button>
            </div>
        </header>
    );
}
