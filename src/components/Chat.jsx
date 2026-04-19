import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useUser, UserButton, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_BASE}/api`;

export default function Chat() {
    const { isLoaded, userId, getToken } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [actioningIdx, setActioningIdx] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    useEffect(() => {
        if (isLoaded && !userId) { navigate('/login'); return; }
        if (isLoaded && userId && user) {
            setMessages([{
                role: 'assistant',
                content: `Hello, ${user?.firstName || 'there'}. I'm here to help you schedule an appointment with the doctor. Could you tell me what brings you in today and when you'd like to come?`
            }]);
            getToken().then(token => {
                fetch(`${API_BASE}/api/appointments?limit=1`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            });
        }
    }, [isLoaded, userId, user]);

    const authHeaders = async () => {
        const token = await getToken();
        return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    };

    const appendFollowUp = (idx, success, successText, errorText) => {
        setMessages(prev => prev.map((m, i) =>
            i === idx ? { ...m, booking_ready: false, cancel_ready: false, reschedule_ready: false, action_done: success } : m
        ));
        setMessages(prev => [...prev, { role: 'assistant', content: success ? successText : errorText }]);
    };

    const handleConfirmBooking = async (idx, extracted) => {
        setActioningIdx(idx);
        try {
            const res = await fetch(`${API}/confirm-booking`, {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify({ date: extracted.date, time: extracted.time, service: extracted.service })
            });
            const result = await res.json();
            appendFollowUp(
                idx, result.success,
                `Your ${extracted.service} appointment is confirmed for ${extracted.date} at ${extracted.time}. See you then!`,
                `Sorry, couldn't confirm: ${result.error}`
            );
        } catch {
            appendFollowUp(idx, false, '', 'Connection error. Please try again.');
        } finally {
            setActioningIdx(null);
        }
    };

    const handleConfirmCancel = async (idx, appointmentId) => {
        setActioningIdx(idx);
        try {
            const res = await fetch(`${API}/confirm-cancel`, {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify({ appointment_id: appointmentId })
            });
            const result = await res.json();
            appendFollowUp(
                idx, result.success,
                'Your appointment has been cancelled.',
                `Sorry, couldn't cancel: ${result.error}`
            );
        } catch {
            appendFollowUp(idx, false, '', 'Connection error. Please try again.');
        } finally {
            setActioningIdx(null);
        }
    };

    const handleConfirmReschedule = async (idx, appointmentId, extracted) => {
        setActioningIdx(idx);
        try {
            const res = await fetch(`${API}/confirm-reschedule`, {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify({ appointment_id: appointmentId, date: extracted.date, time: extracted.time })
            });
            const result = await res.json();
            appendFollowUp(
                idx, result.success,
                `Your appointment has been rescheduled to ${extracted.date} at ${extracted.time}.`,
                `Sorry, couldn't reschedule: ${result.error}`
            );
        } catch {
            appendFollowUp(idx, false, '', 'Connection error. Please try again.');
        } finally {
            setActioningIdx(null);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isTyping) return;

        const userMessage = { role: 'user', content: inputText };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify({ message: inputText })
            });
            const result = await res.json();
            if (result.success) {
                const d = result.data;
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: d.reply,
                    extracted: d.extracted,
                    appointment_id: d.appointment_id,
                    booking_ready: d.booking_ready,
                    cancel_ready: d.cancel_ready,
                    reschedule_ready: d.reschedule_ready,
                }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now." }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const isActioning = (idx) => actioningIdx === idx;

    const SidebarContent = () => (
        <>
            <div className="flex items-center gap-3 px-2 py-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold text-[#191c1d] leading-tight">Appointly</h1>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">AI Booking System</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto mt-4">
                <button onClick={() => { navigate('/chat'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 bg-white text-[#4F46E5] rounded-xl shadow-sm font-semibold transition-all duration-200">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>chat_bubble</span>
                    <span className="text-sm">Schedule Assistant</span>
                </button>
                <button onClick={() => { navigate('/history'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[#191c1d]/70 hover:bg-white/50 rounded-xl transition-all duration-200">
                    <span className="material-symbols-outlined">history</span>
                    <span className="text-sm">History</span>
                </button>
            </nav>

            <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-1">
                <div className="flex items-center gap-3 px-2 py-2">
                    <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
                    <div className="flex-1 overflow-hidden text-left">
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
        </>
    );

    return (
        <div className="bg-surface text-on-surface antialiased overflow-hidden h-screen">
            <div className="flex h-full w-full">
                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/40 z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Desktop Sidebar */}
                <aside className="hidden md:flex flex-col h-full p-4 gap-2 bg-[#f3f4f5] w-64 fixed left-0 top-0 font-['Inter'] leading-relaxed z-50">
                    <SidebarContent />
                </aside>

                {/* Mobile Sidebar Drawer */}
                <aside className={`md:hidden flex flex-col h-full p-4 gap-2 bg-[#f3f4f5] w-72 fixed left-0 top-0 font-['Inter'] leading-relaxed z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent />
                </aside>

                <main className="md:ml-64 flex-1 flex flex-col h-screen relative bg-surface">
                    {/* Header */}
                    <header className="h-14 md:h-16 flex items-center px-4 md:px-8 bg-surface-container-low/50 backdrop-blur-md z-40 gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 rounded-xl hover:bg-surface-container transition-colors text-on-surface"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h2 className="text-base md:text-title-sm font-semibold text-on-surface">Schedule Assistant</h2>
                    </header>

                    {/* Messages */}
                    <section className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-12 flex flex-col gap-6 md:gap-8 pb-32">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 md:gap-4 max-w-full md:max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse ml-auto' : ''}`}>
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-surface-container-lowest shadow-sm border border-outline-variant/10'}`}>
                                    <span className={`material-symbols-outlined text-[18px] md:text-[20px] ${msg.role === 'user' ? 'text-on-primary' : 'text-primary'}`} style={msg.role !== 'user' ? {fontVariationSettings: "'FILL' 1"} : {}}>
                                        {msg.role === 'user' ? 'person' : 'auto_awesome'}
                                    </span>
                                </div>
                                <div className="space-y-3 max-w-[85%]">
                                    <div className={`p-4 md:p-5 rounded-xl shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary' : 'bg-surface-container-lowest text-on-surface border border-outline-variant/5'}`}>
                                        <p className="text-sm md:text-body-lg">{msg.content}</p>
                                    </div>

                                    {msg.booking_ready && (
                                        <button
                                            onClick={() => handleConfirmBooking(idx, msg.extracted)}
                                            disabled={isActioning(idx)}
                                            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-full flex items-center gap-2 hover:bg-primary/90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {isActioning(idx) ? 'hourglass_empty' : 'calendar_today'}
                                            </span>
                                            {isActioning(idx) ? 'Confirming...' : `Confirm ${msg.extracted?.service || 'Appointment'}`}
                                        </button>
                                    )}

                                    {msg.cancel_ready && (
                                        <button
                                            onClick={() => handleConfirmCancel(idx, msg.appointment_id)}
                                            disabled={isActioning(idx)}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-full flex items-center gap-2 hover:bg-red-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {isActioning(idx) ? 'hourglass_empty' : 'cancel'}
                                            </span>
                                            {isActioning(idx) ? 'Cancelling...' : 'Confirm Cancellation'}
                                        </button>
                                    )}

                                    {msg.reschedule_ready && (
                                        <button
                                            onClick={() => handleConfirmReschedule(idx, msg.appointment_id, msg.extracted)}
                                            disabled={isActioning(idx)}
                                            className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-full flex items-center gap-2 hover:bg-amber-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {isActioning(idx) ? 'hourglass_empty' : 'edit_calendar'}
                                            </span>
                                            {isActioning(idx) ? 'Rescheduling...' : `Confirm Reschedule to ${msg.extracted?.time}`}
                                        </button>
                                    )}

                                    {msg.action_done && (
                                        <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                                            <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                                            Done!
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-3 md:gap-4 max-w-2xl">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-center shrink-0 border border-outline-variant/10">
                                    <span className="material-symbols-outlined text-primary animate-pulse text-[18px]">auto_awesome</span>
                                </div>
                                <div className="px-5 py-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/5 flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div>
                                    <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div>
                                    <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </section>

                    {/* Input Footer */}
                    <footer className="absolute bottom-0 left-0 w-full p-4 md:p-8 pt-0">
                        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition-opacity"></div>
                            <div className="relative flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/10">
                                <input
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline/60 outline-none text-sm md:text-base"
                                    placeholder="Describe your reason for visit and when you'd like to come in..."
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={isTyping}
                                />
                                <button
                                    className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    type="submit"
                                    disabled={!inputText.trim() || isTyping}
                                >
                                    <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
                                </button>
                            </div>
                        </form>
                    </footer>
                </main>
            </div>
        </div>
    );
}
