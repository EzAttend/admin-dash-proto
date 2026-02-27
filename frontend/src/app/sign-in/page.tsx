"use client";

import { useState, Suspense } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error: authError } = await signIn.email({
            email,
            password,
        });

        setLoading(false);

        if (authError) {
            setError(authError.message ?? "Sign in failed");
            return;
        }

        router.push(callbackUrl);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl p-8 space-y-6 animate-fade-in"
            >
                <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white font-bold text-lg mx-auto shadow-lg shadow-accent-500/20">
                        SA
                    </div>
                    <h1 className="text-xl font-semibold text-white">Sign In</h1>
                    <p className="text-sm text-[#737373]">Smart Attendance Admin</p>
                </div>

                {error && (
                    <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#a3a3a3] mb-1.5">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#333] text-white placeholder-[#525252] focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 text-sm transition-colors"
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#a3a3a3] mb-1.5">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#333] text-white placeholder-[#525252] focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 text-sm transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-accent-500 text-white font-medium text-sm hover:bg-accent-600 transition-colors disabled:opacity-50 shadow-lg shadow-accent-500/20"
                >
                    {loading ? "Signing in…" : "Sign In"}
                </button>

                <p className="text-center text-sm text-[#737373]">
                    Don&apos;t have an account?{" "}
                    <Link href="/sign-up" className="text-accent-400 hover:text-accent-300 transition-colors">
                        Sign Up
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <SignInForm />
        </Suspense>
    );
}
