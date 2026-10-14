import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Calendar,
  Eye,
  FileCheck,
  User,
  ArrowLeft,
  Share2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { getContentBySlug, trackContentView, trackContentDownload, getPublishedContent } from '../lib/supabase';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BookmarkButton } from '../features/bookmarks/BookmarkButton';
import { ShareButton } from '../components/common/ShareButton';
import { RichTextViewer } from '../components/common/RichTextViewer';
import { ContentCard } from '../features/content/ContentCard';
import { formatDate, formatBytes } from '../utils/formatters';

export function ResourceDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadResource() {
      try {
        setLoading(true);
        const item = await getContentBySlug(slug);
        setResource(item);

        if (item) {
          // Track view count
          trackContentView(item.id);

          // Load related resources
          const rel = await getPublishedContent({ type: 'resource', limit: 3 });
          setRelated(rel.filter((r) => r.id !== item.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load resource:', err);
      } finally {
        setLoading(false);
      }
    }

    loadResource();
  }, [slug]);

  const handleDownload = async () => {
    if (!resource) return;
    setDownloading(true);
    try {
      await trackContentDownload(resource.id);
      // If external or attached file
      if (resource.external_url) {
        window.open(resource.external_url, '_blank', 'noopener,noreferrer');
      } else {
        // Download simulation for demonstrative resources
        const blob = new Blob(
          [`CS Hub Resource: ${resource.title}\n\nDescription:\n${resource.description}\n\nDownloaded from CS Hub.`],
          { type: 'text/plain' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resource.file_info?.name || `${resource.slug}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading resource details...
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Resource Not Found
        </h2>
        <p className="text-sm text-slate-500">
          The requested resource may have been unpublished or removed.
        </p>
        <Link to="/resources">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Resource Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Resources', href: '/resources' },
          { label: resource.title },
        ]}
      />

      {/* Resource Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal" size="sm" className="capitalize">
            {resource.content_type}
          </Badge>
          {resource.category_name && (
            <Badge variant="default" size="sm">
              {resource.category_name}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {resource.title}
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {resource.description}
        </p>

        {/* Metadata & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-navy-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {resource.contributor_name || 'CS Hub Contributor'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(resource.published_at || resource.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {resource.view_count || 0} views
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BookmarkButton contentId={resource.id} />
            <ShareButton title={resource.title} />
          </div>
        </div>
      </div>

      {/* Download Action Card */}
      <Card className="bg-gradient-to-br from-teal-500/10 via-slate-50 to-white dark:from-teal-950/40 dark:via-navy-900 dark:to-navy-900 border-teal-500/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" /> Downloadable Package
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {resource.file_info?.name || `${resource.slug}.pdf`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format: {resource.file_info?.mime || 'application/pdf'} • Approx Size:{' '}
              {formatBytes(resource.file_info?.size || 4200000)}
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            isLoading={downloading}
            icon={Download}
            className="w-full sm:w-auto shadow-md"
          >
            Download Resource
          </Button>
        </div>
      </Card>

      {/* Detailed Body / Notes */}
      {resource.body && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Study Guide Overview & Usage Notes
          </h2>
          <RichTextViewer content={resource.body} />
        </div>
      )}

      {/* External Link if available */}
      {resource.external_url && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300">
            Source repository / external mirror:
          </span>
          <a
            href={resource.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            {resource.external_url} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Related Resources */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-slate-200 dark:border-navy-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Related Study Materials
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
