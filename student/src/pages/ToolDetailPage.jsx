import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  Calendar,
  Eye,
  User,
  ArrowLeft,
  Wrench,
} from 'lucide-react';
import { getContentBySlug, trackContentView, getPublishedContent } from '../lib/supabase';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BookmarkButton } from '../features/bookmarks/BookmarkButton';
import { ShareButton } from '../components/common/ShareButton';
import { RichTextViewer } from '../components/common/RichTextViewer';
import { ContentCard } from '../features/content/ContentCard';
import { formatDate } from '../utils/formatters';

export function ToolDetailPage() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTool() {
      try {
        setLoading(true);
        const item = await getContentBySlug(slug);
        setTool(item);

        if (item) {
          trackContentView(item.id);
          const rel = await getPublishedContent({ type: 'tool', limit: 3 });
          setRelated(rel.filter((r) => r.id !== item.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load tool:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTool();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading tool details...
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Tool Not Found
        </h2>
        <p className="text-sm text-slate-500">
          The requested tool listing could not be found.
        </p>
        <Link to="/tools">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Tools
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Tools', href: '/tools' },
          { label: tool.title },
        ]}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal" size="sm" className="capitalize">
            {tool.content_type}
          </Badge>
          {tool.category_name && (
            <Badge variant="default" size="sm">
              {tool.category_name}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {tool.title}
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {tool.description}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-navy-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {tool.contributor_name || 'CS Hub Curators'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(tool.published_at || tool.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {tool.view_count || 0} views
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BookmarkButton contentId={tool.id} />
            <ShareButton title={tool.title} />
          </div>
        </div>
      </div>

      {/* Outbound Launch Card */}
      {tool.external_url && (
        <div className="rounded-2xl p-6 sm:p-8 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800 shadow-md">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> Ready to Launch
            </span>
            <h3 className="text-lg font-bold">Access the Live Tool</h3>
            <p className="text-xs text-slate-400">
              Opens the verified official developer portal in a secure new tab.
            </p>
          </div>

          <a
            href={tool.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="primary" size="lg" icon={ExternalLink} className="w-full sm:w-auto">
              Launch Tool
            </Button>
          </a>
        </div>
      )}

      {/* Body Details */}
      {tool.body && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Tool Overview & Features
          </h2>
          <RichTextViewer content={tool.body} />
        </div>
      )}

      {/* Related Tools */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-slate-200 dark:border-navy-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Related Developer Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
