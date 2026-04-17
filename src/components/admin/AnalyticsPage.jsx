import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsPage() {
    const [data, setData] = useState({
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        byMonth: [],
        byService: [],
        recentGrowth: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const { data: appts } = await supabase
                .from('appointments')
                .select('id, status, created_at, slots!slot_id(date), services!service_id(name)');
            if (!appts) return;

            const total = appts.length;
            const confirmed = appts.filter(a => a.status === 'confirmed').length;
            const pending = appts.filter(a => a.status === 'pending').length;
            const cancelled = appts.filter(a => a.status === 'cancelled').length;

            // By month for current year using slot date
            const currentYear = new Date().getFullYear();
            const byMonth = MONTHS.map((label, i) => ({
                label,
                count: appts.filter(a => {
                    const dateStr = a.slots?.date || a.created_at;
                    const d = new Date(dateStr);
                    return d.getFullYear() === currentYear && d.getMonth() === i;
                }).length,
            }));

            // By service name
            const serviceCounts = {};
            appts.forEach(a => {
                const s = a.services?.name || 'Other';
                serviceCounts[s] = (serviceCounts[s] || 0) + 1;
            });
            const byService = Object.entries(serviceCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));

            // Month-over-month growth
            const now = new Date();
            const thisMonth = appts.filter(a => {
                const d = new Date(a.slots?.date || a.created_at);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length;
            const lastMonth = appts.filter(a => {
                const d = new Date(a.slots?.date || a.created_at);
                const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
            }).length;
            const recentGrowth = lastMonth === 0 ? 0 : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

            setData({ total, confirmed, pending, cancelled, byMonth, byService, recentGrowth });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const maxMonthCount = Math.max(...(data.byMonth?.map(m => m.count) || [1]), 1);

    const statCards = [
        { label: 'Total Bookings', value: data.total, icon: 'event_available', color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Confirmed', value: data.confirmed, icon: 'check_circle', color: 'text-green-700', bg: 'bg-green-50' },
        { label: 'Pending', value: data.pending, icon: 'pending', color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'Cancelled', value: data.cancelled, icon: 'cancel', color: 'text-red-700', bg: 'bg-red-50' },
    ];

    return (
        <div className="p-6 md:p-8 pb-24 md:pb-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#191c1d]">Analytics</h2>
                <p className="text-sm text-outline mt-1">Booking trends and performance insights</p>
            </div>

            {/* Stat cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(card => (
                    <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
                        <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                            <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
                        </div>
                        <p className="text-xs text-outline font-medium mb-1">{card.label}</p>
                        <p className={`text-3xl font-bold ${card.color}`}>
                            {loading ? <span className="animate-pulse bg-gray-200 rounded w-10 h-7 inline-block" /> : card.value}
                        </p>
                    </div>
                ))}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Monthly bar chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="font-semibold text-[#191c1d]">Monthly Bookings</h4>
                            <p className="text-xs text-outline mt-0.5">{new Date().getFullYear()}</p>
                        </div>
                        {data.recentGrowth !== 0 && (
                            <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${
                                data.recentGrowth > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                                <span className="material-symbols-outlined text-sm">
                                    {data.recentGrowth > 0 ? 'trending_up' : 'trending_down'}
                                </span>
                                {Math.abs(data.recentGrowth)}% vs last month
                            </div>
                        )}
                    </div>
                    {loading ? (
                        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                    ) : (
                        <div className="flex items-end gap-2 h-48">
                            {data.byMonth.map((m, i) => (
                                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-outline font-medium">{m.count || ''}</span>
                                    <div
                                        className={`w-full rounded-t-lg transition-all ${
                                            i === new Date().getMonth() ? 'bg-primary' : 'bg-primary/20'
                                        }`}
                                        style={{ height: `${Math.max((m.count / maxMonthCount) * 160, m.count > 0 ? 8 : 0)}px` }}
                                    />
                                    <span className="text-[10px] text-outline">{m.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* By Service */}
                <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-6">
                    <h4 className="font-semibold text-[#191c1d] mb-1">By Service</h4>
                    <p className="text-xs text-outline mb-5">Breakdown by appointment type</p>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : data.byService.length === 0 ? (
                        <div className="py-8 text-center text-outline">
                            <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">bar_chart</span>
                            <p className="text-sm">No data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.byService.map((s, i) => (
                                <div key={s.name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-[#191c1d] truncate max-w-[140px]">{s.name}</span>
                                        <span className="text-outline">{s.count} ({s.pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-[#f3f4f5] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${s.pct}%`, opacity: 1 - i * 0.12 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Status breakdown */}
            {!loading && data.total > 0 && (
                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-6">
                    <h4 className="font-semibold text-[#191c1d] mb-4">Status Overview</h4>
                    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                        {[
                            { key: 'confirmed', color: 'bg-green-500', val: data.confirmed },
                            { key: 'pending', color: 'bg-amber-400', val: data.pending },
                            { key: 'cancelled', color: 'bg-red-400', val: data.cancelled },
                        ].filter(s => s.val > 0).map(s => (
                            <div
                                key={s.key}
                                className={`${s.color} transition-all`}
                                style={{ width: `${(s.val / data.total) * 100}%` }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-6 mt-3">
                        {[
                            { label: 'Confirmed', val: data.confirmed, color: 'bg-green-500' },
                            { label: 'Pending', val: data.pending, color: 'bg-amber-400' },
                            { label: 'Cancelled', val: data.cancelled, color: 'bg-red-400' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                <span className="text-xs text-outline">{s.label}: <strong className="text-[#191c1d]">{s.val}</strong></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
