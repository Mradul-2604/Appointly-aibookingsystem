import React, { useEffect } from 'react';
import { Hero } from "@/components/ui/animated-hero";
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) navigate('/chat');
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="absolute top-0 left-0 w-full z-10 px-8 py-6 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-on-primary">auto_awesome</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-on-surface">Appointly</span>
        </div>
      </header>
      <main>
        <Hero />
      </main>
      <footer className="absolute bottom-4 right-8 z-10">
        <a href="/login" className="text-xs font-semibold text-outline hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">shield_person</span>
          Admin Access
        </a>
      </footer>
    </div>
  );
}
