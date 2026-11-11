"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Login failed");
            }

            router.replace("/");
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-5 py-10">
            <div className="w-full max-w-[410px]">
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#087e68] text-xl font-bold text-white">
                        R
                    </div>

                    <h1 className="mt-5 text-xl font-bold tracking-wide text-gray-900">
                        RENDEZVOUS
                    </h1>

                    <p className="mt-1 text-[10px] tracking-[3px] text-gray-400">
                        ADMINISTRATION PORTAL
                    </p>
                </div>

                <div className="rounded-2xl border border-[#e8eeeb] bg-white p-7 shadow-sm sm:p-9">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Sign in to access the management console.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Email address
                            </label>

                            <div className="flex h-11 items-center gap-3 rounded-lg border border-[#e5ebe8] px-3 focus-within:border-[#087e68]">
                                <Mail size={17} className="text-gray-400" />

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@rendezvous.com"
                                    autoComplete="username"
                                    required
                                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Password
                            </label>

                            <div className="flex h-11 items-center gap-3 rounded-lg border border-[#e5ebe8] px-3 focus-within:border-[#087e68]">
                                <LockKeyhole size={17} className="text-gray-400" />

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#087e68] text-sm font-semibold text-white transition hover:bg-[#066b59] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={17} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={17} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-7 border-t border-[#edf1ef] pt-5 text-center">
                        <p className="text-[10px] text-gray-400">
                            Authorized personnel only · Rendezvous 2026
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-center text-[10px] text-gray-400">
                    RENDEZVOUS MANAGEMENT SYSTEM
                </p>
            </div>
        </main>
    );
}