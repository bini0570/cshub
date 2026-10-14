import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Wrench,
  Briefcase,
  Bell,
  Eye,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BookmarkButton } from '../bookmarks/BookmarkButton';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

export function ContentCard({ item }) {
  if (!item) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'article':
        return FileText;
      case 'resource':
        return Download;
      case 'tool':
        return Wrench;
      case 'opportunity':
        return Briefcase;
      default:
        return Bell;
    }
  };

  const getDetailUrl = (type, slug) => {
    switch (type) {
      case 'article':
        return `/articles/${slug}`;
      case 'resource':
        return `/resources/${slug}`;
      case 'tool':
        return `/tools/${slug}`;
      case 'opportunity':
        return `/opportunities/${slug}`;
      default:
        return `/articles/${slug}`;
    }
  };

  const detailUrl = getDetailUrl(item.content_type, item.slug);
  const TypeIcon = getTypeIcon(item.content_type);

  return (
    <Card hover className="flex flex-col h-full group">
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-navy-800">
        {item.thumbnail_path ? (
          <img
            src={item.thumbnail_path}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 text-teal-400">
            <TypeIcon className="w-12 h-12 opacity-40" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge variant="navy" size="sm" className="backdrop-blur-md bg-navy-900/90 capitalize shadow-xs">
            <TypeIcon className="w-3 h-3 mr-1 text-teal-400" />
            {item.content_type}
          </Badge>
          {item.is_featured && (
            <Badge variant="teal" size="sm" className="font-bold">
              Featured
            </Badge>
          )}
        </div>

        {/* Bookmark Trigger */}
        <div className="absolute top-3 right-3">
          <BookmarkButton contentId={item.id} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          {item.category_name && (
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 tracking-wide uppercase block mb-1.5">
              {item.category_name}
            </span>
          )}

          {/* Title */}
          <Link to={detailUrl}>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-snug">
              {item.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Meta Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
            <span className="truncate font-medium text-slate-700 dark:text-slate-300">
              {item.contributor_name || 'CS Hub Team'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatRelativeTime(item.published_at || item.created_at)}
            </span>
            {item.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.view_count}
              </span>
            )}
            {item.download_count > 0 && (
              <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
                <Download className="w-3 h-3" />
                {item.download_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
