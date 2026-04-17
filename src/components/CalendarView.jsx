import React, { useEffect } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function CalendarView() {
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
        <div className="bg-background text-on-surface">
            <nav className="flex justify-between items-center w-full px-8 h-16 max-w-full mx-auto bg-surface-container-low font-['Inter'] antialiased fixed top-0 z-50">
                <div className="flex items-center gap-8">
                    <span className="text-xl font-semibold tracking-tight text-[#191c1d] dark:text-slate-100">Fluid Concierge</span>
                    <div className="hidden md:flex items-center gap-6">
                        <Link className="text-[#191c1d]/60 font-medium hover:text-[#4F46E5] transition-colors duration-200" to="/admin">Dashboard</Link>
                        <Link className="text-[#4F46E5] font-semibold border-b-2 border-[#4F46E5] pb-1 hover:text-[#4F46E5] transition-colors duration-200" to="/calendar">Schedule</Link>
                        <a className="text-[#191c1d]/60 font-medium hover:text-[#4F46E5] transition-colors duration-200" href="#">Clients</a>
                        <a className="text-[#191c1d]/60 font-medium hover:text-[#4F46E5] transition-colors duration-200" href="#">Settings</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">notifications</button>
                    <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">help_outline</button>
                    <button className="bg-primary-container text-white px-5 py-2 rounded-xl text-sm font-semibold active:scale-90 transition-transform">New Booking</button>
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
                    </div>
                </div>
            </nav>
            <div className="flex pt-16">
                <aside className="flex flex-col h-[calc(100vh-64px)] w-64 fixed left-0 p-4 gap-2 bg-gradient-to-r from-[#f3f4f5] to-[#f8f9fa] font-['Inter'] leading-relaxed hidden lg:flex">
                    <div className="mb-6 px-2">
                        <h2 className="text-lg font-bold text-[#191c1d]">The Atelier</h2>
                        <p className="text-xs text-on-surface-variant/60">AI Booking System</p>
                    </div>
                    <Link className="flex items-center gap-3 p-3 text-[#4F46E5] bg-white rounded-xl shadow-sm font-semibold hover:translate-x-1 transition-all duration-200" to="/chat">
                        <span className="material-symbols-outlined">chat_bubble</span>
                        <span>Concierge</span>
                    </Link>
                    <button className="flex items-center gap-3 p-3 text-[#191c1d]/70 hover:bg-white/50 rounded-xl hover:translate-x-1 transition-all duration-200">
                        <span className="material-symbols-outlined">history</span>
                        <span>History</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 text-[#191c1d]/70 hover:bg-white/50 rounded-xl hover:translate-x-1 transition-all duration-200">
                        <span className="material-symbols-outlined">bar_chart</span>
                        <span>Analytics</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 text-[#191c1d]/70 hover:bg-white/50 rounded-xl hover:translate-x-1 transition-all duration-200">
                        <span className="material-symbols-outlined">group</span>
                        <span>Team</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 text-[#191c1d]/70 hover:bg-white/50 rounded-xl hover:translate-x-1 transition-all duration-200">
                        <span className="material-symbols-outlined">auto_stories</span>
                        <span>Library</span>
                    </button>
                    <div className="mt-auto flex flex-col gap-2">
                        <button className="bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:opacity-80 transition-opacity">
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>add</span>
                            New Chat
                        </button>
                        <div className="pt-4 flex flex-col gap-1 border-t border-outline-variant/10">
                            <button className="flex items-center gap-3 p-3 text-[#191c1d]/70 hover:bg-white/50 rounded-xl hover:translate-x-1 transition-all duration-200">
                                <span className="material-symbols-outlined">contact_support</span>
                                <span>Support</span>
                            </button>
                            <button className="flex items-center gap-3 p-3 text-[#191c1d]/70 hover:bg-white/50 rounded-xl hover:translate-x-1 transition-all duration-200">
                                <span className="material-symbols-outlined">settings</span>
                                <span>Settings</span>
                            </button>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 ml-0 lg:ml-64 p-8 bg-surface">
                    <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div className="max-w-2xl">
                            <h1 className="text-[2.75rem] font-semibold leading-tight text-on-surface tracking-tight mb-2">October 2024</h1>
                            <p className="text-on-surface-variant/70 text-lg">Manage your atelier schedule and AI-orchestrated appointments.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-surface-container-low p-1.5 rounded-xl flex items-center shadow-inner">
                                <button className="px-6 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Weekly</button>
                                <button className="px-6 py-2 rounded-lg text-sm font-semibold bg-surface-container-lowest text-primary shadow-sm">Monthly</button>
                            </div>
                            <div className="flex items-center bg-surface-container-low rounded-xl p-1">
                                <button className="p-2 hover:text-primary transition-colors material-symbols-outlined">chevron_left</button>
                                <button className="p-2 hover:text-primary transition-colors material-symbols-outlined">chevron_right</button>
                            </div>
                        </div>
                    </header>
                    <div className="grid grid-cols-7 gap-px bg-outline-variant/10 rounded-xl overflow-hidden shadow-sm border border-outline-variant/5">
                        <div className="bg-surface-container-lowest p-4 text-center border-b border-outline-variant/10"><span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Mon</span></div>
                        <div className="bg-surface-container-lowest p-4 text-center border-b border-outline-variant/10"><span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tue</span></div>
                        <div className="bg-surface-container-lowest p-4 text-center border-b border-outline-variant/10"><span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Wed</span></div>
                        <div className="bg-surface-container-lowest p-4 text-center border-b border-outline-variant/10"><span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Thu</span></div>
                        <div className="bg-surface-container-lowest p-4 text-center border-b border-outline-variant/10"><span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Fri</span></div>
                        <div className="bg-surface-container-lowest p-4 text-center border-b border-outline-variant/10"><span className="text-xs font-bold text-tertiary uppercase tracking-widest">Sat</span></div>
                        <div className="bg-surface-container-lowest p-4 text-center border-b border-outline-variant/10"><span className="text-xs font-bold text-tertiary uppercase tracking-widest">Sun</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-30 text-right"><span className="text-sm font-medium">27</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-30 text-right"><span className="text-sm font-medium">28</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-30 text-right"><span className="text-sm font-medium">29</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 opacity-30 text-right"><span className="text-sm font-medium">30</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">1</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-tertiary/10 text-on-tertiary-fixed-variant px-2 py-1 rounded-md font-semibold truncate">Available: 4 Slots</div>
                            </div>
                        </div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">2</span>
                        </div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">3</span>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">4</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-semibold truncate flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Booked: 10am
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">5</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-primary-container text-white px-2 py-1 rounded-md font-semibold truncate">Vogue Editorial</div>
                                <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-semibold truncate">Booked: 2pm</div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right relative group">
                            <span className="text-sm font-semibold">6</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-tertiary/10 text-on-tertiary-fixed-variant px-2 py-1 rounded-md font-semibold truncate">Available: 8 Slots</div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/10 p-5 z-20 hidden group-hover:block backdrop-blur-xl bg-opacity-95">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-on-surface">October 6, 2024</h4>
                                        <p className="text-xs text-on-surface-variant">Wednesday Atelier View</p>
                                    </div>
                                    <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                                        <span className="text-xs font-medium">09:00 — 10:30</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-outline-variant/30 rounded text-on-surface-variant font-bold">UNAVAILABLE</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg border border-primary/20 bg-primary/5">
                                        <span className="text-xs font-medium text-primary">11:00 — 12:30</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-primary text-white rounded font-bold">BOOKED</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-tertiary/5 border border-tertiary/20">
                                        <span className="text-xs font-medium text-on-tertiary-fixed-variant">14:00 — 15:30</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-tertiary text-white rounded font-bold">AVAILABLE</span>
                                    </div>
                                </div>
                                <button className="w-full mt-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">Quick Reserve</button>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">7</span>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">8</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-tertiary/10 text-on-tertiary-fixed-variant px-2 py-1 rounded-md font-semibold truncate">Available: 2 Slots</div>
                            </div>
                        </div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">9</span>
                        </div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">10</span>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right border-l-4 border-primary">
                            <span className="text-sm font-extrabold text-primary">11</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-primary-container text-white px-2 py-1 rounded-md font-semibold truncate">Client: Elena Rossi</div>
                                <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-semibold truncate">9:00 AM Call</div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">12</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-outline-variant/20 text-on-surface-variant px-2 py-1 rounded-md font-semibold truncate italic">Studio Maintenance</div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">13</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">14</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-tertiary/10 text-on-tertiary-fixed-variant px-2 py-1 rounded-md font-semibold truncate">Available: 6 Slots</div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">15</span></div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">16</span></div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">17</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">18</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">19</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right">
                            <span className="text-sm font-semibold">20</span>
                            <div className="mt-2 space-y-1 text-left">
                                <div className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-semibold truncate">Fully Booked</div>
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">21</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">22</span></div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">23</span></div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">24</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">25</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">26</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">27</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">28</span></div>
                        <div className="bg-surface-container-lowest min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">29</span></div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">30</span></div>
                        <div className="bg-surface-container-low min-h-[140px] p-4 text-right"><span className="text-sm font-semibold">31</span></div>
                    </div>
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-6 p-6 bg-surface-container-lowest rounded-xl shadow-sm">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                                <span className="text-sm font-medium text-on-surface-variant">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                <span className="text-sm font-medium text-on-surface-variant">Booked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-outline-variant/60"></div>
                                <span className="text-sm font-medium text-on-surface-variant">Unavailable</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Monthly Utilization</p>
                                <p className="text-xl font-semibold text-primary">78.4%</p>
                            </div>
                            <button className="bg-surface-container-high px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
                                <span className="material-symbols-outlined text-sm">download</span>
                                Export Report
                            </button>
                        </div>
                    </div>
                </main>
            </div>
            <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform">
                <span className="material-symbols-outlined">add</span>
            </button>
        </div>
    );
}
