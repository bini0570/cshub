import React, { useMemo } from 'react';
import { sanitizeHtml } from '../../utils/sanitize';

export function RichTextViewer({ content, className = '' }) {
  const sanitized = useMemo(() => sanitizeHtml(content), [content]);

  if (!content) return null;

  return (
    <div
      className={`rich-text-content space-y-4 text-slate-800 dark:text-slate-200 leading-relaxed text-base [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy-900 dark:[&_h2]:text-slate-100 [&_h2]:pt-4 [&_h2]:border-b [&_h2]:border-slate-100 dark:[&_h2]:border-navy-800 [&_h2]:pb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-200 [&_h3]:pt-2 [&_p]:text-slate-700 dark:[&_p]:text-slate-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_li]:text-slate-700 dark:[&_li]:text-slate-300 [&_a]:text-teal-600 dark:[&_a]:text-teal-400 [&_a]:underline [&_a]:underline-offset-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-slate-100 dark:[&_code]:bg-navy-800 [&_code]:text-teal-700 dark:[&_code]:text-teal-300 [&_code]:font-mono [&_code]:text-sm [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:bg-navy-950 [&_pre]:text-slate-100 [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-400 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
