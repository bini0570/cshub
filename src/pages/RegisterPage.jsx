import React from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle2, ArrowRight, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/common/Logo';

export function RegisterPage() {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'cshub_bot';
  const telegramBotLink = `https://t.me/${botUsername}`;

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Logo size="lg" link={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Student Registration
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Student registration is managed seamlessly through our official Telegram Bot
          </p>
        </div>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 rounded-xl">
            <div className="p-2.5 bg-teal-600 text-white rounded-lg shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register via @{botUsername}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Fast student verification without passwords to remember.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              How it works:
            </h4>
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>Open the Telegram Bot and send <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-teal-600 dark:text-teal-400">/start</code></span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>Type <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-teal-600 dark:text-teal-400">/register</code> and provide your Full Name, Student ID, and Department</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-[11px] shrink-0">
                  3
                </span>
                <span>The bot generates a secure 6-digit login code and direct link to sign in</span>
              </div>
            </div>
          </div>

          <a
            href={telegramBotLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold">
              <Send className="w-4 h-4" />
              Open Telegram Bot to Register
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </a>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            Already registered on Telegram?{' '}
            <Link to="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              Enter your login code
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
