import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, getMe, type Employee } from "../api/client"; 
import { useEffect, useState } from "react";
export function LayoutPage()
{
    const navigate = useNavigate(); 
    function logout()
    {
        clearToken();   
        navigate("/login");
    } 
    const [user, setUser] = useState<Employee | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const me = await getMe();
                setUser(me);
            } catch {
                clearToken();
                navigate("/login");
            }
        }
        fetchUser();
    }, []);

     
    return (
        <div>
            <nav className="flex items-center justify-between bg-slate-900 px-8 py-4 w-full shadow-md">

                <div className="flex items-center gap-8">
                    <span className="font-sans font-extrabold tracking-tight text-white text-2xl">
                        EManager
                    </span>

                    <div className="flex items-center gap-2">
                        
                        <NavLink 
                        to="/dashboard" 
                        className={({isActive}) => isActive ? "bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium" : "text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"}>
                            Home</NavLink>
                        <NavLink to="/departments" className={({isActive}) => isActive ? "bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium" : "text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"}>Departments</NavLink>
                        <NavLink to="/employees" className={({isActive}) => isActive ? "bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium" : "text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"}>Employees</NavLink>
                        <NavLink to="/shifts" className={({isActive}) => isActive ? "bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium" : "text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"}>Shifts</NavLink>
                        <NavLink to="/timeoffs" className={({isActive}) => isActive ? "bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium" : "text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"}>Timeoffs</NavLink>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-gray-400 text-sm font-medium">Welcome back,</span>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500 capitalize tracking-wide">
                        {user?.first_name || 'Guest'}
                    </h2>
                </div>
                <button onClick={logout} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors">
                    Log Out
                </button>
            </nav>

            <main className="p-6">
                <Outlet context={{ user, logout }} />
            </main>
        </div>

        )
}