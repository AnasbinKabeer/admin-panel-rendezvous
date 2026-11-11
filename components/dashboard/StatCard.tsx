import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
}

export default function StatCard({
    title,
    value,
    description,
    icon: Icon,
}: StatCardProps) {
    return (
        <div className="rounded-xl border border-[#e8eeeb] bg-white p-5">
            <div className="flex items-start justify-between">
                <p className="text-[13px] font-medium text-gray-500">{title}</p>
                <div className="rounded-lg bg-[#eaf5f1] p-2 text-[#087e68]">
                    <Icon size={18} strokeWidth={1.8} />
                </div>
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">
                {value}
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">{description}</p>
        </div>
    );
}