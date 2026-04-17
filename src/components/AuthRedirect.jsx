import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthRedirect() {
    const { isLoaded, user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoaded || !user) return;
        const redirect = async () => {
            const email = user.primaryEmailAddress?.emailAddress;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('email', email)
                    .single();
                if (data?.role === 'admin') navigate('/admin', { replace: true });
                else navigate('/chat', { replace: true });
            } catch {
                navigate('/chat', { replace: true });
            }
        };
        redirect();
    }, [isLoaded, user]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="flex flex-col items-center gap-3 text-outline">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Signing you in...</p>
            </div>
        </div>
    );
}
