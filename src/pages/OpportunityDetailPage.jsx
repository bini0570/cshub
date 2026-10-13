import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ExternalLink,
  Calendar,
  Eye,
  User,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
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

export function OpportunityDetailPage() {
  const { slug } = useParams();
  const [opp, setOpp] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOpportunity() {
      try {
        setLoading(true);
        const item = await getContentBySlug(slug);
        setOpp(item);

        if (item) {
          trackContentView(item.id);
          const rel = await getPublishedContent({ type: 'opportunity', limit: 3 });
          setRelated(rel.filter((r) => r.id !== item.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load opportunity:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOpportunity();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading opportunity details...
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Opportunity Not Found
        </h2>
        <p className="text-sm text-slate-500">
          This opportunity may have concluded or is no longer accepting applications.
        </p>
        <Link to="/opportunities">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Opportunities
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Opportunities', href: '/opportunities' },
          { label: opp.title },
        ]}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal" size="sm" className="capitalize">
            {opp.content_type}
          </Badge>
          {opp.category_name && (
            <Badge variant="default" size="sm">
              {opp.category_name}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {opp.title}
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {opp.description}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-navy-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {opp.contributor_name || 'Opportunity Advisory'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Posted {formatDate(opp.published_at || opp.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {opp.view_count || 0} views
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BookmarkButton contentId={opp.id} />
            <ShareButton title={opp.title} />
          </div>
        </div>
      </div>

      {/* Application CTA Card */}
      {opp.external_url && (
        <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-teal-900 via-navy-900 to-navy-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-teal-800 shadow-xl">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Official Application
            </span>
            <h3 className="text-xl font-bold">Apply on Program Website</h3>
            <p className="text-xs text-slate-300 max-w-md">
              Applications are reviewed directly by the sponsoring organization or foundation.
            </p>
          </div>

          <a
            href={opp.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="primary" size="lg" icon={ExternalLink} className="w-full sm:w-auto">
              Open Application Portal
            </Button>
          </a>
        </div>
      )}

      {/* Body Details */}
      {opp.body && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Eligibility & Application Guidelines
          </h2>
          <RichTextViewer content={opp.body} />
        </div>
      )}

      {/* Related Opportunities */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-slate-200 dark:border-navy-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Similar Student Opportunities
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
