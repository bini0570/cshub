import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertTriangle, Send } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearchModal } from '../../features/search/GlobalSearchModal';
import { useAuth } from '../../context/AuthContext';

export function AppLayout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { telegramUnregistered, isTelegramWebApp } = useAuth();
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'Boditibingobot';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors pb-14 sm:pb-0">
      {telegramUnregistered && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Please complete phone verification in the bot to unlock full student account access.</span>
          </div>
          <button
            onClick={() => {
              if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.close();
              } else {
                window.open(`https://t.me/${botUsername}`, '_blank');
              }
            }}
            className="px-2.5 py-1 bg-slate-950 text-white rounded text-[11px] font-bold shrink-0 hover:bg-slate-800 flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            Verify in Bot
          </button>
        </div>
      )}

      <Navbar onOpenSearch={() => setIsSearchOpen(true)} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Hide footer inside Telegram Mini App to maximize screen space */}
      {!isTelegramWebApp && <Footer />}

      <MobileBottomNav onOpenSearch={() => setIsSearchOpen(true)} />

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default AppLayout;
