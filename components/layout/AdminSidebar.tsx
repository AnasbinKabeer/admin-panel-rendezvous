"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Bell,
    Users,
    CalendarDays,
    Trophy,
    Radio,
    Smartphone,
    ChartNoAxesCombined,
    Settings,
    ChevronLeft,
    X,
} from "lucide-react";

const navigation = [
    {
        title: "OVERVIEW",
        items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
        ],
    },
    {
        title: "MANAGEMENT",
        items: [
            { name: "Notifications", href: "/notifications", icon: Bell },
            { name: "Schedule", href: "/schedule", icon: Users },
            { name: "Programs", href: "/programs", icon: CalendarDays },
            { name: "Results", href: "/results", icon: Trophy },
        ],
    },
    {
        title: "SYSTEM",
        items: [
            { name: "Live Management", href: "/live", icon: Radio },
            { name: "Devices", href: "/devices", icon: Smartphone },
            { name: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
            { name: "Settings", href: "/settings", icon: Settings },
        ],
    },
];

interface AdminSidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function AdminSidebar({
    open,
    onClose,
}: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {open && (
                <button
                    aria-label="Close sidebar"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[255px] flex-col border-r border-[#e8eeeb] bg-white transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-[76px] items-center justify-between border-b border-[#e8eeeb] px-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087e68] text-sm font-bold text-white">
                            R
                        </div>
                        <div>
                            <h1 className="text-[15px] font-bold tracking-wide">
                                RENDEZVOUS
                            </h1>
                            <p className="text-[10px] tracking-[2px] text-gray-400">
                                ADMIN PANEL
                            </p>
                        </div>
                    </Link>

                    <button
                        onClick={onClose}
                        className="text-gray-400 lg:hidden"
                        aria-label="Close menu"
                    >
                        <X size={19} />
                    </button>
                </div>

                <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-7">
                    {navigation.map((group) => (
                        <div key={group.title}>
                            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[1.5px] text-gray-400">
                                {group.title}
                            </p>

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active =
                                        item.href === "/"
                                            ? pathname === "/"
                                            : pathname === item.href ||
                                            pathname.startsWith(`${item.href}/`);

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${active
                                                ? "bg-[#eaf5f1] text-[#087e68]"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                        >
                                            <Icon size={17} strokeWidth={1.8} />
                                            {item.name}
                                            {item.name === "Notifications" && (
                                                <span className="ml-auto h-2 w-2 rounded-full bg-[#087e68]" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="border-t border-[#e8eeeb] p-4">
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dceee8] text-sm font-semibold text-[#087e68]">
                            A
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">Administrator</p>
                            <p className="text-[10px] text-gray-400">Rendezvous 2026</p>
                        </div>
                        <ChevronLeft size={16} className="ml-auto text-gray-400" />
                    </div>
                </div>
            </aside>
        </>
    );
}
