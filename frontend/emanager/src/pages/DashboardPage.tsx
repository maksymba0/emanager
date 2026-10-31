import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { Employee } from './EmployeesPage';
import { getDepartments, getEmployees, getLogs, getShifts, getTimeoffs, type Log } from '../api/client';

// 1. Core structural types used for summary feeds
interface DashboardStats {
    totalEmployees: number;
    activeDepartments: number;
    activeShiftsToday: number;
    pendingTimeOffRequests: number;
}

interface ActivityItem {
    id: number;
    type: 'shift' | 'timeoff' | 'employee';
    title: string;
    subtitle: string;
    timeLabel: string;
    badgeText?: string;
    badgeStyle?: string;
}

interface DashboardPageProps {
    user: { first_name: string; role: string; id: number } | null;
    logout: () => void;
    navigateTo: (pageName: 'employees' | 'departments' | 'shifts' | 'timeoffs') => void;
}

export function DashboardPage() {
    // Analytics Metrics State
    const [stats, setStats] = useState<DashboardStats>({
        totalEmployees: 0,
        activeDepartments: 0,
        activeShiftsToday: 0,
        pendingTimeOffRequests: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    const [logsList, setLogsList] = useState<Log[]>([]);

    useEffect(() => {
        async function loadLiveDashboardMetrics() {
            try {
                setIsLoading(true);

                // 2. Fetch all required layout lists from your server concurrently
                const [allEmployees, allDepartments, allShifts, allTimeoffs, liveLogs] = await Promise.all([
                    getEmployees(),
                    getDepartments(),
                    getShifts(),
                    getTimeoffs(),
                    getLogs()
                ]);

                // Get today's local date in YYYY-MM-DD format to filter active shifts
                const todayString = new Date().toISOString().split('T')[0];

                // 3. Compute live metric totals dynamically
                setStats({
                    totalEmployees: allEmployees.length,
                    activeDepartments: allDepartments.length,
                    // Counts shifts whose scheduled target matches today's date tag
                    activeShiftsToday: allShifts.filter(shift => shift.shift_date.startsWith(todayString)).length,
                    // Counts time off requests still awaiting manager review approval toggles
                    pendingTimeOffRequests: allTimeoffs.filter(req => req.status === 'pending').length
                });
                
                setLogsList(liveLogs);


            } catch (error) {
                console.error("Failed to compile dashboard summary stats:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadLiveDashboardMetrics();
    }, []); // Empty array ensures this only aggregates metrics once on mount

    const formatTimeAgo = (dateString: string) => {
        const timeDiff = Date.now() - new Date(dateString).getTime();
        const mins = Math.floor(timeDiff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getBadgeStyle = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create': return 'bg-green-100 text-green-800 border-green-200';
            case 'delete': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200'; // Updates / reviews
        }
    };

    // Recent Operations Activity Feed State
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

    const navigate = useNavigate();

    // 👉 Instantly hooks into shared layout data context maps from LayoutPage!
    const { user, logout } = useOutletContext<{ user: Employee | null; logout: () => void }>();

    const navigateTo = (pageName: 'employees' | 'departments' | 'shifts' | 'timeoffs') => {
        navigate(`/${pageName}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-gray-400 animate-pulse">
                Aggregating real-time operations overview...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">

            {/* PREMIUM GLASSMORPHISM WELCOME BANNER HEADER ELEMENT */}
            <div className="flex items-center justify-between w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pr-5 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center font-bold text-base text-white shadow-md uppercase">
                        {user?.first_name?.charAt(0) || '?'}
                    </div>

                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none mb-1">
                            Role Level: <span className="text-indigo-400">{user?.role || 'Staff'}</span>
                        </p>
                        <h2 className="text-lg font-semibold text-white leading-none">
                            Welcome back, <span className="text-red-400 font-bold capitalize">{user?.first_name || 'Guest'}</span>
                        </h2>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="bg-slate-800 hover:bg-red-600/10 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-400 rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md"
                >
                    Log Out
                </button>
            </div>

            {/* DYNAMIC ANALYTICS STATS GRID OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Stat item: Total Staff */}
                <div
                    onClick={() => navigateTo('employees')}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Staff</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-gray-900">{stats.totalEmployees}</span>
                        <span className="text-xs text-blue-600 font-medium group-hover:underline">Manage ➡️</span>
                    </div>
                </div>

                {/* Stat item: Active Departments */}
                <div
                    onClick={() => navigateTo('departments')}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Departments</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-gray-900">{stats.activeDepartments}</span>
                        <span className="text-xs text-blue-600 font-medium group-hover:underline">View ➡️</span>
                    </div>
                </div>

                {/* Stat item: Active Shifts Today */}
                <div
                    onClick={() => navigateTo('shifts')}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shifts Active Today</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-gray-800">{stats.activeShiftsToday}</span>
                        <span className="text-xs text-blue-600 font-medium group-hover:underline">Schedule ➡️</span>
                    </div>
                </div>

                {/* Stat item: Pending Leave Requests */}
                <div
                    onClick={() => navigateTo('timeoffs')}
                    className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                    <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Pending Requests</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-rose-600">{stats.pendingTimeOffRequests}</span>
                        <span className="text-xs text-rose-600 font-bold animate-pulse group-hover:underline">Review ⚠️</span>
                    </div>
                </div>

            </div>

            {/* SPLIT HUB CONTROLLER ROW LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Section: Live Updates Log Feed Container Layout */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800 text-sm tracking-wide">
                        🕒 Recent Operation Updates
                    </div>
                    <div className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[400px]">
                        {logsList.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400 italic">No operational data recorded today.</div>
                        ) : (
                            logsList.map((log) => (
                                <div key={log.id} className="p-4 flex justify-between items-center gap-3 hover:bg-gray-50/50 transition-colors">
                                    <div className="space-y-0.5">
                                        {/* Render the descriptive text string committed dynamically from your backend modules */}
                                        <div className="text-sm font-semibold text-gray-900">{log.description}</div>
                                        <div className="text-xs text-gray-400 font-medium capitalize">
                                            Target Element: <span className="text-slate-600 font-semibold">{log.entity_type}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className="text-[10px] font-medium font-mono text-gray-400">
                                            {formatTimeAgo(log.created_at)}
                                        </span>
                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider border ${getBadgeStyle(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Section: System Quick Action Control Deck Links */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col space-y-3">
                    <h3 className="font-bold text-gray-800 text-sm tracking-wide mb-1 border-b border-gray-100 pb-2">
                        🚀 Control Shortcuts
                    </h3>

                    <button
                        onClick={() => navigateTo('shifts')}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all font-medium text-sm text-gray-700 flex justify-between items-center group"
                    >
                        <span>📅 Add Shift to Schedule</span>
                        <span className="text-gray-300 group-hover:text-blue-500 transition-colors">➡️</span>
                    </button>

                    <button
                        onClick={() => navigateTo('timeoffs')}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all font-medium text-sm text-gray-700 flex justify-between items-center group"
                    >
                        <span>⏳ Review Pending Time Offs</span>
                        <span className="text-gray-300 group-hover:text-blue-500 transition-colors">➡️</span>
                    </button>

                    <button
                        onClick={() => navigateTo('employees')}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all font-medium text-sm text-gray-700 flex justify-between items-center group"
                    >
                        <span>👥 Add Fresh Employee Profile</span>
                        <span className="text-gray-300 group-hover:text-blue-500 transition-colors">➡️</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
