import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Button } from '../ui/Button';

export function ShareButton({ title, text, url = window.location.href, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'CS Hub Resource',
          text: text || 'Check out this Computer Science resource on CS Hub',
          url,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to copy clipboard', err);
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard write failed
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={`relative ${className}`}
      title="Share or copy link"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Share</span>
        </>
      )}
    </Button>
  );
}
