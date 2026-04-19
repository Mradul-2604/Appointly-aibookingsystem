import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleGoogleSignIn = () => {
        if (!isLoaded) return;
        signIn.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/auth-redirect',
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                navigate('/auth-redirect');
            } else if (result.status === 'needs_second_factor') {
                // Clerk wants an email code - prepare it and show code screen
                await signIn.prepareSecondFactor({ strategy: 'email_code' });
                setVerifying(true);
            } else if (result.status === 'needs_first_factor') {
                // Try email_code strategy as first factor
                const emailCodeFactor = result.supportedFirstFactors?.find(
                    f => f.strategy === 'email_code'
                );
                if (emailCodeFactor) {
                    await signIn.prepareFirstFactor({
                        strategy: 'email_code',
                        emailAddressId: emailCodeFactor.emailAddressId,
                    });
                    setVerifying(true);
                } else {
                    setError('This account requires a different sign-in method. Try Google sign-in.');
                }
            }
        } catch (err) {
            setError(err.errors ? err.errors[0].longMessage : err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setLoading(true);
        setError(null);
        try {
            const result = await signIn.attemptSecondFactor({
                strategy: 'email_code',
                code,
            });
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                navigate('/auth-redirect');
            } else {
                setError('Verification failed. Please try again.');
            }
        } catch (err) {
            // Try first factor if second factor fails
            try {
                const result = await signIn.attemptFirstFactor({
                    strategy: 'email_code',
                    code,
                });
                if (result.status === 'complete') {
                    await setActive({ session: result.createdSessionId });
                    navigate('/auth-redirect');
                } else {
                    setError('Verification failed. Please try again.');
                }
            } catch (err2) {
                setError(err2.errors ? err2.errors[0].longMessage : err2.message);
            }
        } finally {
            setLoading(false);
        }
    };


    // Show verification code screen if Clerk needs a code
    if (verifying) {
        return (
            <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md p-8 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/10 text-center">
                    <div className="w-12 h-12 primary-gradient rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <span className="material-symbols-outlined text-on-primary">mark_email_unread</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-on-surface mb-2">Check your email</h2>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                        We've sent a verification code to <strong>{email}</strong>. Please enter it below to continue.
                    </p>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                        <input
                            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            autoFocus
                        />
                        <button
                            className="w-full primary-gradient text-on-primary font-semibold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-70"
                            type="submit"
                            disabled={loading || !code}
                        >
                            {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                    </form>
                    <button
                        onClick={() => { setVerifying(false); setCode(''); setError(null); }}
                        className="mt-4 text-sm text-outline hover:text-on-surface transition-colors"
                    >
                        ← Back to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-4 sm:p-6">
            <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xl">
                <section className="hidden lg:flex flex-col justify-center p-10 bg-surface-container-low relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
                    <div className="z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-on-primary">auto_awesome</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-on-surface">Appointly</span>
                        </div>
                        <div className="max-w-md">
                            <h1 className="text-[2.5rem] font-semibold leading-tight text-on-surface mb-4">
                                Effortless scheduling, powered by <span className="text-primary">intelligence.</span>
                            </h1>
                            <p className="text-base text-on-surface-variant leading-relaxed">
                                Experience a new standard of booking. Sophisticated, calm, and effortlessly capable AI management for your daily workflow.
                            </p>
                        </div>
                    </div>
                </section>
                <section className="flex flex-col justify-center items-center px-6 py-10 sm:px-8 bg-surface-container-lowest">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-3 mb-8 self-start">
                        <div className="w-9 h-9 primary-gradient rounded-xl flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-on-primary text-[18px]">auto_awesome</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-on-surface">Appointly</span>
                    </div>
                    <div className="w-full max-w-[400px]">
                        <header className="mb-6">
                            <h2 className="text-2xl font-semibold text-on-surface mb-1">Welcome back</h2>
                            <p className="text-on-surface-variant text-sm">Please enter your details to sign in.</p>
                        </header>

                        {error && (
                            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium border border-error/10">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="email">Email Address</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">mail</span>
                                    <input
                                        className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none text-on-surface placeholder:text-outline-variant"
                                        id="email"
                                        placeholder="name@company.com"
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="password">Password</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">lock</span>
                                    <input
                                        className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none text-on-surface placeholder:text-outline-variant"
                                        id="password"
                                        placeholder="••••••••"
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                className="w-full primary-gradient text-on-primary font-semibold py-3 rounded-xl shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-outline-variant/20" />
                            <span className="text-xs text-outline-variant font-medium">or</span>
                            <div className="flex-1 h-px bg-outline-variant/20" />
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={!isLoaded}
                            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-surface-container-low border border-outline-variant/20 rounded-xl text-on-surface font-medium hover:bg-surface-container transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>

                        <div className="mt-5 text-center">
                            <p className="text-on-surface-variant text-sm">
                                Don't have an account?
                                <Link className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 ml-1" to="/signup">Create account</Link>
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}



