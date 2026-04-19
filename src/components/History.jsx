import React, { useState, useEffect } from 'react';
import { useAuth, useUser, UserButton, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const STATUS_STYLES = {
    confirmed:   { bg: 'bg-green-100 text-green-800',  icon: 'check_circle' },
    rescheduled: { bg: 'bg-amber-100 text-amber-800',  icon: 'edit_calendar' },
    cancelled:   { bg: 'bg-red-100 text-red-700',      icon: 'cancel' },
};

export default function History() {
    const { isLoaded, userId, getToken } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded && !userId) { navigate('/login'); return; }
        if (isLoaded && userId) fetchAppointments();
    }, [isLoaded, userId]);

    const fetchAppointments = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/appointments?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                const sorted = (result.data || []).sort((a, b) => {
                    const da = a.slots?.date + ' ' + (a.slots?.start_time || '');
                    const db = b.slots?.date + ' ' + (b.slots?.start_time || '');
                    return db.localeCompare(da);
                });
                setAppointments(sorted);
            } else {
                setError(result.error || 'Failed to load appointments.');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fmt = (date, time) => {
        if (!date) return '—';
        const t = time ? time.slice(0, 5) : '';
        return `${date}${t ? ' at ' + t : ''}`;
    };

    return (
        <div className="bg-surface text-on-surface antialiased overflow-hidden h-screen">
            <div className="flex h-full w-full">
                <aside className="flex flex-col h-full p-4 gap-2 bg-[#f3f4f5] dark:bg-slate-900 w-64 fixed left-0 top-0 font-['Inter'] z-50">
                    <div className="flex items-center gap-3 px-2 py-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined">auto_awesome</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#191c1d] leading-tight">Appointly</h1>
                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">AI Booking System</p>
                        </div>
                    </div>
                    <nav className="flex-1 space-y-1 mt-4">
                        <button onClick={() => navigate('/chat')} className="w-full flex items-center gap-3 px-3 py-2.5 text-[#191c1d]/70 hover:bg-white/50 rounded-xl transition-all duration-200">
                            <span className="material-symbols-outlined">chat_bubble</span>
                            <span className="text-sm">Schedule Assistant</span>
                        </button>
                        <button onClick={() => navigate('/history')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-white text-[#4F46E5] rounded-xl shadow-sm font-semibold transition-all duration-200">
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>history</span>
                            <span className="text-sm">History</span>
                        </button>
                    </nav>
                    <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-1">
                        <div className="flex items-center gap-3 px-2 py-2">
                            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold truncate">{user?.fullName || 'User'}</p>
                                <p className="text-[10px] text-outline truncate">{user?.primaryEmailAddress?.emailAddress || ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ redirectUrl: '/' })}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-100 rounded-xl transition-colors w-full"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Sign out
                        </button>
                    </div>
                </aside>

                <main className="ml-64 flex-1 flex flex-col h-screen bg-surface">
                    <header className="h-16 flex items-center px-8 bg-surface-container-low/50 backdrop-blur-md z-40 border-b border-outline-variant/10">
                        <h2 className="text-title-sm font-semibold text-on-surface">Appointment History</h2>
                    </header>

                    <section className="flex-1 overflow-y-auto px-8 py-8">
                        {loading && (
                            <div className="flex items-center gap-3 text-outline">
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                Loading appointments...
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                        )}

                        {!loading && !error && appointments.length === 0 && (
                            <div className="flex flex-col items-center gap-4 mt-20 text-outline">
                                <span className="material-symbols-outlined text-5xl">calendar_today</span>
                                <p className="text-lg font-medium">No appointments yet</p>
                                <button onClick={() => navigate('/chat')} className="px-5 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition-all">
                                    Book an appointment
                                </button>
                            </div>
                        )}

                        {!loading && appointments.length > 0 && (
                            <div className="space-y-3 max-w-3xl">
                                {appointments.map((appt) => {
                                    const slot = appt.slots || {};
                                    const svc  = appt.services || {};
                                    const style = STATUS_STYLES[appt.status] || STATUS_STYLES.confirmed;
                                    return (
                                        <div key={appt.id} className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm flex items-center gap-5">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>
                                                    {style.icon}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-on-surface truncate">{svc.name || 'Appointment'}</p>
                                                <p className="text-sm text-outline mt-0.5">{fmt(slot.date, slot.start_time)}</p>
                                                {appt.notes && <p className="text-xs text-outline/70 mt-1 truncate">Note: {appt.notes}</p>}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${style.bg}`}>
                                                {appt.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
