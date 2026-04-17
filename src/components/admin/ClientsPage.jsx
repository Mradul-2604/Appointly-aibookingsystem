import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
];

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [clientAppts, setClientAppts] = useState([]);
    const [apptLoading, setApptLoading] = useState(false);

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .neq('role', 'admin')
                .order('created_at', { ascending: false });
            setClients(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectClient = async (client) => {
        setSelected(client);
        setApptLoading(true);
        try {
            const { data } = await supabase
                .from('appointments')
                .select('id, status, notes, created_at, slots!slot_id(date, start_time), services!service_id(name)')
                .eq('user_id', client.id)
                .order('created_at', { ascending: false })
                .limit(10);
            setClientAppts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setApptLoading(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return '';
        return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
    };

    const formatJoined = (d) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const filtered = clients.filter(c => {
        const q = search.toLowerCase();
        return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    });

    const STATUS_STYLES = {
        confirmed: 'bg-green-50 text-green-700',
        pending: 'bg-amber-50 text-amber-700',
        cancelled: 'bg-red-50 text-red-700',
        completed: 'bg-blue-50 text-blue-700',
    };

    return (
        <div className="p-6 md:p-8 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#191c1d]">Clients</h2>
                    <p className="text-sm text-outline mt-1">{clients.length} registered client{clients.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="relative max-w-xs w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Client List */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-outline">
                            <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">
                                {search ? 'search_off' : 'people'}
                            </span>
                            <p className="text-sm">{search ? 'No clients match your search' : 'No clients yet'}</p>
                            {search && (
                                <button onClick={() => setSearch('')} className="text-xs text-primary font-medium hover:underline mt-2 inline-block">
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-outline-variant/10">
                            {filtered.map((client, i) => (
                                <button
                                    key={client.id}
                                    onClick={() => selectClient(client)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-[#f8f9fa] transition-colors text-left ${
                                        selected?.id === client.id ? 'bg-primary/5' : ''
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                                        {initials(client.name || client.email || '')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#191c1d] truncate">{client.name || 'No name'}</p>
                                        <p className="text-xs text-outline truncate">{client.email}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-outline">Joined</p>
                                        <p className="text-xs font-medium text-[#191c1d]">{formatJoined(client.created_at)}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-outline/40 text-[18px]">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Client Detail */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-outline min-h-[300px]">
                            <span className="material-symbols-outlined text-4xl mb-3 opacity-30">person</span>
                            <p className="text-sm text-center">Select a client to view their profile and booking history</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 border-b border-outline-variant/10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ${AVATAR_COLORS[clients.findIndex(c => c.id === selected.id) % AVATAR_COLORS.length]}`}>
                                        {initials(selected.name || selected.email || '')}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-[#191c1d]">{selected.name || 'No name'}</h3>
                                        <p className="text-sm text-outline truncate">{selected.email}</p>
                                        <p className="text-xs text-outline/60 mt-0.5">Member since {formatJoined(selected.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-outline mb-3">Booking History</h4>
                                {apptLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : clientAppts.length === 0 ? (
                                    <div className="py-6 text-center text-outline">
                                        <span className="material-symbols-outlined text-2xl mb-1 block opacity-30">event_busy</span>
                                        <p className="text-xs">No bookings found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {clientAppts.map(appt => (
                                            <div key={appt.id} className="p-3 bg-[#f8f9fa] rounded-xl">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium text-[#191c1d] truncate">{appt.service || appt.service_type || 'General'}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
                                                        {appt.status || 'pending'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-outline mt-1">
                                                    {formatDate(appt.date || appt.appointment_date)}
                                                    {appt.time && ` · ${formatTime(appt.time)}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
