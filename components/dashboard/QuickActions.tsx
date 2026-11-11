import Link from "next/link";
import {
    Send,
    Users,
    CalendarPlus,
    Trophy,
    ArrowUpRight,
} from "lucide-react";

const actions = [
    {
        title: "Send notification",
        description: "Broadcast updates to participants",
        icon: Send,
        href: "/notifications",
    },
    {
        title: "Manage participants",
        description: "Search and view student details",
        icon: Users,
        href: "/participants",
    },
    {
        title: "Manage programs",
        description: "View and update programs",
        icon: CalendarPlus,
        href: "/programs",
    },
    {
        title: "Publish results",
        description: "Manage winners and results",
        icon: Trophy,
        href: "/results",
    },
];

export default function QuickActions() {
    return (
        <div className="rounded-xl border border-[#e8eeeb] bg-white p-5">
            <h2 className="text-sm font-semibold">Quick actions</h2>
            <p className="mt-1 text-[11px] text-gray-400">
                Frequently used management tools
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {actions.map((action) => {
                    const Icon = action.icon;

                    return (
                        <Link
                            href={action.href}
                            key={action.title}
                            className="group flex items-center gap-3 rounded-lg border border-[#edf1ef] p-3 transition hover:border-[#b7dacf] hover:bg-[#f8fcfa]"
                        >
                            <div className="rounded-lg bg-[#eaf5f1] p-2 text-[#087e68]">
                                <Icon size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold">{action.title}</p>
                                <p className="mt-1 text-[10px] text-gray-400">
                                    {action.description}
                                </p>
                            </div>

                            <ArrowUpRight
                                size={15}
                                className="text-gray-300 transition group-hover:text-[#087e68]"
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}