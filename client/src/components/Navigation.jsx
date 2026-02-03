import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Camera, Scale, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation = () => {
    const navItems = [
        { to: "/", icon: Home, label: "Home" },
        { to: "/weight", icon: Scale, label: "Weight" },
        { to: "/camera", icon: Camera, label: "Scan" },
        { to: "/profile", icon: User, label: "Profile" },
    ];

    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
            {/* Floating Dock Container */}
            <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center gap-8 md:gap-12 w-full max-w-sm md:max-w-md justify-between">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `relative flex flex-col items-center justify-center p-2 transition-all duration-300 group ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {/* Tooltip for desktop only? Or just keep it clean without labels on mobile default view */}
                                <span className="sr-only">{label}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="nav-dot"
                                        className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default Navigation;
