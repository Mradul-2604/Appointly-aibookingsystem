import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';

const API = 'http://localhost:5000/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_COLORS = {
    confirmed:   'bg-green-100 text-green-800 border-green-200',
    rescheduled: 'bg-amber-100 text-amber-800 border-amber-200',
    pending:     'bg-amber-100 text-amber-800 border-amber-200',
    completed:   'bg-blue-100 text-blue-800 border-blue-200',
};

function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// Generate 30-min time slots 10:30 → 20:00
const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 10; h <= 20; h++) {
        for (let m of [0, 30]) {
            if (h === 10 && m === 0) continue;
            if (h === 20 && m === 30) continue;
            slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
        }
    }
    return slots;
})();

export default function SchedulePage() {
    const { getToken } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState('month');
    const [blockTime, setBlockTime] = useState('');
    const [actionId, setActionId] = useState(null); // tracks in-progress cancel/block

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => { fetchAppointments(); }, [year, month]);
    useEffect(() => {
        if (selectedDate) fetchBlockedSlots(dateStr(selectedDate));
    }, [selectedDate]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
            const { data } = await supabase
                .from('appointments')
                .select('id, status, notes, slots!slot_id(date, start_time, end_time), services!service_id(name), profiles!user_id(name, email)')
                .gte('slots.date', firstDay)
                .lte('slots.date', lastDay);
            // Filter client-side since Supabase embedded resource filtering can vary
            const filtered = (data || []).filter(a => a.slots?.date >= firstDay && a.slots?.date <= lastDay);
            setAppointments(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const dateStr = (day) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const authHeaders = async () => {
        const token = await getToken();
        return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    };

    const fetchBlockedSlots = async (date) => {
        try {
            const headers = await authHeaders();
            const res = await fetch(`${API}/admin/blocked-slots?date=${date}`, { headers });
            const result = await res.json();
            setBlockedSlots(result.success ? result.data : []);
        } catch { setBlockedSlots([]); }
    };

    const handleAdminCancel = async (appointmentId) => {
        if (!window.confirm('Cancel this appointment? The patient will be notified by email.')) return;
        setActionId(appointmentId);
        try {
            const res = await fetch(`${API}/admin/cancel-appointment`, {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify({ appointment_id: appointmentId }),
            });
            const result = await res.json();
            if (result.success) {
                setAppointments(prev => prev.map(a =>
                    a.id === appointmentId ? { ...a, status: 'cancelled' } : a
                ));
            } else {
                alert(result.error);
            }
        } catch { alert('Connection error.'); }
        finally { setActionId(null); }
    };

    const handleBlockSlot = async () => {
        if (!blockTime || !selectedDate) return;
        setActionId('block');
        try {
            const res = await fetch(`${API}/admin/block-slot`, {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify({ date: dateStr(selectedDate), time: blockTime }),
            });
            const result = await res.json();
            if (result.success) {
                setBlockTime('');
                fetchBlockedSlots(dateStr(selectedDate));
            } else {
                alert(result.error);
            }
        } catch { alert('Connection error.'); }
        finally { setActionId(null); }
    };

    const handleUnblock = async (slotId) => {
        setActionId(slotId);
        try {
            const res = await fetch(`${API}/admin/block-slot/${slotId}`, {
                method: 'DELETE',
                headers: await authHeaders(),
            });
            const result = await res.json();
            if (result.success) fetchBlockedSlots(dateStr(selectedDate));
            else alert(result.error);
        } catch { alert('Connection error.'); }
        finally { setActionId(null); }
    };

    const getDaysInMonth = () => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    };

    const getApptsForDay = (day) => {
        if (!day) return [];
        const ds = dateStr(day);
        return appointments.filter(a => a.slots?.date === ds && a.status !== 'cancelled');
    };

    const getBlockedForDay = (day) => {
        if (!day) return [];
        const ds = dateStr(day);
        return blockedSlots.filter(s => s.date === ds);
    };

    const today = new Date();
    const isToday = (day) => day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

    const selectedDayAppts = selectedDate ? getApptsForDay(selectedDate) : [];

    const weekAppts = (() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            days.push({ date: d, appts: appointments.filter(a => a.slots?.date === dateStr && a.status !== 'cancelled') });
        }
        return days;
    })();

    return (
        <div className="p-6 md:p-8 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#191c1d]">Schedule</h2>
                    <p className="text-sm text-outline mt-1">Manage appointments and availability</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-outline-variant/20 rounded-xl overflow-hidden">
                        {['month', 'week'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${view === v ? 'bg-primary text-white' : 'text-outline hover:text-[#191c1d]'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-outline-variant/20 rounded-xl px-2">
                        <button
                            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                            className="p-2 text-outline hover:text-[#191c1d] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="text-sm font-semibold text-[#191c1d] min-w-[130px] text-center">
                            {MONTHS[month]} {year}
                        </span>
                        <button
                            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                            className="p-2 text-outline hover:text-[#191c1d] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className={`xl:col-span-2 bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden`}>
                    {view === 'month' ? (
                        <>
                            <div className="grid grid-cols-7 border-b border-outline-variant/10">
                                {DAYS.map(d => (
                                    <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-outline">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            {loading ? (
                                <div className="p-8 text-center text-outline">
                                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-7">
                                    {getDaysInMonth().map((day, idx) => {
                                        const dayAppts    = getApptsForDay(day);
                                        const dayBlocked  = getBlockedForDay(day);
                                        const active = selectedDate === day;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => day && setSelectedDate(active ? null : day)}
                                                className={`min-h-[80px] p-2 border-b border-r border-outline-variant/10 cursor-pointer transition-colors ${
                                                    !day ? 'bg-[#f8f9fa]' : active ? 'bg-primary/5' : 'hover:bg-[#f8f9fa]'
                                                }`}
                                            >
                                                {day && (
                                                    <>
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                                                            isToday(day) ? 'bg-primary text-white' : 'text-[#191c1d]'
                                                        }`}>
                                                            {day}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {dayAppts.slice(0, 2).map(a => (
                                                                <div key={a.id} className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate border ${STATUS_COLORS[a.status] || STATUS_COLORS.pending}`}>
                                                                    {formatTime(a.slots?.start_time)} {a.profiles?.name?.split(' ')[0] || ''}
                                                                </div>
                                                            ))}
                                                            {dayBlocked.slice(0, 1).map(s => (
                                                                <div key={s.id} className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate border bg-red-50 text-red-600 border-red-200">
                                                                    {formatTime(s.start_time)} blocked
                                                                </div>
                                                            ))}
                                                            {(dayAppts.length + dayBlocked.length) > 2 && (
                                                                <div className="text-[10px] text-outline pl-1">+{dayAppts.length + dayBlocked.length - 2} more</div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Week view */
                        <div>
                            <div className="grid grid-cols-7 border-b border-outline-variant/10">
                                {weekAppts.map(({ date }) => (
                                    <div key={date.toISOString()} className={`py-3 text-center border-r border-outline-variant/10 last:border-0 ${
                                        date.toDateString() === today.toDateString() ? 'bg-primary/5' : ''
                                    }`}>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-outline">{DAYS[date.getDay()]}</p>
                                        <p className={`text-lg font-bold mt-0.5 ${date.toDateString() === today.toDateString() ? 'text-primary' : 'text-[#191c1d]'}`}>
                                            {date.getDate()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 min-h-[400px]">
                                {weekAppts.map(({ date, appts }) => (
                                    <div key={date.toISOString()} className={`p-2 border-r border-outline-variant/10 last:border-0 space-y-1.5 ${
                                        date.toDateString() === today.toDateString() ? 'bg-primary/3' : ''
                                    }`}>
                                        {appts.map(a => (
                                            <div key={a.id} className={`text-xs p-2 rounded-lg border ${STATUS_COLORS[a.status] || STATUS_COLORS.pending}`}>
                                                <p className="font-semibold">{formatTime(a.slots?.start_time)}</p>
                                                <p className="truncate opacity-80">{a.profiles?.name || a.profiles?.email || 'Client'}</p>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Day Detail Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                    <div className="px-5 py-5 border-b border-outline-variant/10">
                        <h4 className="font-semibold text-[#191c1d]">
                            {selectedDate
                                ? `${MONTHS[month]} ${selectedDate}, ${year}`
                                : 'Select a date'}
                        </h4>
                        {selectedDate && (
                            <p className="text-xs text-outline mt-0.5">{selectedDayAppts.length} appointment{selectedDayAppts.length !== 1 ? 's' : ''}</p>
                        )}
                    </div>
                    <div className="p-5">
                        {!selectedDate ? (
                            <div className="py-8 text-center text-outline">
                                <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">touch_app</span>
                                <p className="text-sm">Click a date to view appointments</p>
                            </div>
                        ) : selectedDayAppts.length === 0 ? (
                            <div className="py-8 text-center text-outline">
                                <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">event_available</span>
                                <p className="text-sm">No appointments on this day</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedDayAppts.map(appt => (
                                    <div key={appt.id} className="p-4 bg-[#f8f9fa] rounded-xl border border-outline-variant/10">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-[#191c1d] truncate">
                                                    {appt.profiles?.name || appt.profiles?.email || 'Client'}
                                                </p>
                                                <p className="text-xs text-outline">{appt.services?.name || 'General'}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 border ${STATUS_COLORS[appt.status] || STATUS_COLORS.pending}`}>
                                                {appt.status || 'pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs font-medium text-primary">
                                                <span className="material-symbols-outlined text-xs align-middle mr-1">schedule</span>
                                                {formatTime(appt.slots?.start_time)}
                                            </p>
                                            {appt.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleAdminCancel(appt.id)}
                                                    disabled={actionId === appt.id}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                                                    {actionId === appt.id ? 'Cancelling…' : 'Cancel'}
                                                </button>
                                            )}
                                        </div>
                                        {appt.notes && <p className="text-xs text-outline mt-1 italic">{appt.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Block Time Section */}
                    {selectedDate && (
                        <div className="border-t border-outline-variant/10 px-5 py-5">
                            <h5 className="text-sm font-semibold text-[#191c1d] mb-3">Block Unavailable Time</h5>

                            {/* Existing blocks */}
                            {blockedSlots.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                    {blockedSlots.map(s => (
                                        <div key={s.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                                            <span className="text-xs font-medium text-red-700">
                                                <span className="material-symbols-outlined text-[13px] align-middle mr-1">block</span>
                                                {formatTime(s.start_time)} blocked
                                            </span>
                                            <button
                                                onClick={() => handleUnblock(s.id)}
                                                disabled={actionId === s.id}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                                            >
                                                {actionId === s.id ? '…' : 'Unblock'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <select
                                    value={blockTime}
                                    onChange={e => setBlockTime(e.target.value)}
                                    className="flex-1 text-sm border border-outline-variant/20 rounded-lg px-3 py-2 bg-[#f8f9fa] outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Select time…</option>
                                    {TIME_SLOTS.map(t => <option key={t} value={t}>{formatTime(t + ':00')}</option>)}
                                </select>
                                <button
                                    onClick={handleBlockSlot}
                                    disabled={!blockTime || actionId === 'block'}
                                    className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {actionId === 'block' ? '…' : 'Block'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4">
                {Object.entries(STATUS_COLORS).map(([status, cls]) => (
                    <div key={status} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border ${cls}`} />
                        <span className="text-xs text-outline capitalize">{status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
