import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserButton, useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';

const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/admin/schedule', label: 'Schedule', icon: 'calendar_month' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'bar_chart' },
    { path: '/admin/clients', label: 'Clients', icon: 'people' },
];

export default function AdminLayout() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoaded || !user) return;
        const checkAdmin = async () => {
            const email = user.primaryEmailAddress?.emailAddress;
            const { data } = await supabase.from('profiles').select('role').eq('email', email).single();
            if (!data || data.role !== 'admin') navigate('/chat');
        };
        checkAdmin();
    }, [isLoaded, user, navigate]);

    const isActive = (path, exact) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <div className="bg-[#f5f6f7] text-on-background min-h-screen">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-white border-r border-outline-variant/10 p-5 gap-2 z-50">
                <div className="px-1 py-5 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-[#191c1d] leading-tight">Appointly</h1>
                            <p className="text-[9px] uppercase tracking-widest text-outline">AI Booking System</p>
                        </div>
                    </div>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                                isActive(item.path, item.exact)
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-[#191c1d]/60 hover:bg-[#f3f4f5] hover:text-[#191c1d]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-outline-variant/10 pt-4 flex flex-col gap-2 px-1">
                    <div className="flex items-center gap-3">
                        <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-on-surface truncate">{user?.fullName || 'Admin'}</span>
                            <span className="text-xs text-outline truncate">{user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ redirectUrl: '/' })}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Page content */}
            <main className="md:ml-64 min-h-screen">
                <Outlet />
            </main>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/10 flex justify-around items-center h-16 px-2 z-50">
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                            isActive(item.path, item.exact) ? 'text-primary' : 'text-outline'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
