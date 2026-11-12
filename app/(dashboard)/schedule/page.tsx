
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock3,
    Plus,
    Search,
    Filter,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    Radio,
    CheckCircle2,
    CalendarClock,
    Layers3,
    ChevronDown,
    AlertCircle,
    MapPin,
    Calendar,
    Activity,
} from "lucide-react";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type ProgramStatus = "upcoming" | "live" | "completed";

interface Program {
    id: string;
    title: string;
    category: string;
    venue: string;
    stage_name: string;
    location: string;
    event_date: string;
    time: string;
    startMinutes: number;
    endMinutes: number;
    status: ProgramStatus;
}

interface Stage {
    id?: string | number;
    name: string;
    location: string;
    events: Program[];
}

interface ProgramForm {
    title: string;
    category: string;
    stage_name: string;
    event_date: string;
    start_time: string;
    end_time: string;
    status: ProgramStatus;
}

// --------------------------------------------------
// CONFIG
// --------------------------------------------------

const API_URL = "https://slateblue-wasp-644886.hostingersite.com/api/schedule";

const EMPTY_FORM: ProgramForm = {
    title: "",
    category: "",
    stage_name: "",
    event_date: "2026-11-20",
    start_time: "09:00",
    end_time: "10:00",
    status: "upcoming",
};

const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10";

const statusStyles: Record<ProgramStatus, string> = {
    live: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    upcoming: "bg-amber-50 text-amber-700 ring-amber-600/20",
    completed: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Something went wrong.";
}

function formatDate(date: string) {
    if (!date) return "-";

    const [year, month, day] = date.slice(0, 10).split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDay(date: string) {
    if (!date) return "";

    const [year, month, day] = date.slice(0, 10).split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "short",
    });
}

// Convert "8:45 AM" into minutes after midnight.
function timeToMinutes(time: string): number {
    if (!time) return 0;

    const value = time.trim().toUpperCase();

    const match = value.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
    );

    if (!match) return 0;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3];

    if (period) {
        if (hours === 12) hours = 0;
        if (period === "PM") hours += 12;
    }

    return hours * 60 + minutes;
}

// Convert minutes into "8:45 AM".
function minutesToDisplayTime(total: number): string {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Convert "8:45 AM - 9:30 AM" into 24-hour inputs.
function displayTimeToInputs(time: string) {
    const parts = time.split(/\s*-\s*/);

    if (parts.length !== 2) {
        return {
            start_time: "09:00",
            end_time: "10:00",
        };
    }

    const convert = (value: string) => {
        const minutes = timeToMinutes(value);

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    };

    return {
        start_time: convert(parts[0]),
        end_time: convert(parts[1]),
    };
}

function formatTimeRange(start: number, end: number) {
    return `${minutesToDisplayTime(start)} - ${minutesToDisplayTime(end)}`;
}

// Convert 24-hour input to display format.
function getTimeMinutes(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

// --------------------------------------------------
// API HELPERS
// --------------------------------------------------

async function apiRequest(
    url: string,
    options: RequestInit = {}
) {
    const response = await fetch(url, {
        ...options,
        // credentials: "same-origin",
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
        cache: "no-store",
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            `Request failed (${response.status})`
        );
    }

    return result;
}

// Flatten grouped API response into individual programs.
function normalizePrograms(response: any): Program[] {
    const stages: Stage[] = response?.data ?? [];

    if (!Array.isArray(stages)) return [];

    return stages.flatMap((stage: any) => {
        const events = Array.isArray(stage.events)
            ? stage.events
            : [];

        return events.map((event: any) => {
            const start = Number(
                event.startMinutes ??
                timeToMinutes(event.time?.split(" - ")[0] || "")
            );

            const end = Number(
                event.endMinutes ??
                timeToMinutes(event.time?.split(" - ")[1] || "")
            );

            return {
                id: String(event.id),
                title: event.title ?? "",
                category: event.category ?? "",
                venue: event.venue ?? stage.name ?? "",
                stage_name: stage.name ?? "",
                location: stage.location ?? "",
                event_date: String(event.date ?? "").slice(0, 10),
                time: event.time || formatTimeRange(start, end),
                startMinutes: start,
                endMinutes: end,
                status: (
                    ["upcoming", "live", "completed"].includes(
                        String(event.status).toLowerCase()
                    )
                        ? String(event.status).toLowerCase()
                        : "upcoming"
                ) as ProgramStatus,
            };
        });
    });
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function ScheduleAdminPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [stageFilter, setStageFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProgramForm>(EMPTY_FORM);
    const [formError, setFormError] = useState("");

    // Actions
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);

    // --------------------------------------------------
    // FETCH
    // --------------------------------------------------

    const fetchPrograms = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await apiRequest(API_URL);

            if (!result.success) {
                throw new Error(result.message || "Unable to load schedule.");
            }

            const stageData = Array.isArray(result.data)
                ? result.data
                : [];

            setStages(stageData);
            setPrograms(normalizePrograms(result));
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    // --------------------------------------------------
    // STATISTICS
    // --------------------------------------------------

    const stats = useMemo(() => ({
        total: programs.length,
        live: programs.filter(p => p.status === "live").length,
        upcoming: programs.filter(p => p.status === "upcoming").length,
        completed: programs.filter(p => p.status === "completed").length,
    }), [programs]);

    const categories = useMemo(
        () => [...new Set(
            programs.map(p => p.category).filter(Boolean)
        )].sort(),
        [programs]
    );

    const stageNames = useMemo(
        () => stages.map(stage => stage.name).filter(Boolean),
        [stages]
    );

    // --------------------------------------------------
    // FILTERING
    // --------------------------------------------------

    const filteredPrograms = useMemo(() => {
        return programs
            .filter(program => {
                const query = search.trim().toLowerCase();

                const searchable = [
                    program.title,
                    program.category,
                    program.venue,
                    program.stage_name,
                    program.location,
                ];

                const matchesSearch = searchable.some(value =>
                    value.toLowerCase().includes(query)
                );

                const matchesStatus =
                    statusFilter === "all" ||
                    program.status === statusFilter;

                const matchesStage =
                    stageFilter === "all" ||
                    program.stage_name === stageFilter;

                const matchesCategory =
                    categoryFilter === "all" ||
                    program.category === categoryFilter;

                const matchesDate =
                    !dateFilter ||
                    program.event_date === dateFilter;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesStage &&
                    matchesCategory &&
                    matchesDate
                );
            })
            .sort((a, b) =>
                a.event_date.localeCompare(b.event_date) ||
                a.startMinutes - b.startMinutes
            );
    }, [
        programs,
        search,
        statusFilter,
        stageFilter,
        categoryFilter,
        dateFilter,
    ]);

    // --------------------------------------------------
    // FORM HELPERS
    // --------------------------------------------------

    const updateForm = (
        key: keyof ProgramForm,
        value: string
    ) => {
        setForm(previous => ({
            ...previous,
            [key]: value,
        }));
    };

    const openCreateModal = () => {
        setEditingId(null);

        setForm({
            ...EMPTY_FORM,
            event_date: programs[0]?.event_date || EMPTY_FORM.event_date,
            stage_name: stages[0]?.name || "",
        });

        setFormError("");
        setModalOpen(true);
    };

    const openEditModal = (program: Program) => {
        const times = displayTimeToInputs(program.time);

        setEditingId(program.id);

        setForm({
            title: program.title,
            category: program.category,
            stage_name: program.stage_name,
            event_date: program.event_date,
            start_time: times.start_time,
            end_time: times.end_time,
            status: program.status,
        });

        setFormError("");
        setModalOpen(true);
    };

    // --------------------------------------------------
    // CONFLICT DETECTION
    // --------------------------------------------------

    const checkConflict = () => {
        const start = getTimeMinutes(form.start_time);
        const end = getTimeMinutes(form.end_time);

        if (start >= end) {
            return "End time must be later than start time.";
        }

        const conflict = programs.find(program => {
            if (program.id === editingId) return false;

            if (
                program.event_date !== form.event_date ||
                program.stage_name !== form.stage_name
            ) {
                return false;
            }

            return (
                start < program.endMinutes &&
                end > program.startMinutes
            );
        });

        if (conflict) {
            return `Time conflict with "${conflict.title}" on ${conflict.stage_name} (${conflict.time}).`;
        }

        return "";
    };

    // --------------------------------------------------
    // SERIALIZE FORM
    // --------------------------------------------------

    const getPayload = () => {
        const startMinutes = getTimeMinutes(form.start_time);
        const endMinutes = getTimeMinutes(form.end_time);

        return {
            title: form.title.trim(),
            category: form.category.trim(),
            stage_name: form.stage_name,
            venue: form.stage_name,
            date: form.event_date,
            time: formatTimeRange(startMinutes, endMinutes),
            startMinutes,
            endMinutes,
            status: form.status,
        };
    };

    // --------------------------------------------------
    // CREATE / UPDATE
    // --------------------------------------------------

    const saveProgram = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setFormError("");
        setError("");
        setSuccess("");

        if (
            !form.title.trim() ||
            !form.category.trim() ||
            !form.stage_name ||
            !form.event_date
        ) {
            setFormError("Please fill in all required fields.");
            return;
        }

        const conflict = checkConflict();

        if (conflict) {
            setFormError(conflict);
            return;
        }

        setSaving(true);

        try {
            const payload = getPayload();

            const url = editingId
                ? `${API_URL}/${encodeURIComponent(editingId)}`
                : API_URL;

            await apiRequest(url, {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });

            setModalOpen(false);

            setSuccess(
                editingId
                    ? "Program updated successfully."
                    : "Program created successfully."
            );

            await fetchPrograms();
        } catch (err) {
            setFormError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // UPDATE STATUS
    // --------------------------------------------------

    const updateStatus = async (
        id: string,
        status: ProgramStatus
    ) => {
        setActionId(id);
        setError("");
        setSuccess("");

        try {
            await apiRequest(
                `${API_URL}/${encodeURIComponent(id)}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status }),
                }
            );

            setPrograms(previous =>
                previous.map(program =>
                    program.id === id
                        ? { ...program, status }
                        : program
                )
            );

            setSuccess(`Status updated to ${status}.`);
        } catch (err) {
            setError(getErrorMessage(err));
            await fetchPrograms();
        } finally {
            setActionId(null);
        }
    };

    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    const deleteProgram = async () => {
        if (deleteId === null) return;

        setActionId(deleteId);

        try {
            await apiRequest(
                `${API_URL}/${encodeURIComponent(deleteId)}`,
                { method: "DELETE" }
            );

            setPrograms(previous =>
                previous.filter(p => p.id !== deleteId)
            );

            setDeleteId(null);
            setSuccess("Program deleted successfully.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setActionId(null);
        }
    };

    // --------------------------------------------------
    // CLEAR FILTERS
    // --------------------------------------------------

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setStageFilter("all");
        setCategoryFilter("all");
        setDateFilter("");
    };

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <div className="min-h-screen bg-[#F7F9FA] px-4 py-6 sm:px-6 lg:px-8">

            <div className="mx-auto max-w-[1500px] space-y-6">

                {/* HEADER */}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-teal-700">
                            <CalendarDays size={14} />
                            Rendezvous Administration
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                            Schedule Management
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage programs, stages, timings and live status.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">

                        <button
                            onClick={fetchPrograms}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        <button
                            onClick={openCreateModal}
                            disabled={stages.length === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#087E78] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066A65] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={17} />
                            Add Program
                        </button>

                    </div>
                </div>

                {/* ALERTS */}

                {error && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span className="flex items-center gap-2">
                            <AlertCircle size={17} />
                            {error}
                        </span>

                        <button onClick={() => setError("")}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 size={17} />
                            {success}
                        </span>

                        <button onClick={() => setSuccess("")}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* STATISTICS */}

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                    {[
                        {
                            label: "Total Programs",
                            value: stats.total,
                            icon: Layers3,
                            color: "bg-blue-50 text-blue-700",
                        },
                        {
                            label: "Live Now",
                            value: stats.live,
                            icon: Radio,
                            color: "bg-emerald-50 text-emerald-700",
                        },
                        {
                            label: "Upcoming",
                            value: stats.upcoming,
                            icon: CalendarClock,
                            color: "bg-amber-50 text-amber-700",
                        },
                        {
                            label: "Completed",
                            value: stats.completed,
                            icon: CheckCircle2,
                            color: "bg-gray-100 text-gray-600",
                        },
                    ].map(item => (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
                        >
                            <div className="flex items-center justify-between">

                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                                    <item.icon size={19} />
                                </div>

                                <span className="text-xs font-medium text-gray-400">
                                    Rendezvous
                                </span>

                            </div>

                            <div className="mt-4">

                                <div className="text-3xl font-bold tracking-tight text-gray-950">
                                    {item.value}
                                </div>

                                <div className="mt-1 text-sm text-gray-500">
                                    {item.label}
                                </div>

                            </div>
                        </div>
                    ))}

                </div>

                {/* STAGE SUMMARY */}

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-gray-900">
                                Stage Overview
                            </h2>
                            <p className="mt-1 text-xs text-gray-500">
                                Program distribution across venues.
                            </p>
                        </div>

                        <MapPin size={18} className="text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">

                        {stages.map(stage => {
                            const count = programs.filter(
                                p => p.stage_name === stage.name
                            ).length;

                            return (
                                <button
                                    key={stage.name}
                                    onClick={() =>
                                        setStageFilter(
                                            stageFilter === stage.name
                                                ? "all"
                                                : stage.name
                                        )
                                    }
                                    className={`rounded-xl border p-3 text-left transition ${stageFilter === stage.name
                                        ? "border-teal-500 bg-teal-50"
                                        : "border-gray-100 bg-gray-50 hover:border-gray-300"
                                        }`}
                                >
                                    <div className="text-xs font-semibold text-gray-500">
                                        {stage.name}
                                    </div>

                                    <div className="mt-2 text-xl font-bold text-gray-950">
                                        {count}
                                    </div>

                                    <div className="text-[10px] text-gray-400">
                                        Programs
                                    </div>
                                </button>
                            );
                        })}

                    </div>
                </div>

                {/* FILTERS */}

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

                    <div className="mb-4 flex items-center justify-between">

                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                            <Filter size={17} />
                            Filters & Search
                        </div>

                        <button
                            onClick={clearFilters}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                        >
                            Clear all
                        </button>

                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">

                        <div className="relative">

                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search programs..."
                                className={`${inputClass} pl-9`}
                            />

                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className={inputClass}
                        >
                            <option value="all">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="live">Live</option>
                            <option value="completed">Completed</option>
                        </select>

                        <select
                            value={stageFilter}
                            onChange={e => setStageFilter(e.target.value)}
                            className={inputClass}
                        >
                            <option value="all">All Stages</option>

                            {stageNames.map(stage => (
                                <option key={stage} value={stage}>
                                    {stage}
                                </option>
                            ))}
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className={inputClass}
                        >
                            <option value="all">All Categories</option>

                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className={inputClass}
                        />

                    </div>
                </div>

                {/* PROGRAM TABLE */}

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    <div className="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">

                        <div>
                            <h2 className="font-bold text-gray-900">
                                All Programs
                            </h2>

                            <p className="mt-0.5 text-xs text-gray-500">
                                Showing {filteredPrograms.length} of {programs.length} programs
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin size={14} />
                            {stages.length} Available Stages
                        </div>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[950px] text-left">

                            <thead>
                                <tr className="bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="px-5 py-4">Program</th>
                                    <th className="px-4 py-4">Category</th>
                                    <th className="px-4 py-4">Stage</th>
                                    <th className="px-4 py-4">Date</th>
                                    <th className="px-4 py-4">Timing</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-20 text-center text-sm text-gray-500"
                                        >
                                            <RefreshCw
                                                size={22}
                                                className="mx-auto mb-3 animate-spin text-teal-600"
                                            />
                                            Loading schedule...
                                        </td>
                                    </tr>
                                ) : filteredPrograms.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-20 text-center"
                                        >
                                            <CalendarDays
                                                size={30}
                                                className="mx-auto mb-3 text-gray-300"
                                            />

                                            <p className="font-semibold text-gray-700">
                                                No programs found
                                            </p>

                                            <p className="mt-1 text-sm text-gray-400">
                                                Try changing your filters.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPrograms.map(program => (
                                        <tr
                                            key={`${program.stage_name}-${program.id}`}
                                            className="group transition hover:bg-gray-50/80"
                                        >

                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {program.title}
                                                </div>

                                                <div className="mt-1 text-[11px] text-gray-400">
                                                    ID: #{program.id}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                                                    {program.category}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-gray-800">
                                                    {program.stage_name}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-400">
                                                    {program.location}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-gray-800">
                                                    {formatDate(program.event_date)}
                                                </div>

                                                <div className="mt-0.5 text-xs text-gray-400">
                                                    {formatDay(program.event_date)}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5 text-sm font-medium tabular-nums text-gray-700">
                                                    <Clock3 size={14} className="text-gray-400" />
                                                    {program.time}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="relative inline-flex">

                                                    <select
                                                        value={program.status}
                                                        disabled={actionId === program.id}
                                                        onChange={e =>
                                                            updateStatus(
                                                                program.id,
                                                                e.target.value as ProgramStatus
                                                            )
                                                        }
                                                        className={`cursor-pointer appearance-none rounded-full py-1.5 pl-3 pr-7 text-[11px] font-bold capitalize ring-1 ring-inset outline-none disabled:opacity-50 ${statusStyles[program.status]}`}
                                                    >
                                                        <option value="upcoming">
                                                            Upcoming
                                                        </option>

                                                        <option value="live">
                                                            Live
                                                        </option>

                                                        <option value="completed">
                                                            Completed
                                                        </option>
                                                    </select>

                                                    <ChevronDown
                                                        size={12}
                                                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                                                    />

                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1.5">

                                                    <button
                                                        onClick={() => openEditModal(program)}
                                                        title="Edit program"
                                                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>

                                                    <button
                                                        onClick={() => setDeleteId(program.id)}
                                                        title="Delete program"
                                                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                )}

                            </tbody>

                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">

                        <span className="text-xs text-gray-400">
                            Schedule Management · Rendezvous
                        </span>

                        <span className="text-xs font-medium text-gray-500">
                            {filteredPrograms.length} Results
                        </span>

                    </div>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}

            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-3 backdrop-blur-[3px] sm:p-6"
                    onMouseDown={e => {
                        if (
                            e.target === e.currentTarget &&
                            !saving
                        ) {
                            setModalOpen(false);
                        }
                    }}
                >

                    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">

                            <div>
                                <h2 className="text-lg font-bold text-gray-950">
                                    {editingId ? "Edit Program" : "Create Program"}
                                </h2>

                                <p className="mt-0.5 text-xs text-gray-500">
                                    Configure program schedule details.
                                </p>
                            </div>

                            <button
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                                className="rounded-xl bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
                            >
                                <X size={18} />
                            </button>

                        </div>

                        <form
                            onSubmit={saveProgram}
                            className="space-y-5 p-5 sm:p-6"
                        >

                            {formError && (
                                <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle
                                        size={17}
                                        className="mt-0.5 shrink-0"
                                    />
                                    {formError}
                                </div>
                            )}

                            {/* NAME */}

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Program Name *
                                </label>

                                <input
                                    required
                                    value={form.title}
                                    onChange={e =>
                                        updateForm("title", e.target.value)
                                    }
                                    placeholder="e.g. Tartheel"
                                    className={inputClass}
                                />
                            </div>

                            {/* CATEGORY AND STAGE */}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Category *
                                    </label>

                                    <input
                                        required
                                        list="schedule-categories"
                                        value={form.category}
                                        onChange={e =>
                                            updateForm("category", e.target.value)
                                        }
                                        placeholder="e.g. Junior"
                                        className={inputClass}
                                    />

                                    <datalist id="schedule-categories">
                                        {categories.map(category => (
                                            <option
                                                key={category}
                                                value={category}
                                            />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Stage *
                                    </label>

                                    <select
                                        required
                                        value={form.stage_name}
                                        onChange={e =>
                                            updateForm("stage_name", e.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="">
                                            Select Stage
                                        </option>

                                        {stages.map(stage => (
                                            <option
                                                key={stage.name}
                                                value={stage.name}
                                            >
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            {/* DATE */}

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Event Date *
                                </label>

                                <input
                                    required
                                    type="date"
                                    value={form.event_date}
                                    onChange={e =>
                                        updateForm("event_date", e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>

                            {/* TIME */}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        Start Time *
                                    </label>

                                    <input
                                        required
                                        type="time"
                                        value={form.start_time}
                                        onChange={e =>
                                            updateForm("start_time", e.target.value)
                                        }
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        End Time *
                                    </label>

                                    <input
                                        required
                                        type="time"
                                        value={form.end_time}
                                        onChange={e =>
                                            updateForm("end_time", e.target.value)
                                        }
                                        className={inputClass}
                                    />
                                </div>

                            </div>

                            {/* STATUS */}

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                    Program Status
                                </label>

                                <select
                                    value={form.status}
                                    onChange={e =>
                                        updateForm(
                                            "status",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="live">Live</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            {/* BUTTONS */}

                            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={saving}
                                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087E78] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066A65] disabled:opacity-60"
                                >
                                    {saving && (
                                        <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                        />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save Changes"
                                            : "Create Program"
                                    }
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION */}

            {deleteId !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <Trash2 size={21} />
                        </div>

                        <h3 className="mt-4 text-center text-lg font-bold text-gray-950">
                            Delete this program?
                        </h3>

                        <p className="mt-2 text-center text-sm leading-6 text-gray-500">
                            This action will permanently delete this schedule entry.
                            This cannot be undone.
                        </p>

                        <div className="mt-6 flex gap-3">

                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={actionId === deleteId}
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={deleteProgram}
                                disabled={actionId === deleteId}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {actionId === deleteId
                                    ? "Deleting..."
                                    : "Delete"
                                }
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
