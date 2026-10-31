import { useState } from "react";
import { getToken, login } from "../api/client";
import { setToken } from "../api/client";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

export function getUserRole(): string | null {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
}

export function ProtectedRoute() {
    const token = getToken();

    if (!token) {
        return <Navigate to="/login" replace></Navigate>
    }
    return <Outlet />
}

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const token = await login(email, password);
            setToken(token);
            console.log("Logged in! Token:", token);
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2 bg-[#090b11] font-sans antialiased text-gray-200">
            
            {/* Left Column: Premium Brand/Marketing Side (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-950 via-slate-950 to-gray-950 border-r border-gray-900 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
                
                {/* Top Logo Tag */}
                <div className="flex items-center gap-2.5 z-10">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white font-black text-lg tracking-tighter">E</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        EManager
                    </span>
                </div>

                {/* Core Marketing/Product Message */}
                <div className="max-w-md my-auto space-y-4 z-10">
                    <span className="px-3 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        By maksymba0
                    </span>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none xl:text-5xl">
                        Optimize workforce schedules effortlessly.
                    </h1>
                    <p className="text-base text-gray-400 leading-relaxed">
                        Track metrics, manage shifting timelines, and unify data syncs directly from a single centralized dashboard environment.
                    </p>
                </div>

                {/* Footer Copy */}
                <p className="text-xs text-gray-600 z-10">
                    &copy; 2026 EManager. Open source under MIT.
                </p>
            </div>

            {/* Right Column: Clean, Highly Interactive Login Form Form */}
            <div className="flex items-center justify-center p-6 md:p-12 relative">
                {/* Mobile-only Top Header Branding */}
                <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
                    <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-black text-sm">E</span>
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">EManager</span>
                </div>

                <div className="w-full max-w-sm space-y-8">
                    {/* Header Meta */}
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Sign In</h2>
                        <p className="text-sm text-gray-400 mt-2">Enter credentials to unlock secure dashboard modules.</p>
                    </div>

                    {error && (
                        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Email Field Container */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Business Email
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-xl bg-[#11141d] text-white border border-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-inner"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password Field Container */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Password
                                </label>
                                <a href="#forgot" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                className="w-full px-4 py-3 rounded-xl bg-[#11141d] text-white border border-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-inner"
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
 

                        {/* Action Submissions */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-xl shadow-blue-900/20 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm mt-3"
                        >
                            {loading ? "Verifying Session..." : "Log In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
