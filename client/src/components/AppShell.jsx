import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Camera, Scale, User, LogOut, Settings, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const AppShell = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-black/20 backdrop-blur-2xl fixed inset-y-0 left-0 z-50">
                <div className="p-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">GeminiFit</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem to="/" icon={Home} label="Overview" />
                    <NavItem to="/activity" icon={Activity} label="Training" />
                    <NavItem to="/weight" icon={Scale} label="Weight Tracker" />
                    <NavItem to="/camera" icon={Camera} label="Food Scanner" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            `flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${isActive ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        <Settings size={20} />
                        <span className="font-medium">Settings</span>
                    </NavLink>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-around items-center safe-area-bottom">
                <MobileNavItem to="/" icon={Home} label="Home" />
                <MobileNavItem to="/activity" icon={Activity} label="Train" />
                <MobileNavItem to="/camera" icon={Camera} label="Scan" />
                <MobileNavItem to="/weight" icon={Scale} label="Weight" />
                <MobileNavItem to="/profile" icon={User} label="Profile" />
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 relative">
                {/* Desktop Top Bar (Optional, good for user profile or search) */}
                <header className="hidden md:flex h-16 items-center justify-end px-8 border-b border-white/5 bg-neutral-900/30 backdrop-blur-sm sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">Welcome back, Anup</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xs ring-2 ring-neutral-900">
                            A
                        </div>
                    </div>
                </header>

                <div className="pb-24 md:pb-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`
        }
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

const MobileNavItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500'
            }`
        }
    >
        <Icon size={24} strokeWidth={2} />
        <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
);

export default AppShell;
