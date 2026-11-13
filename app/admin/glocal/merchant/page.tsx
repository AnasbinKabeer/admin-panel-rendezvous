
"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Coins,
    Loader2,
    LockKeyhole,
    Minus,
    Plus,
    RefreshCw,
    ScanLine,
    ShieldCheck,
    ShoppingBag,
    UserRound,
    X,
    AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000";

type Student = {
    name: string;
    jamiaNo: string;
    balance: number;
    status?: string;
};

type PreviewData = {
    student: Student;
    balance?: number;
};

type Receipt = {
    studentName: string;
    jamiaNo: string;
    amount: number;
    balanceAfter: number;
    reference?: string;
};

export default function GlocalMerchantPage() {
    const router = useRouter();

    const scannerRef = useRef<any>(null);
    const processingRef = useRef(false);

    const [cameraOpen, setCameraOpen] = useState(false);
    const [scanning, setScanning] = useState(false);

    const [loadingPreview, setLoadingPreview] = useState(false);
    const [redeeming, setRedeeming] = useState(false);

    const [qrToken, setQrToken] = useState("");
    const [student, setStudent] = useState<Student | null>(null);

    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    const [receipt, setReceipt] = useState<Receipt | null>(null);

    // ------------------------------------------------
    // API HELPER
    // ------------------------------------------------

    const apiRequest = async (
        endpoint: string,
        body?: Record<string, unknown>
    ) => {
        const response = await fetch(endpoint, {
            method: body ? "POST" : "GET",
            headers: {
                "Content-Type": "application/json",
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
            cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || "Something went wrong."
            );
        }

        return result.data ?? result;
    };

    // ------------------------------------------------
    // STOP CAMERA
    // ------------------------------------------------

    const stopScanner = useCallback(async () => {
        const scanner = scannerRef.current;

        if (scanner) {
            try {
                if (scanner.isScanning) {
                    await scanner.stop();
                }
                await scanner.clear();
            } catch (err) {
                console.warn("Scanner cleanup:", err);
            }

            scannerRef.current = null;
        }

        setScanning(false);
        setCameraOpen(false);
    }, []);

    // ------------------------------------------------
    // PREVIEW STUDENT
    // ------------------------------------------------

    const previewStudent = async (token: string) => {
        if (!token || processingRef.current) return;

        processingRef.current = true;
        setLoadingPreview(true);
        setError("");
        setStudent(null);
        setReceipt(null);
        setAmount("");
        setQrToken(token);

        try {
            const data = await apiRequest(
                "/api/glocal/merchant/preview",
                { qrToken: token }
            );

            const studentData = data.student ?? data;
            const walletData = data.wallet ?? {};

            const studentName =
                studentData.name ??
                studentData.studentName ??
                "Unknown student";

            const jamiaNo =
                studentData.jamiaNo ??
                studentData.jamia_no ??
                studentData.jamiaNumber ??
                "";

            const balance = Number(
                walletData.balance ??
                data.balance ??
                studentData.balance ??
                0
            );

            if (!jamiaNo) {
                throw new Error(
                    "Student information is incomplete."
                );
            }

            setStudent({
                name: studentName,
                jamiaNo,
                balance,
                status: walletData.status ?? data.status ?? "active",
            });
        } catch (err: any) {
            setQrToken("");
            setError(
                err.message || "Unable to verify this QR code."
            );
        } finally {
            setLoadingPreview(false);
            processingRef.current = false;
        }
    };

    // ------------------------------------------------
    // START CAMERA
    // ------------------------------------------------

    const startScanner = async () => {
        setError("");
        setStudent(null);
        setReceipt(null);
        setQrToken("");
        setAmount("");
        setCameraOpen(true);

        try {
            const { Html5Qrcode } = await import("html5-qrcode");

            // Allow the scanner container to mount first.
            await new Promise((resolve) =>
                setTimeout(resolve, 250)
            );

            const scanner = new Html5Qrcode("glocal-qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: {
                        width: 240,
                        height: 240,
                    },
                    aspectRatio: 1,
                },
                async (decodedText: string) => {
                    if (processingRef.current) return;

                    await stopScanner();
                    await previewStudent(decodedText);
                },
                () => { }
            );

            setScanning(true);
        } catch (err: any) {
            console.error("Camera error:", err);

            setError(
                err?.message?.includes("NotAllowed")
                    ? "Camera permission was denied. Please allow camera access."
                    : err?.message ||
                    "Unable to access your camera. Check camera permissions."
            );

            await stopScanner();
        }
    };

    // ------------------------------------------------
    // REDEMPTION
    // ------------------------------------------------

    const redeemPoints = async () => {
        if (!student || !qrToken) return;

        const redeemAmount = Number(amount);

        if (
            !Number.isInteger(redeemAmount) ||
            redeemAmount <= 0
        ) {
            setError("Enter a valid whole-number amount.");
            return;
        }

        if (redeemAmount > student.balance) {
            setError("Insufficient Glocal Points.");
            return;
        }

        if (student.status && student.status !== "active") {
            setError("This student's wallet is blocked.");
            return;
        }

        const confirmed = window.confirm(
            `Redeem ${redeemAmount} GP from ${student.name}'s wallet?`
        );

        if (!confirmed) return;

        setRedeeming(true);
        setError("");

        try {
            const idempotencyKey =
                typeof crypto !== "undefined" &&
                    crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`;

            const data = await apiRequest(
                "/api/glocal/merchant/redeem",
                {
                    qrToken,
                    amount: redeemAmount,
                    idempotencyKey,
                }
            );

            const balanceAfter = Number(
                data.balanceAfter ??
                data.balance_after ??
                data.wallet?.balance ??
                Math.max(0, student.balance - redeemAmount)
            );

            setReceipt({
                studentName: student.name,
                jamiaNo: student.jamiaNo,
                amount: redeemAmount,
                balanceAfter,
                reference: data.reference,
            });

            setStudent(null);
            setQrToken("");
            setAmount("");
        } catch (err: any) {
            setError(
                err.message || "Redemption failed. Please try again."
            );
        } finally {
            setRedeeming(false);
        }
    };

    // ------------------------------------------------
    // CLEANUP
    // ------------------------------------------------

    useEffect(() => {
        return () => {
            const scanner = scannerRef.current;

            if (scanner) {
                if (scanner.isScanning) {
                    scanner.stop().catch(() => { });
                }
                scanner.clear().catch(() => { });
                scannerRef.current = null;
            }
        };
    }, []);

    // ------------------------------------------------
    // AMOUNT CONTROLS
    // ------------------------------------------------

    const numericAmount = Number(amount) || 0;

    const changeAmount = (value: number) => {
        setAmount(
            String(
                Math.max(
                    0,
                    Math.min(student?.balance ?? 0, value)
                )
            )
        );
        setError("");
    };

    // ------------------------------------------------
    // SUCCESS SCREEN
    // ------------------------------------------------

    if (receipt) {
        return (
            <main className="min-h-screen bg-[#F4F7F4] p-5 flex items-center justify-center">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                        <CheckCircle2
                            size={42}
                            className="text-green-600"
                        />
                    </div>

                    <p className="mt-6 text-sm font-semibold text-green-700">
                        REDEMPTION SUCCESSFUL
                    </p>

                    <h1 className="mt-2 text-3xl font-black text-[#123D29]">
                        {receipt.amount.toLocaleString("en-IN")} GP
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Points successfully redeemed.
                    </p>

                    <div className="mt-7 rounded-2xl bg-gray-50 p-5 text-left">
                        <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">
                                Student
                            </span>
                            <span className="text-sm font-bold text-gray-800">
                                {receipt.studentName}
                            </span>
                        </div>

                        <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">
                                Jamia No
                            </span>
                            <span className="text-sm font-bold text-gray-800">
                                {receipt.jamiaNo}
                            </span>
                        </div>

                        <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">
                                Redeemed
                            </span>
                            <span className="text-sm font-bold text-red-600">
                                -{receipt.amount} GP
                            </span>
                        </div>

                        <div className="mt-3 border-t border-gray-200 pt-4 flex justify-between">
                            <span className="text-sm font-bold text-gray-700">
                                Remaining balance
                            </span>
                            <span className="text-lg font-black text-green-700">
                                {receipt.balanceAfter} GP
                            </span>
                        </div>

                        {receipt.reference && (
                            <p className="mt-4 text-[10px] text-gray-400">
                                Reference: {receipt.reference}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setReceipt(null);
                            setError("");
                        }}
                        className="mt-7 w-full rounded-xl bg-[#123D29] py-4 text-sm font-bold text-white hover:bg-[#174B32]"
                    >
                        Scan next student
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="mt-3 w-full py-3 text-sm font-semibold text-gray-500"
                    >
                        Back to dashboard
                    </button>
                </div>
            </main>
        );
    }

    // ------------------------------------------------
    // MAIN PAGE
    // ------------------------------------------------

    return (
        <main className="min-h-screen bg-[#F4F7F4]">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

                {/* HEADER */}

                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <Coins
                                    size={19}
                                    className="text-green-700"
                                />
                                <span className="text-xs font-black tracking-[0.18em] text-green-700">
                                    GLOCAL MERCHANT
                                </span>
                            </div>

                            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#123D29] sm:text-3xl">
                                Point Redemption
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Verify students and process Glocal transactions.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-2">
                        <ShieldCheck
                            size={16}
                            className="text-green-700"
                        />
                        <span className="text-xs font-bold text-green-800">
                            Secure merchant session
                        </span>
                    </div>
                </div>

                {/* TOP BANNER */}

                <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#174B32] via-[#0D3825] to-[#06291B] p-7 text-white sm:p-9">
                    <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
                    <div className="absolute -right-5 -top-14 h-52 w-52 rounded-full border border-white/10" />

                    <div className="relative z-10 max-w-xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-100">
                            <ShoppingBag size={14} />
                            Glocal Store & Merchant
                        </div>

                        <h2 className="text-2xl font-black sm:text-3xl">
                            Make every point count.
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-green-100/75">
                            Scan the student's dynamic QR, verify their
                            wallet and securely redeem the requested points.
                        </p>
                    </div>
                </div>

                {/* MAIN GRID */}

                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

                    {/* LEFT: SCANNER */}

                    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-extrabold text-[#123D29]">
                                        Scan student QR
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Position the QR inside the scanning area.
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                                    <ScanLine size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {cameraOpen ? (
                                <div>
                                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
                                        <div
                                            id="glocal-qr-reader"
                                            className="min-h-[300px] w-full"
                                        />
                                    </div>

                                    <button
                                        onClick={stopScanner}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
                                    >
                                        <X size={17} />
                                        Close camera
                                    </button>
                                </div>
                            ) : (
                                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-200 bg-[#F7FAF7] px-5 text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 text-green-700">
                                        <Camera size={34} />
                                    </div>

                                    <h3 className="mt-5 text-base font-extrabold text-[#123D29]">
                                        Ready to scan?
                                    </h3>

                                    <p className="mt-2 max-w-xs text-xs leading-5 text-gray-500">
                                        Start your camera and scan the
                                        student's Glocal redemption QR.
                                    </p>

                                    <button
                                        onClick={startScanner}
                                        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#123D29] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-900/10 hover:bg-[#174B32]"
                                    >
                                        <ScanLine size={17} />
                                        Open QR Scanner
                                    </button>
                                </div>
                            )}

                            <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                                <LockKeyhole
                                    size={17}
                                    className="mt-0.5 shrink-0 text-amber-700"
                                />
                                <p className="text-xs leading-5 text-amber-800">
                                    Each QR is temporary. Only proceed
                                    after the backend successfully verifies
                                    the student's token.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT: STUDENT & REDEMPTION */}

                    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-extrabold text-[#123D29]">
                                        Student verification
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Student details and redemption amount.
                                    </p>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                                    <UserRound size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {loadingPreview ? (
                                <div className="flex min-h-[250px] flex-col items-center justify-center">
                                    <Loader2
                                        size={32}
                                        className="animate-spin text-green-700"
                                    />
                                    <p className="mt-4 text-sm font-semibold text-gray-500">
                                        Verifying student wallet...
                                    </p>
                                </div>
                            ) : student ? (
                                <div>
                                    <div className="rounded-2xl border border-green-100 bg-green-50/60 p-5">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">
                                                    Verified student
                                                </p>
                                                <h3 className="mt-2 text-xl font-black text-[#123D29]">
                                                    {student.name}
                                                </h3>
                                                <p className="mt-1 text-xs font-semibold text-gray-500">
                                                    Jamia No: {student.jamiaNo}
                                                </p>
                                            </div>

                                            <CheckCircle2
                                                size={24}
                                                className="text-green-600"
                                            />
                                        </div>

                                        <div className="mt-5 rounded-xl bg-white p-4">
                                            <p className="text-xs font-medium text-gray-500">
                                                Available balance
                                            </p>
                                            <div className="mt-1 flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-[#123D29]">
                                                    {student.balance.toLocaleString("en-IN")}
                                                </span>
                                                <span className="text-xs font-black text-green-700">
                                                    GP
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-7">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-extrabold text-[#123D29]">
                                                Redemption amount
                                            </label>
                                            <span className="text-[10px] font-semibold text-gray-400">
                                                Max {student.balance} GP
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    changeAmount(numericAmount - 10)
                                                }
                                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            >
                                                <Minus size={18} />
                                            </button>

                                            <div className="flex h-14 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={student.balance}
                                                    step="1"
                                                    value={amount}
                                                    onChange={(e) => {
                                                        setAmount(e.target.value);
                                                        setError("");
                                                    }}
                                                    placeholder="0"
                                                    className="w-full bg-transparent text-center text-2xl font-black text-[#123D29] outline-none"
                                                />
                                                <span className="mr-4 text-xs font-black text-green-700">
                                                    GP
                                                </span>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    changeAmount(numericAmount + 10)
                                                }
                                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        <div className="mt-3 grid grid-cols-4 gap-2">
                                            {[10, 25, 50, 100].map((value) => (
                                                <button
                                                    key={value}
                                                    disabled={value > student.balance}
                                                    onClick={() =>
                                                        changeAmount(value)
                                                    }
                                                    className="rounded-lg border border-gray-200 py-2 text-xs font-bold text-gray-600 hover:border-green-400 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                >
                                                    {value}
                                                </button>
                                            ))}
                                        </div>

                                        {error && (
                                            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                                                <AlertCircle
                                                    size={16}
                                                    className="shrink-0"
                                                />
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            onClick={redeemPoints}
                                            disabled={
                                                redeeming ||
                                                !amount ||
                                                numericAmount <= 0 ||
                                                numericAmount > student.balance
                                            }
                                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123D29] py-4 text-sm font-bold text-white shadow-lg shadow-green-900/10 hover:bg-[#174B32] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {redeeming ? (
                                                <Loader2
                                                    size={18}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <ShoppingBag size={18} />
                                            )}

                                            {redeeming
                                                ? "Processing redemption..."
                                                : `Confirm redemption · ${numericAmount || 0} GP`}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setStudent(null);
                                                setQrToken("");
                                                setAmount("");
                                                setError("");
                                            }}
                                            className="mt-3 w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-700"
                                        >
                                            Cancel and scan another student
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                                        <UserRound size={29} />
                                    </div>

                                    <h3 className="mt-4 text-sm font-extrabold text-gray-700">
                                        No student verified
                                    </h3>

                                    <p className="mt-2 max-w-xs text-xs leading-5 text-gray-400">
                                        Scan a student's QR code to retrieve
                                        their wallet details and start a
                                        redemption.
                                    </p>
                                </div>
                            )}

                            {error && !student && !loadingPreview && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                                    <AlertCircle
                                        size={16}
                                        className="shrink-0"
                                    />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* FOOTER */}

                <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <ShieldCheck size={15} />
                        Glocal secure transaction system
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="text-xs font-bold text-green-800 hover:underline"
                    >
                        Back to admin dashboard
                    </button>
                </div>
            </div>
        </main>
    );
}
