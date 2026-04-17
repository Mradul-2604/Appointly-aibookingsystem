import React, { useEffect } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded && user) {
            const checkAdmin = async () => {
                const email = user.primaryEmailAddress?.emailAddress;
                const { data } = await supabase.from('profiles').select('role').eq('email', email).single();
                if (!data || data.role !== 'admin') {
                    navigate('/chat');
                }
            };
            checkAdmin();
        }
    }, [isLoaded, user, navigate]);
    return (
        <div className="bg-background text-on-background min-h-screen">
            <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#f3f4f5] p-4 gap-2 bg-gradient-to-r from-[#f3f4f5] to-[#f8f9fa] shadow-none z-50">
                <div className="px-2 py-6 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
                            <span className="material-symbols-outlined" data-icon="auto_awesome">auto_awesome</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#191c1d]">The Atelier</h1>
                            <p className="text-[10px] uppercase tracking-widest text-outline">AI Booking System</p>
                        </div>
                    </div>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                    <Link className="flex items-center gap-3 px-4 py-3 bg-white text-[#4F46E5] rounded-xl shadow-sm font-semibold transition-all duration-200" to="/admin">
                        <span className="material-symbols-outlined" data-icon="chat_bubble">dashboard</span>
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <Link className="flex items-center gap-3 px-4 py-3 text-[#191c1d]/70 hover:bg-white/50 hover:translate-x-1 transition-all duration-200 rounded-xl" to="/calendar">
                        <span className="material-symbols-outlined" data-icon="history">calendar_month</span>
                        <span className="text-sm">Schedule</span>
                    </Link>
                    <a className="flex items-center gap-3 px-4 py-3 text-[#191c1d]/70 hover:bg-white/50 hover:translate-x-1 transition-all duration-200 rounded-xl" href="#">
                        <span className="material-symbols-outlined" data-icon="bar_chart">bar_chart</span>
                        <span className="text-sm">Analytics</span>
                    </a>
                    <a className="flex items-center gap-3 px-4 py-3 text-[#191c1d]/70 hover:bg-white/50 hover:translate-x-1 transition-all duration-200 rounded-xl" href="#">
                        <span className="material-symbols-outlined" data-icon="group">group</span>
                        <span className="text-sm">Team</span>
                    </a>
                    <a className="flex items-center gap-3 px-4 py-3 text-[#191c1d]/70 hover:bg-white/50 hover:translate-x-1 transition-all duration-200 rounded-xl" href="#">
                        <span className="material-symbols-outlined" data-icon="auto_stories">auto_stories</span>
                        <span className="text-sm">Library</span>
                    </a>
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-outline-variant/10 pt-4">
                    <button className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 active:opacity-80 transition-opacity mb-4">
                        New Chat
                    </button>
                    <a className="flex items-center gap-3 px-4 py-2 text-[#191c1d]/70 hover:bg-white/50 transition-all rounded-xl" href="#">
                        <span className="material-symbols-outlined" data-icon="contact_support">contact_support</span>
                        <span className="text-sm">Support</span>
                    </a>
                    <a className="flex items-center gap-3 px-4 py-2 text-[#191c1d]/70 hover:bg-white/50 transition-all rounded-xl" href="#">
                        <span className="material-symbols-outlined" data-icon="settings">settings</span>
                        <span className="text-sm">Settings</span>
                    </a>
                </div>
            </aside>
            <main className="md:ml-64 min-h-screen">
                <header className="flex justify-between items-center w-full px-8 h-16 bg-[#f8f9fa] no-border bg-surface-container-low sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold tracking-tight text-[#191c1d]">Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex gap-6">
                            <a className="text-[#4F46E5] font-semibold border-b-2 border-[#4F46E5] pb-1 transition-colors duration-200" href="#">Dashboard</a>
                            <a className="text-[#191c1d]/60 font-medium hover:text-[#4F46E5] transition-colors duration-200" href="#">Schedule</a>
                            <a className="text-[#191c1d]/60 font-medium hover:text-[#4F46E5] transition-colors duration-200" href="#">Clients</a>
                        </div>
                        <div className="flex items-center gap-3 border-l border-outline-variant/30 pl-6">
                            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="notifications">notifications</button>
                            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="help_outline">help_outline</button>
                            <div className="w-8 h-8 rounded-full overflow-hidden ml-2">
                                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
                            </div>
                        </div>
                    </div>
                </header>
                <div className="p-8 max-w-[1600px] mx-auto">
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.04)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-8xl" data-icon="event_available">event_available</span>
                            </div>
                            <p className="text-sm font-medium text-outline mb-1">Total Bookings</p>
                            <h3 className="text-4xl font-bold text-on-surface mb-2">124</h3>
                            <div className="flex items-center gap-1 text-tertiary font-semibold text-sm">
                                <span className="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
                                <span>+12% this month</span>
                            </div>
                        </div>
                        <div className="bg-primary p-8 rounded-xl shadow-[0px_12px_32px_rgba(53,37,205,0.15)] relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <span className="material-symbols-outlined text-8xl" data-icon="today">today</span>
                            </div>
                            <p className="text-sm font-medium opacity-80 mb-1">Today's Bookings</p>
                            <h3 className="text-4xl font-bold mb-2">8</h3>
                            <p className="text-sm font-medium bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">Next: 14:00 PM</p>
                        </div>
                        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.04)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-8xl" data-icon="schedule">schedule</span>
                            </div>
                            <p className="text-sm font-medium text-outline mb-1">Available Slots</p>
                            <h3 className="text-4xl font-bold text-on-surface mb-2">15</h3>
                            <div className="flex items-center gap-1 text-outline font-medium text-sm">
                                <span className="material-symbols-outlined text-sm" data-icon="info">info</span>
                                <span>Across 3 calendars</span>
                            </div>
                        </div>
                    </section>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 flex flex-col gap-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-2xl font-semibold text-on-surface">Recent Appointments</h4>
                                    <p className="text-outline text-sm">Manage and monitor current booking flows</p>
                                </div>
                                <button className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
                                    View Full History <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_12px_32px_rgba(25,28,29,0.04)] border border-outline-variant/10">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-surface-container-low border-b border-outline-variant/20">
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-outline">User</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-outline">Service</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-outline">Date &amp; Time</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-outline">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-outline text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10">
                                        <tr className="hover:bg-surface-container-low/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold">SJ</div>
                                                    <span className="font-medium text-on-surface">Sarah J.</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">General Consultation</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-on-surface">Oct 24, 2023</p>
                                                <p className="text-xs text-outline">10:30 AM</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                                                    Confirmed
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">more_vert</button>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-surface-container-low/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-xs font-bold">MR</div>
                                                    <span className="font-medium text-on-surface">Mike R.</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">Follow-up</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-on-surface">Oct 24, 2023</p>
                                                <p className="text-xs text-outline">11:15 AM</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">more_vert</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <aside className="flex flex-col gap-6">
                            <h4 className="text-2xl font-semibold text-on-surface">Slot Management</h4>
                            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.04)] border border-outline-variant/10">
                                <div className="flex items-center justify-between mb-6">
                                    <h5 className="font-bold text-sm text-outline uppercase tracking-widest">Today's Schedule</h5>
                                    <span className="text-primary text-xs font-bold px-2 py-1 bg-primary/10 rounded-lg">8 Active</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border-l-4 border-primary">
                                        <div>
                                            <p className="text-sm font-bold text-on-surface">09:00 AM - 10:00 AM</p>
                                            <p className="text-xs text-outline">Morning Session</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input defaultChecked className="sr-only peer" type="checkbox"/>
                                            <div className="w-11 h-6 bg-outline-variant/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border-l-4 border-primary">
                                        <div>
                                            <p className="text-sm font-bold text-on-surface">10:00 AM - 11:00 AM</p>
                                            <p className="text-xs text-outline">Booking in progress</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input defaultChecked className="sr-only peer" type="checkbox"/>
                                            <div className="w-11 h-6 bg-outline-variant/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border-l-4 border-outline-variant/30">
                                        <div>
                                            <p className="text-sm font-bold text-on-surface opacity-50 line-through">11:00 AM - 12:00 PM</p>
                                            <p className="text-xs text-outline italic">Maintenance Block</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input className="sr-only peer" type="checkbox"/>
                                            <div className="w-11 h-6 bg-outline-variant/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                                <button className="w-full mt-6 py-3 px-4 border-2 border-dashed border-outline-variant text-outline rounded-xl font-medium hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined" data-icon="add">add</span>
                                    Add Time Block
                                </button>
                            </div>
                            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                                <div className="flex gap-4 items-start">
                                    <div className="p-2 bg-primary rounded-lg text-white">
                                        <span className="material-symbols-outlined" data-icon="auto_fix_high">auto_fix_high</span>
                                    </div>
                                    <div>
                                        <h6 className="font-bold text-sm text-on-surface">AI Optimizer Active</h6>
                                        <p className="text-xs text-on-surface-variant leading-relaxed">The AI is currently managing buffer times to prevent double bookings based on your transit time settings.</p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest flex justify-around items-center h-16 shadow-[0px_-4px_16px_rgba(0,0,0,0.05)] px-4 z-50">
                <a className="flex flex-col items-center gap-1 text-primary" href="#">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-[10px] font-bold">Dashboard</span>
                </a>
                <a className="flex flex-col items-center gap-1 text-outline" href="#">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="text-[10px] font-medium">Schedule</span>
                </a>
                <div className="-mt-8">
                    <button className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
                <a className="flex flex-col items-center gap-1 text-outline" href="#">
                    <span className="material-symbols-outlined">person</span>
                    <span className="text-[10px] font-medium">Clients</span>
                </a>
                <a className="flex flex-col items-center gap-1 text-outline" href="#">
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-[10px] font-medium">Settings</span>
                </a>
            </nav>
        </div>
    );
}
