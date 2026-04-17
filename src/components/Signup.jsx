import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Signup() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // Split name into first and last
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            await signUp.create({
                emailAddress: email,
                password,
                firstName,
                lastName,
            });

            // Send verification email
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err) {
            setError(err.errors ? err.errors[0].longMessage : err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status !== 'complete') {
                console.log(JSON.stringify(completeSignUp, null, 2));
            }

            if (completeSignUp.status === 'complete') {
                await setActive({ session: completeSignUp.createdSessionId });
                // Sync user profile to Supabase
                await supabase.from('profiles').upsert({
                    clerk_id: completeSignUp.createdUserId,
                    email: email,
                    name: name.trim(),
                    role: 'user',
                }, { onConflict: 'email' });
                navigate('/chat');
            }
        } catch (err) {
            setError(err.errors ? err.errors[0].longMessage : err.message);
        } finally {
            setLoading(false);
        }
    };

    if (pendingVerification) {
        return (
            <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md p-8 bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Verify your email</h2>
                    <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
                        We've sent a verification code to <strong>{email}</strong>. Please enter it below to complete your registration.
                    </p>
                    <form onSubmit={handleVerify} className="space-y-6">
                        <input
                            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button 
                            className="w-full primary-gradient text-white py-4 px-6 rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-all"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Complete Sign Up'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface text-on-surface h-screen overflow-hidden flex items-center justify-center p-6">
            <div className="w-full max-w-4xl grid lg:grid-cols-2 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xl" style={{minHeight: 0}}>
                <div className="hidden lg:flex flex-col justify-center p-10 relative overflow-hidden bg-primary text-white">
                    <div className="z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                <span className="material-symbols-outlined text-white">auto_awesome</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight">Appointly</span>
                        </div>
                        <h1 className="text-[2.5rem] font-semibold leading-tight mb-4">
                            Step into the <br/>Intelligent Atelier.
                        </h1>
                        <p className="text-base text-white/80 max-w-md">
                            Experience a digital workspace crafted for effortless capability and sophisticated service. Your journey begins here.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col justify-center px-8 py-8 bg-surface-container-lowest">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold mb-1">Create Account</h2>
                            <p className="text-on-surface-variant text-sm">Join the community of elite professionals.</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium border border-error/10">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="name">Full Name</label>
                                <input
                                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                                    id="name"
                                    placeholder="Alex Sterling"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="email">Email Address</label>
                                <input
                                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                                    id="email"
                                    placeholder="alex@atelier.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
                                    <input
                                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                                        id="password"
                                        placeholder="••••••••"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="confirm-password">Confirm</label>
                                    <input
                                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                                        id="confirm-password"
                                        placeholder="••••••••"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                className="w-full primary-gradient text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center disabled:opacity-70"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Create Account'}
                            </button>
                        </form>
                        <div className="mt-5 text-center">
                            <p className="text-sm text-on-surface-variant">
                                Already have an account?
                                <a className="text-primary font-semibold hover:underline underline-offset-4 ml-1 transition-all duration-200" href="/login">Sign in</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
