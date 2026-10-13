import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Files,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { saveContent, deleteContent } from '../../lib/supabase';
import { formatDate } from '../../utils/formatters';

export function AdminContentPage() {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const loadContent = () => {
    setLoading(true);
    const all = JSON.parse(localStorage.getItem('cshub_content') || '[]');
    setContentList(all);
    setLoading(false);
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleToggleFeatured = async (item) => {
    await saveContent({ ...item, is_featured: !item.is_featured });
    loadContent();
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    await saveContent({
      ...item,
      status: nextStatus,
      published_at: nextStatus === 'published' ? new Date().toISOString() : item.published_at,
    });
    loadContent();
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteContent(id);
      loadContent();
    }
  };

  const filtered = contentList.filter((item) => {
    if (selectedType && item.content_type !== selectedType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.contributor_name && item.contributor_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-navy-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Files className="w-7 h-7 text-teal-500" />
            Content Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author, edit, publish, or archive technical articles, tools, and downloadable materials.
          </p>
        </div>

        <Link to="/admin/content/new">
          <Button variant="primary" size="sm" icon={Plus}>
            New Content Record
          </Button>
        </Link>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['', 'article', 'resource', 'tool', 'opportunity', 'announcement'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                selectedType === type
                  ? 'bg-navy-900 text-white dark:bg-teal-500 dark:text-navy-950 font-bold'
                  : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-800'
              }`}
            >
              {type || 'All Formats'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-950/60 border-b border-slate-200 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Title & Metadata</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Featured</th>
                <th className="py-3 px-4 font-semibold">Views</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors"
                >
                  <td className="py-3 px-4 max-w-sm truncate">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      By {item.contributor_name || 'Admin'} • Slug: /{item.slug}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="teal" size="sm" className="capitalize">
                      {item.content_type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        item.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-navy-800 dark:text-slate-300'
                      }`}
                      title="Click to toggle published / draft status"
                    >
                      {item.status.toUpperCase()}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        item.is_featured
                          ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400'
                          : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-300'
                      }`}
                      title={item.is_featured ? 'Featured on homepage' : 'Not featured'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${item.is_featured ? 'fill-amber-400' : ''}`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {item.view_count || 0}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {formatDate(item.published_at || item.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/admin/content/${item.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        title="Edit record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
