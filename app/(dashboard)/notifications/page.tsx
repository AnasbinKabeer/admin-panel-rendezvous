"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    Send,
    Users,
    Smartphone,
    History,
    Megaphone,
    Radio,
    Trophy,
    CalendarDays,
    Loader2,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";

type AudienceType =
    | "everyone"
    | "campus"
    | "category"
    | "program"
    | "individual";

type NotificationType =
    | "announcement"
    | "event"
    | "points"
    | "live";

interface Campaign {
    id: number;
    title: string;
    body: string;
    type: string;
    audience_type: string;
    audience_value: string | null;
    image_url: string | null;
    total_recipients: number;
    registered_devices: number;
    expo_accepted: number;
    expo_rejected: number;
    status: string;
    created_at: string;
}
interface AudienceOptions {
    campuses: string[];
    categories: string[];
    programs: { id: number; name: string }[];
}

interface Participant {
    id: number;
    jamiaNo: string;
    name: string;
    campus: string | null;
    category: string | null;
}

export default function NotificationsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tab, setTab] = useState<"compose" | "history">("compose");

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [type, setType] = useState<NotificationType>("announcement");
    const [audienceType, setAudienceType] =
        useState<AudienceType>("everyone");
    const [audienceValue, setAudienceValue] = useState("");
    const [route, setRoute] = useState("");

    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [options, setOptions] = useState<AudienceOptions>({
        campuses: [],
        categories: [],
        programs: [],
    });

    const [audienceCount, setAudienceCount] = useState<number | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [participantSearch, setParticipantSearch] = useState("");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedParticipant, setSelectedParticipant] =
        useState<Participant | null>(null);

    useEffect(() => {
        async function loadOptions() {
            try {
                const response = await fetch(
                    "/api/admin/notifications/options"
                );

                const json = await response.json();

                if (!response.ok || !json.success) {
                    throw new Error(json.message || "Failed to load options");
                }

                setOptions(json.data);
            } catch (error) {
                setError(
                    error instanceof Error ? error.message : "Failed to load options"
                );
            }
        }

        loadOptions();
    }, []);

    useEffect(() => {
        if (audienceType !== "individual" || participantSearch.trim().length < 2) {
            setParticipants([]);
            return;
        }

        let active = true;

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/api/admin/notifications/participants?q=${encodeURIComponent(participantSearch)}`
                );

                const json = await response.json();

                if (active && response.ok && json.success) {
                    setParticipants(json.data);
                }
            } catch (error) {
                console.error("Participant search:", error);
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [participantSearch, audienceType]);


    async function previewAudience() {
        setAudienceCount(null);

        if (audienceType === "individual" && !selectedParticipant) return;

        if (
            audienceType !== "everyone" &&
            audienceType !== "individual" &&
            !audienceValue
        ) {
            return;
        }

        setPreviewLoading(true);

        try {
            const value =
                audienceType === "individual"
                    ? selectedParticipant?.id
                    : audienceValue;

            const response = await fetch("/api/admin/notifications/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    audienceType,
                    audienceValue: value,
                }),
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.message || "Preview failed");
            }

            setAudienceCount(json.data.recipientCount);
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Preview failed"
            );
        } finally {
            setPreviewLoading(false);
        }
    }

    async function loadCampaigns() {
        setHistoryLoading(true);

        try {
            const response = await fetch("/api/admin/notifications", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.message || "Failed to load history");
            }

            setCampaigns(json.data || []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load campaigns"
            );
        } finally {
            setHistoryLoading(false);
        }
    }

    useEffect(() => {
        loadCampaigns();
    }, []);

    async function handleSend() {
        if (!title.trim() || !body.trim()) {
            setError("Enter a notification title and message.");
            return;
        }

        if (
            audienceType === "individual" && !selectedParticipant
        ) {
            setError("Please select a participant.");
            return;
        }

        if (
            audienceType !== "everyone" &&
            audienceType !== "individual" &&
            !audienceValue.trim()
        ) {
            setError("Please select an audience.");
            return;
        }


        const audienceLabel =
            audienceType === "everyone"
                ? "all participants"
                : audienceType === "individual"
                    ? selectedParticipant?.name
                    : `${audienceType}: ${audienceValue}`;


        if (
            !window.confirm(
                `Send this notification to ${audienceLabel}?`
            )
        ) {
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    body: body.trim(),
                    type,
                    audienceType,
                    audienceValue:
                        audienceType === "everyone"
                            ? null
                            : audienceType === "individual"
                                ? String(selectedParticipant!.id)
                                : audienceValue,

                    // Image notification
                    image: imageUrl.trim() || null,

                    data: route.trim()
                        ? { route: route.trim() }
                        : {},
                }),
            });

            const json = await response.json();



            if (!response.ok || !json.success) {
                throw new Error(json.message || "Notification sending failed");
            }

            setResult(json.campaign);
            setTitle("");
            setBody("");
            setRoute("");
            setImageUrl("");
            setAudienceValue("");
            setSelectedParticipant(null);
            setParticipantSearch("");
            setAudienceCount(null);

            await loadCampaigns();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    }

    const typeOptions = [
        { value: "announcement", label: "Announcement", icon: Megaphone },
        { value: "event", label: "Event", icon: CalendarDays },
        { value: "points", label: "Points", icon: Trophy },
        { value: "live", label: "Live", icon: Radio },
    ] as const;

    const audienceOptions = [
        { value: "everyone", label: "Everyone" },
        { value: "campus", label: "Campus" },
        { value: "category", label: "Category" },
        { value: "program", label: "Program" },
        { value: "individual", label: "Individual participant" },
    ];

    function formatDate(date: string) {
        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    }

    return (


        <main className="mx-auto max-w-[1450px] space-y-6 p-5 md:p-8">
            <div>
                <p className="text-xs font-medium text-[#087e68]">
                    COMMUNICATION
                </p>

                <h1 className="mt-2 text-2xl font-semibold text-gray-900">
                    Notifications
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Send push notifications and manage participant communication.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#e8eeeb]">
                <button
                    onClick={() => setTab("compose")}
                    className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-xs font-medium ${tab === "compose"
                        ? "border-[#087e68] text-[#087e68]"
                        : "border-transparent text-gray-500"
                        }`}
                >
                    <Send size={15} />
                    Compose
                </button>

                <button
                    onClick={() => setTab("history")}
                    className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-xs font-medium ${tab === "history"
                        ? "border-[#087e68] text-[#087e68]"
                        : "border-transparent text-gray-500"
                        }`}
                >
                    <History size={15} />
                    Campaign history
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Compose */}
            {tab === "compose" && (
                <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-5 rounded-xl border border-[#e8eeeb] bg-white p-5 md:p-6">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Compose notification
                            </h2>
                            <p className="mt-1 text-xs text-gray-400">
                                Create a message for your participants.
                            </p>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Notification title
                            </label>

                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={100}
                                placeholder="Example: Main Stage is Live!"
                                className="h-11 w-full rounded-lg border border-[#e5ebe8] px-3 text-sm outline-none focus:border-[#087e68]"
                            />

                            <p className="mt-1 text-right text-[10px] text-gray-400">
                                {title.length}/100
                            </p>
                        </div>

                        {/* Body */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Message
                            </label>

                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                maxLength={300}
                                rows={4}
                                placeholder="Write your notification message..."
                                className="w-full resize-none rounded-lg border border-[#e5ebe8] p-3 text-sm outline-none focus:border-[#087e68]"
                            />

                            <p className="mt-1 text-right text-[10px] text-gray-400">
                                {body.length}/300
                            </p>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="mb-3 block text-xs font-medium text-gray-700">
                                Notification type
                            </label>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {typeOptions.map((option) => {
                                    const Icon = option.icon;
                                    const selected = type === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => setType(option.value)}
                                            className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs transition ${selected
                                                ? "border-[#087e68] bg-[#edf7f3] text-[#087e68]"
                                                : "border-[#e8eeeb] text-gray-500 hover:bg-gray-50"
                                                }`}
                                        >
                                            <Icon size={15} />
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Notification Image URL
                            </label>

                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://yourdomain.com/image.jpg"
                                className="w-full rounded-xl border px-4 py-3"
                            />

                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt="Notification preview"
                                    className="mt-3 h-40 w-full rounded-xl object-cover"
                                />
                            )}
                        </div>

                        {/* Audience */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Target audience
                            </label>

                            <select
                                value={audienceType}
                                onChange={(e) => {
                                    setAudienceType(e.target.value as AudienceType);
                                    setAudienceValue("");
                                    setSelectedParticipant(null);
                                    setParticipantSearch("");
                                    setParticipants([]);
                                    setAudienceCount(null);
                                }}
                                className="h-11 w-full rounded-lg border border-[#e5ebe8] bg-white px-3 text-sm outline-none focus:border-[#087e68]"
                            >
                                <option value="everyone">Everyone</option>
                                <option value="campus">Specific campus</option>
                                <option value="category">Specific category</option>
                                <option value="program">Specific program</option>
                                <option value="individual">Individual participant</option>
                            </select>

                            {audienceType === "campus" && (
                                <select
                                    value={audienceValue}
                                    onChange={(e) => {
                                        setAudienceValue(e.target.value);
                                        setAudienceCount(null);
                                    }}
                                    className="mt-3 h-11 w-full rounded-lg border border-[#e5ebe8] bg-white px-3 text-sm"
                                >
                                    <option value="">Select campus</option>
                                    {options.campuses.map((campus) => (
                                        <option key={campus} value={campus}>
                                            {campus}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {audienceType === "category" && (
                                <select
                                    value={audienceValue}
                                    onChange={(e) => {
                                        setAudienceValue(e.target.value);
                                        setAudienceCount(null);
                                    }}
                                    className="mt-3 h-11 w-full rounded-lg border border-[#e5ebe8] bg-white px-3 text-sm"
                                >
                                    <option value="">Select category</option>
                                    {options.categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {audienceType === "program" && (
                                <select
                                    value={audienceValue}
                                    onChange={(e) => {
                                        setAudienceValue(e.target.value);
                                        setAudienceCount(null);
                                    }}
                                    className="mt-3 h-11 w-full rounded-lg border border-[#e5ebe8] bg-white px-3 text-sm"
                                >
                                    <option value="">Select program</option>
                                    {options.programs.map((program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {audienceType === "individual" && (
                                <div className="mt-3 space-y-2">
                                    <input
                                        value={participantSearch}
                                        onChange={(e) => {
                                            setParticipantSearch(e.target.value);
                                            setSelectedParticipant(null);
                                            setAudienceCount(null);
                                        }}
                                        placeholder="Search by participant name or Jamia No..."
                                        className="h-11 w-full rounded-lg border border-[#e5ebe8] px-3 text-sm outline-none focus:border-[#087e68]"
                                    />

                                    {participants.length > 0 && !selectedParticipant && (
                                        <div className="max-h-48 overflow-y-auto rounded-lg border border-[#e8eeeb] bg-white">
                                            {participants.map((participant) => (
                                                <button
                                                    type="button"
                                                    key={participant.id}
                                                    onClick={() => {
                                                        setSelectedParticipant(participant);
                                                        setParticipantSearch(
                                                            `${participant.name} · ${participant.jamiaNo}`
                                                        );
                                                        setParticipants([]);
                                                        setAudienceCount(null);
                                                    }}
                                                    className="block w-full border-b border-[#edf1ef] px-3 py-3 text-left last:border-0 hover:bg-gray-50"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">
                                                        {participant.name}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-gray-400">
                                                        {participant.jamiaNo} · {participant.campus || "No campus"}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {selectedParticipant && (
                                        <div className="rounded-lg border border-[#b7dacf] bg-[#f5faf7] p-3">
                                            <p className="text-xs font-semibold text-[#087e68]">
                                                {selectedParticipant.name}
                                            </p>
                                            <p className="mt-1 text-[10px] text-gray-500">
                                                {selectedParticipant.jamiaNo} · {selectedParticipant.campus}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedParticipant(null);
                                                    setParticipantSearch("");
                                                    setAudienceCount(null);
                                                }}
                                                className="mt-2 text-[10px] text-red-500"
                                            >
                                                Remove participant
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={previewAudience}
                                disabled={
                                    previewLoading ||
                                    (audienceType !== "everyone" &&
                                        (audienceType === "individual"
                                            ? !selectedParticipant
                                            : !audienceValue))
                                }
                                className="mt-3 flex h-9 items-center gap-2 rounded-lg border border-[#087e68] px-3 text-xs font-medium text-[#087e68] hover:bg-[#f5faf7] disabled:opacity-40"
                            >
                                {previewLoading && <Loader2 size={14} className="animate-spin" />}
                                Preview recipients
                            </button>

                            {audienceCount !== null && (
                                <div className="mt-3 rounded-lg border border-[#b7dacf] bg-[#f5faf7] p-3">
                                    <p className="text-sm font-semibold text-[#087e68]">
                                        {audienceCount.toLocaleString()} participants
                                    </p>
                                    <p className="mt-1 text-[10px] text-gray-500">
                                        Matching your selected audience.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Route */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                App destination (optional)
                            </label>

                            <input
                                value={route}
                                onChange={(e) => setRoute(e.target.value)}
                                placeholder="/live"
                                className="h-11 w-full rounded-lg border border-[#e5ebe8] px-3 text-sm outline-none focus:border-[#087e68]"
                            />

                            <p className="mt-1 text-[10px] text-gray-400">
                                The route your mobile app should open when the notification is tapped.
                            </p>
                        </div>

                        <div className="border-t border-[#edf1ef] pt-5">
                            <button
                                onClick={handleSend}
                                disabled={loading}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#087e68] text-sm font-semibold text-white transition hover:bg-[#066b59] disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={17} className="animate-spin" />
                                        Processing notification...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Save and send notification
                                    </>
                                )}
                            </button>

                            <p className="mt-3 text-center text-[10px] text-gray-400">
                                Saves recipient history before submitting push notifications.
                            </p>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-5">
                        <div className="rounded-xl border border-[#e8eeeb] bg-white p-5">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Push preview
                                    </h2>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Example Android notification
                                    </p>
                                </div>

                                <Smartphone size={18} className="text-gray-400" />
                            </div>

                            <div className="rounded-2xl bg-[#e9eeeb] p-4">
                                <div className="mx-auto max-w-[330px] rounded-2xl bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#087e68] text-xs font-bold text-white">
                                            R
                                        </div>

                                        <span className="text-[11px] font-semibold text-gray-700">
                                            Rendezvous
                                        </span>

                                        <span className="ml-auto text-[9px] text-gray-400">
                                            now
                                        </span>
                                    </div>

                                    <div className="mt-3">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {title || "Notification title"}
                                        </p>

                                        <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-600">
                                            {body || "Your notification message will appear here."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
                                <Bell size={14} />
                                Push notification preview
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#e8eeeb] bg-white p-5">
                            <h2 className="text-sm font-semibold">
                                Campaign summary
                            </h2>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Audience
                                    </span>
                                    <span className="text-xs font-medium capitalize">
                                        {audienceType}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Notification type
                                    </span>
                                    <span className="text-xs font-medium capitalize">
                                        {type}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Destination
                                    </span>
                                    <span className="text-xs font-medium">
                                        {route || "None"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {result && (
                            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                                <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                                    <CheckCircle2 size={18} />
                                    Campaign created
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    {[
                                        ["Recipients", result.recipients],
                                        ["Devices", result.registeredDevices],
                                        ["Expo accepted", result.expoAccepted],
                                        ["Expo rejected", result.expoRejected],
                                    ].map(([label, value]) => (
                                        <div key={String(label)}>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {value}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-3 text-[10px] text-green-800">
                                    Campaign ID: {result.id} · Status: {result.status}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* History */}
            {tab === "history" && (
                <div className="overflow-hidden rounded-xl border border-[#e8eeeb] bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eeeb] p-5">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Campaign history
                            </h2>
                            <p className="mt-1 text-[11px] text-gray-400">
                                Previous notification campaigns
                            </p>
                        </div>

                        <button
                            onClick={loadCampaigns}
                            disabled={historyLoading}
                            className="flex items-center gap-2 rounded-lg border border-[#e8eeeb] px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
                        >
                            <RefreshCw
                                size={14}
                                className={historyLoading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>

                    {historyLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="animate-spin text-[#087e68]" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="py-16 text-center">
                            <History
                                size={28}
                                className="mx-auto text-gray-300"
                            />
                            <p className="mt-3 text-sm font-medium text-gray-600">
                                No campaigns yet
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                Your sent campaigns will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400">
                                    <tr>
                                        <th className="px-5 py-3">Campaign</th>
                                        <th className="px-5 py-3">Audience</th>
                                        <th className="px-5 py-3">Recipients</th>
                                        <th className="px-5 py-3">Devices</th>
                                        <th className="px-5 py-3">Accepted</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Date</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#edf1ef]">
                                    {campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="text-xs">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {campaign.image_url && (
                                                        <img
                                                            src={campaign.image_url}
                                                            alt=""
                                                            className="h-11 w-14 shrink-0 rounded-md object-cover"
                                                        />
                                                    )}

                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-800">
                                                            {campaign.title}
                                                        </p>

                                                        <p className="mt-1 max-w-[230px] truncate text-[10px] text-gray-400">
                                                            {campaign.body}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 capitalize text-gray-500">
                                                {campaign.audience_type}
                                                {campaign.audience_value
                                                    ? ` · ${campaign.audience_value}`
                                                    : ""}
                                            </td>

                                            <td className="px-5 py-4 tabular-nums">
                                                {campaign.total_recipients}
                                            </td>

                                            <td className="px-5 py-4 tabular-nums">
                                                {campaign.registered_devices}
                                            </td>

                                            <td className="px-5 py-4 tabular-nums text-green-700">
                                                {campaign.expo_accepted}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-md px-2 py-1 text-[10px] capitalize ${campaign.status === "sent"
                                                        ? "bg-green-50 text-green-700"
                                                        : campaign.status === "partial"
                                                            ? "bg-yellow-50 text-yellow-700"
                                                            : campaign.status === "failed"
                                                                ? "bg-red-50 text-red-700"
                                                                : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {campaign.status}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-gray-400">
                                                {formatDate(campaign.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </main>

    );
}