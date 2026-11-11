import {
    Bell,
    Radio,
    Trophy,
    CalendarDays,
    Megaphone,
} from "lucide-react";

interface Notification {
    title: string;
    body: string;
    type: string;
    created_at: string;
    recipients: number;
}

export default function RecentNotifications({
    notifications,
}: {
    notifications: Notification[];
}) {
    function getIcon(type: string) {
        switch (type?.toLowerCase()) {
            case "live":
                return Radio;
            case "results":
            case "points":
                return Trophy;
            case "event":
                return CalendarDays;
            case "announcement":
                return Megaphone;
            default:
                return Bell;
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <div className="rounded-xl border border-[#e8eeeb] bg-white">
            <div className="flex items-center justify-between border-b border-[#e8eeeb] px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold">
                        Recent notifications
                    </h2>
                    <p className="mt-1 text-[11px] text-gray-400">
                        Latest notification activity
                    </p>
                </div>

                <a
                    href="/notifications"
                    className="text-xs font-medium text-[#087e68] hover:underline"
                >
                    View all
                </a>
            </div>

            {notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                    <Bell className="mx-auto text-gray-300" size={24} />
                    <p className="mt-3 text-xs font-medium text-gray-600">
                        No notifications yet
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                        Your recent notification activity will appear here.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-[#edf1ef]">
                    {notifications.map((item, index) => {
                        const Icon = getIcon(item.type);

                        return (
                            <div
                                key={`${item.title}-${item.created_at}-${index}`}
                                className="flex items-start gap-3 px-5 py-4"
                            >
                                <div className="rounded-lg bg-gray-50 p-2 text-gray-500">
                                    <Icon size={17} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-semibold">
                                            {item.title}
                                        </p>

                                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[9px] capitalize text-gray-500">
                                            {item.type}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-[11px] text-gray-500">
                                        {item.body}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-400">
                                        <span>{formatDate(item.created_at)}</span>
                                        <span>{item.recipients} recipients</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}