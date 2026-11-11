
"use client";

import {
    useCallback,
    useEffect,
    useState,
    type ElementType,
    type FormEvent,
} from "react";

import {
    Activity,
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Clock,
    Eye,
    EyeOff,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Radio,
    RefreshCw,
    Trash2,
    Video,
    X,

} from "lucide-react";

import { liveApi } from "@/lib/live-api";
import type {
    LiveStage,
    StageFormData,
    StageStatus,
} from "../../types/live";

const EMPTY_FORM: StageFormData = {
    name: "",
    location: "",
    videoId: "",
    status: "OFFLINE",
    startTime: "",
    sortOrder: 0,
    isEnabled: true,
};

const STATUS_STYLES: Record<StageStatus, string> = {
    LIVE: "bg-red-50 text-red-600 border-red-100",
    UPCOMING: "bg-amber-50 text-amber-700 border-amber-100",
    OFFLINE: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusBadge({ status }: { status: StageStatus }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[status]}`}
        >
            {status === "LIVE" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            )}
            {status}
        </span>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    description,
}: {
    title: string;
    value: number;
    icon: ElementType;
    color: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-[#e8eeeb] bg-white p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500">
                        {title}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-gray-900">
                        {value.toString().padStart(2, "0")}
                    </h2>
                </div>

                <div className={`rounded-xl p-3 ${color}`}>
                    <Icon size={21} />
                </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
                {description}
            </p>
        </div>
    );
}

export default function LiveManagementClient() {
    const [stages, setStages] = useState<LiveStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStage, setEditingStage] =
        useState<LiveStage | null>(null);

    const [form, setForm] = useState<StageFormData>(EMPTY_FORM);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadStages = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await liveApi.getStages();

            setStages(
                [...data].sort(
                    (a, b) => a.sortOrder - b.sortOrder
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load stages"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStages();
    }, [loadStages]);

    const liveCount = stages.filter(
        (s) => s.status === "LIVE" && s.isEnabled
    ).length;

    const upcomingCount = stages.filter(
        (s) => s.status === "UPCOMING" && s.isEnabled
    ).length;

    const offlineCount = stages.filter(
        (s) => s.status === "OFFLINE" && s.isEnabled
    ).length;

    function openCreateModal() {
        setEditingStage(null);
        setForm({
            ...EMPTY_FORM,
            sortOrder: stages.length + 1,
        });
        setError("");
        setModalOpen(true);
    }

    function openEditModal(stage: LiveStage) {
        setEditingStage(stage);

        setForm({
            name: stage.name,
            location: stage.location,
            videoId: stage.videoId || "",
            status: stage.status,
            startTime: stage.startTime || "",
            sortOrder: stage.sortOrder,
            isEnabled: stage.isEnabled,
        });

        setError("");
        setModalOpen(true);
    }

    function updateForm(
        field: keyof StageFormData,
        value: string | number | boolean
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleSubmit(
        e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!form.name.trim() || !form.location.trim()) {
            setError("Stage name and location are required.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                ...form,
                name: form.name.trim(),
                location: form.location.trim(),
                videoId: form.videoId.trim(),
                startTime: form.startTime.trim(),
            };

            if (editingStage) {
                await liveApi.updateStage(
                    editingStage.id,
                    payload
                );

                setSuccess("Stage updated successfully.");
            } else {
                await liveApi.createStage(payload);

                setSuccess("New stage created successfully.");
            }

            setModalOpen(false);
            await loadStages();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save stage"
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(
        stage: LiveStage,
        status: StageStatus
    ) {
        try {
            setError("");
            setSuccess("");

            await liveApi.updateStatus(stage.id, status);

            setStages((previous) =>
                previous.map((item) =>
                    item.id === stage.id
                        ? { ...item, status }
                        : item
                )
            );

            setSuccess(`${stage.name} is now ${status}.`);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update status"
            );
        }
    }

    async function handleToggle(stage: LiveStage) {
        try {
            setError("");
            setSuccess("");

            await liveApi.updateStage(stage.id, {
                name: stage.name,
                location: stage.location,
                videoId: stage.videoId || "",
                status: stage.status,
                startTime: stage.startTime || "",
                sortOrder: stage.sortOrder,
                isEnabled: !stage.isEnabled,
            });

            setStages((previous) =>
                previous.map((item) =>
                    item.id === stage.id
                        ? {
                            ...item,
                            isEnabled: !item.isEnabled,
                        }
                        : item
                )
            );

            setSuccess(
                `${stage.name} ${stage.isEnabled ? "disabled" : "enabled"
                } successfully.`
            );

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to change visibility"
            );
        }
    }

    async function handleDelete(stage: LiveStage) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${stage.name}"?`
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");

            await liveApi.deleteStage(stage.id);

            setStages((previous) =>
                previous.filter((item) => item.id !== stage.id)
            );

            setSuccess("Stage deleted successfully.");

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete stage"
            );
        }
    }

    async function moveStage(
        index: number,
        direction: -1 | 1
    ) {
        const target = index + direction;

        if (target < 0 || target >= stages.length) return;

        const reordered = [...stages];

        [reordered[index], reordered[target]] = [
            reordered[target],
            reordered[index],
        ];

        setStages(reordered);

        try {
            setError("");

            await liveApi.reorderStages(reordered);

            setSuccess("Stage order updated.");

        } catch (err) {
            setStages(stages);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to reorder stages"
            );
        }
    }

    return (
        <div className="min-h-screen bg-[#f7faf8] p-5 md:p-8">

            {/* HEADER */}

            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#087e68]">
                        <Radio size={15} />
                        SYSTEM MANAGEMENT
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                        Live Management
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage festival stages and live streaming.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadStages}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 rounded-lg bg-[#087e68] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#066c59]"
                    >
                        <Plus size={17} />
                        Add Stage
                    </button>
                </div>
            </div>

            {/* NOTIFICATIONS */}

            {error && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} />
                    {error}
                    <button
                        onClick={() => setError("")}
                        className="ml-auto"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <Activity size={17} />
                    {success}
                    <button
                        onClick={() => setSuccess("")}
                        className="ml-auto"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* STATISTICS */}

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard
                    title="Total Stages"
                    value={stages.length}
                    icon={Radio}
                    color="bg-[#eaf5f1] text-[#087e68]"
                    description="All registered stages"
                />

                <StatCard
                    title="Currently Live"
                    value={liveCount}
                    icon={Activity}
                    color="bg-red-50 text-red-600"
                    description="Enabled stages streaming now"
                />

                <StatCard
                    title="Upcoming"
                    value={upcomingCount}
                    icon={Clock}
                    color="bg-amber-50 text-amber-600"
                    description="Scheduled stages"
                />

                <StatCard
                    title="Offline"
                    value={offlineCount}
                    icon={Video}
                    color="bg-gray-100 text-gray-600"
                    description="Enabled offline stages"
                />

            </div>

            {/* STAGE SECTION */}

            <div className="overflow-hidden rounded-xl border border-[#e8eeeb] bg-white">

                <div className="flex flex-col justify-between gap-3 border-b border-[#edf1ef] p-5 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="font-bold text-gray-900">
                            Festival Stages
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                            Manage streaming information and visibility.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                        {stages.length} stages
                    </span>
                </div>

                {loading ? (
                    <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-400">
                        <Loader2 className="animate-spin" size={20} />
                        Loading stages...
                    </div>
                ) : stages.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
                        <Radio size={35} className="mb-3 text-gray-300" />

                        <h3 className="font-semibold text-gray-700">
                            No stages available
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                            Create your first streaming stage.
                        </p>

                        <button
                            onClick={openCreateModal}
                            className="mt-4 rounded-lg bg-[#087e68] px-4 py-2 text-sm font-semibold text-white"
                        >
                            Add Stage
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-[#edf1ef]">

                        {stages.map((stage, index) => (
                            <div
                                key={stage.id}
                                className={`p-5 transition hover:bg-gray-50/70 ${!stage.isEnabled ? "opacity-60" : ""
                                    }`}
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                                    {/* STAGE DETAILS */}

                                    <div className="flex min-w-0 flex-1 items-start gap-4">

                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eaf5f1] text-[#087e68]">
                                            <Radio size={22} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-bold text-gray-900">
                                                    {stage.name}
                                                </h3>

                                                <StatusBadge
                                                    status={stage.status}
                                                />

                                                {!stage.isEnabled && (
                                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">
                                                        HIDDEN
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={13} />
                                                    {stage.location}
                                                </span>

                                                <span className="flex items-center gap-1">
                                                    <X size={14} />
                                                    {stage.videoId
                                                        ? "Video configured"
                                                        : "No video configured"}
                                                </span>
                                            </div>

                                            {stage.status === "UPCOMING" &&
                                                stage.startTime && (
                                                    <p className="mt-2 text-xs text-amber-600">
                                                        {stage.startTime}
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    {/* STATUS CONTROL */}

                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={stage.status}
                                            onChange={(e) =>
                                                handleStatusChange(
                                                    stage,
                                                    e.target.value as StageStatus
                                                )
                                            }
                                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-[#087e68]"
                                        >
                                            <option value="LIVE">LIVE</option>
                                            <option value="UPCOMING">UPCOMING</option>
                                            <option value="OFFLINE">OFFLINE</option>
                                        </select>

                                        {/* REORDER */}

                                        <div className="flex items-center rounded-lg border border-gray-200">
                                            <button
                                                title="Move up"
                                                disabled={index === 0}
                                                onClick={() =>
                                                    moveStage(index, -1)
                                                }
                                                className="p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                                            >
                                                <ArrowUp size={15} />
                                            </button>

                                            <button
                                                title="Move down"
                                                disabled={index === stages.length - 1}
                                                onClick={() =>
                                                    moveStage(index, 1)
                                                }
                                                className="border-l border-gray-200 p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                                            >
                                                <ArrowDown size={15} />
                                            </button>
                                        </div>

                                        <button
                                            title={stage.isEnabled ? "Disable stage" : "Enable stage"}
                                            onClick={() => handleToggle(stage)}
                                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100"
                                        >
                                            {stage.isEnabled
                                                ? <Eye size={16} />
                                                : <EyeOff size={16} />}
                                        </button>

                                        <button
                                            title="Edit stage"
                                            onClick={() => openEditModal(stage)}
                                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-[#087e68] hover:text-[#087e68]"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            title="Delete stage"
                                            onClick={() => handleDelete(stage)}
                                            className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-red-200 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}

            {modalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !saving) {
                            setModalOpen(false);
                        }
                    }}
                >
                    <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}

                        <div className="flex items-center justify-between border-b border-gray-100 p-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingStage
                                        ? "Edit Stage"
                                        : "Create New Stage"}
                                </h2>

                                <p className="mt-1 text-xs text-gray-400">
                                    Configure your live streaming stage.
                                </p>
                            </div>

                            <button
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-5"
                        >

                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-700">
                                    Stage Name *
                                </label>

                                <input
                                    required
                                    maxLength={150}
                                    value={form.name}
                                    onChange={(e) =>
                                        updateForm("name", e.target.value)
                                    }
                                    placeholder="e.g. Timbuk (Stage 01)"
                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#087e68]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-700">
                                    Stage Location *
                                </label>

                                <input
                                    required
                                    maxLength={150}
                                    value={form.location}
                                    onChange={(e) =>
                                        updateForm("location", e.target.value)
                                    }
                                    placeholder="e.g. Main Stage"
                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#087e68]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                                    <X size={15} className="text-red-500" />
                                    YouTube Video URL / ID
                                </label>

                                <input
                                    value={form.videoId}
                                    onChange={(e) =>
                                        updateForm("videoId", e.target.value)
                                    }
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#087e68]"
                                />

                                <p className="mt-1.5 text-[11px] text-gray-400">
                                    Enter a YouTube URL or an 11-character video ID.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-gray-700">
                                        Stream Status
                                    </label>

                                    <select
                                        value={form.status}
                                        onChange={(e) =>
                                            updateForm(
                                                "status",
                                                e.target.value as StageStatus
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#087e68]"
                                    >
                                        <option value="LIVE">LIVE</option>
                                        <option value="UPCOMING">UPCOMING</option>
                                        <option value="OFFLINE">OFFLINE</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-gray-700">
                                        Display Order
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value={form.sortOrder}
                                        onChange={(e) =>
                                            updateForm(
                                                "sortOrder",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#087e68]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-700">
                                    Start Time / Display Message
                                </label>

                                <input
                                    value={form.startTime}
                                    onChange={(e) =>
                                        updateForm("startTime", e.target.value)
                                    }
                                    placeholder="e.g. Starting at 10:30 AM"
                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#087e68]"
                                />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <input
                                    type="checkbox"
                                    checked={form.isEnabled}
                                    onChange={(e) =>
                                        updateForm(
                                            "isEnabled",
                                            e.target.checked
                                        )
                                    }
                                    className="h-4 w-4 accent-[#087e68]"
                                />

                                <div>
                                    <p className="text-xs font-semibold text-gray-800">
                                        Enable stage
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                        Make this stage visible in the mobile app.
                                    </p>
                                </div>
                            </label>

                            {/* FOOTER */}

                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-[#087e68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#066c59] disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {editingStage
                                        ? "Save Changes"
                                        : "Create Stage"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
