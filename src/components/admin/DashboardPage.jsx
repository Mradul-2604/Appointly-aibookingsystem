import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const STATUS_STYLES = {
    confirmed: 'bg-green-50 text-green-700 border border-green-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
    rescheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
};

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
}

function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d) {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
    const [stats, setStats] = useState({ total: 0, today: 0, nextTime: null });
    const [appointments, setAppointments] = useState([]);
    const [todaySlots, setTodaySlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch all appointments with JOINs (slots has date/time, services has name, profiles has user info)
            const [{ count: total }, { data: allToday }, { data: recent }] = await Promise.all([
                supabase.from('appointments').select('*', { count: 'exact', head: true }),
                supabase
                    .from('appointments')
                    .select('id, status, slots!slot_id(date, start_time), profiles!user_id(name, email)')
                    .eq('slots.date', today),
                supabase
                    .from('appointments')
                    .select('id, status, notes, created_at, slots!slot_id(date, start_time), services!service_id(name), profiles!user_id(name, email)')
                    .order('created_at', { ascending: false })
                    .limit(8),
            ]);

            const todayAppts = (allToday || []).filter(a => a.slots?.date === today);
            const now = new Date();
            const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const next = todayAppts.find(a => a.slots?.start_time > nowTime);

            setStats({ total: total || 0, today: todayAppts.length, nextTime: next?.slots?.start_time || null });
            setAppointments(recent || []);
            setTodaySlots(todayAppts.sort((a, b) => (a.slots?.start_time || '') > (b.slots?.start_time || '') ? 1 : -1));
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 pb-24 md:pb-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#191c1d]">Dashboard</h2>
                <p className="text-sm text-outline mt-1">Welcome back — here's what's happening today.</p>
            </div>

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-7xl">event_available</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-outline mb-1">Total Bookings</p>
                    <h3 className="text-4xl font-bold text-[#191c1d] mb-3">
                        {loading ? <span className="animate-pulse bg-gray-200 rounded w-16 h-8 inline-block" /> : stats.total}
                    </h3>
                    <Link to="/admin/analytics" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                        View analytics <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                </div>

                <div className="bg-primary p-6 rounded-2xl shadow-lg shadow-primary/20 relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <span className="material-symbols-outlined text-7xl">today</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Today's Bookings</p>
                    <h3 className="text-4xl font-bold mb-3">
                        {loading ? <span className="animate-pulse bg-white/20 rounded w-12 h-8 inline-block" /> : stats.today}
                    </h3>
                    {stats.nextTime
                        ? <p className="text-xs bg-white/20 w-fit px-3 py-1 rounded-full">Next: {fmtTime(stats.nextTime)}</p>
                        : <p className="text-xs opacity-60">No upcoming appointments</p>
                    }
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-7xl">schedule</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-outline mb-1">Today's Schedule</p>
                    <h3 className="text-4xl font-bold text-[#191c1d] mb-3">
                        {loading ? <span className="animate-pulse bg-gray-200 rounded w-16 h-8 inline-block" /> : todaySlots.length}
                    </h3>
                    <Link to="/admin/schedule" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                        View schedule <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Appointments */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
                        <div>
                            <h4 className="font-semibold text-[#191c1d]">Recent Appointments</h4>
                            <p className="text-xs text-outline mt-0.5">Latest booking activity</p>
                        </div>
                        <Link to="/admin/clients" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                            View all <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="p-12 text-center text-outline">
                            <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">event_busy</span>
                            <p className="text-sm">No appointments yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#f8f9fa]">
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-outline">Client</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-outline">Service</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-outline">Date & Time</th>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-outline">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {appointments.map(appt => {
                                    const profile = appt.profiles;
                                    const slot = appt.slots;
                                    const service = appt.services;
                                    return (
                                        <tr key={appt.id} className="hover:bg-[#f8f9fa] transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                        {initials(profile?.name || profile?.email || '')}
                                                    </div>
                                                    <span className="text-sm font-medium text-[#191c1d] truncate max-w-[120px]">
                                                        {profile?.name || profile?.email || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-on-surface-variant">{service?.name || '—'}</td>
                                            <td className="px-6 py-3.5">
                                                <p className="text-sm font-medium text-[#191c1d]">{fmtDate(slot?.date)}</p>
                                                <p className="text-xs text-outline">{fmtTime(slot?.start_time)}</p>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
                                                    {appt.status || 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Today's Schedule */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-5 border-b border-outline-variant/10">
                        <h4 className="font-semibold text-[#191c1d]">Today's Schedule</h4>
                        {todaySlots.length > 0 && (
                            <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg">{todaySlots.length} appts</span>
                        )}
                    </div>
                    <div className="p-5">
                        {loading ? (
                            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
                        ) : todaySlots.length === 0 ? (
                            <div className="py-8 text-center text-outline">
                                <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">event_available</span>
                                <p className="text-sm">No appointments today</p>
                                <Link to="/admin/schedule" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">Manage schedule →</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todaySlots.map(appt => {
                                    const nowTime = new Date().toTimeString().slice(0, 5);
                                    const isPast = appt.slots?.start_time && appt.slots.start_time < nowTime;
                                    return (
                                        <div key={appt.id} className={`flex items-center gap-3 p-3.5 rounded-xl border-l-4 ${isPast ? 'border-outline-variant/30 opacity-50' : 'border-primary'} bg-[#f8f9fa]`}>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold text-[#191c1d] ${isPast ? 'line-through' : ''}`}>{fmtTime(appt.slots?.start_time)}</p>
                                                <p className="text-xs text-outline truncate">{appt.profiles?.name || appt.profiles?.email || 'Client'}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>{appt.status || 'pending'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <Link to="/admin/schedule" className="mt-4 w-full py-2.5 border-2 border-dashed border-outline-variant/40 text-outline rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 block text-center">
                            <span className="material-symbols-outlined text-sm">open_in_full</span> Full Schedule
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
