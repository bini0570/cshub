import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Eye,
  User,
  ArrowLeft,
  Flag,
  Share2,
} from 'lucide-react';
import { getContentBySlug, trackContentView, getPublishedContent } from '../lib/supabase';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BookmarkButton } from '../features/bookmarks/BookmarkButton';
import { ShareButton } from '../components/common/ShareButton';
import { RichTextViewer } from '../components/common/RichTextViewer';
import { ContentCard } from '../features/content/ContentCard';
import { formatDate, calculateReadingTime } from '../utils/formatters';

export function ArticleDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        setLoading(true);
        const item = await getContentBySlug(slug);
        setArticle(item);

        if (item) {
          trackContentView(item.id);

          const rel = await getPublishedContent({ type: 'article', limit: 3 });
          setRelated(rel.filter((r) => r.id !== item.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading article...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Article Not Found
        </h2>
        <p className="text-sm text-slate-500">
          The requested guide or article could not be found.
        </p>
        <Link to="/articles">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Articles
          </Button>
        </Link>
      </div>
    );
  }

  const readingTime = calculateReadingTime(article.body || article.description);

  return (
    <article className="space-y-8 max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Articles', href: '/articles' },
          { label: article.title },
        ]}
      />

      {/* Article Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal" size="sm" className="capitalize">
            {article.content_type}
          </Badge>
          {article.category_name && (
            <Badge variant="default" size="sm">
              {article.category_name}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {article.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          {article.description}
        </p>

        {/* Attribution Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-navy-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {article.contributor_name || 'CS Hub Author'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(article.published_at || article.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {readingTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {article.view_count || 0} views
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BookmarkButton contentId={article.id} />
            <ShareButton title={article.title} />
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {article.thumbnail_path && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
          <img
            src={article.thumbnail_path}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Body */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-10 shadow-xs">
        <RichTextViewer content={article.body || '<p>No content provided.</p>'} />
      </div>

      {/* Article Tags & Report/Correction Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-navy-900/60 border border-slate-200 dark:border-navy-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Tags:</span>
          {article.tags && article.tags.length > 0 ? (
            article.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-slate-400">None</span>
          )}
        </div>

        <Link
          to={`/contact?report=${encodeURIComponent(article.slug)}`}
          className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Report error or suggest edit</span>
        </Link>
      </div>

      {/* Related Content */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-slate-200 dark:border-navy-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Related Guides & Articles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
