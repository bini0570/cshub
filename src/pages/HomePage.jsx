import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Wrench,
  Briefcase,
  ArrowRight,
  Sparkles,
  Search,
  BookOpen,
  Code,
  Shield,
  Layers,
  Terminal,
} from 'lucide-react';
import { getPublishedContent, getCategories } from '../lib/supabase';
import { ContentCard } from '../features/content/ContentCard';
import { Button } from '../components/ui/Button';
import { ContentCardSkeleton } from '../components/ui/Skeleton';
import { AcademicStudyMaterials } from '../components/home/AcademicStudyMaterials';
import { QuickQuizWidget } from '../components/home/QuickQuizWidget';

export function HomePage() {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [topTools, setTopTools] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, featured, resources, articles, tools, opps] = await Promise.all([
          getCategories(),
          getPublishedContent({ isFeatured: true, limit: 3 }),
          getPublishedContent({ type: 'resource', limit: 3 }),
          getPublishedContent({ type: 'article', limit: 3 }),
          getPublishedContent({ type: 'tool', limit: 3 }),
          getPublishedContent({ type: 'opportunity', limit: 3 }),
        ]);

        setCategories(cats || []);
        setFeaturedItems(featured || []);
        setRecentResources(resources || []);
        setLatestArticles(articles || []);
        setTopTools(tools || []);
        setOpportunities(opps || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 text-white p-6 sm:p-12 lg:p-16 border border-navy-800 shadow-2xl">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>The Independent Computer Science Knowledge Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none text-white">
            Practical CS Knowledge. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-sky-400">
              Built by Students, for Students.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Access curated cheat sheets, system design breakdowns, study guides, vetted developer
            tools, and tech internship opportunities without administrative clutter.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/resources">
              <Button variant="primary" size="lg" icon={Download}>
                Browse Resources
              </Button>
            </Link>
            <Link to="/submit">
              <Button variant="outline" size="lg" className="border-navy-700 bg-navy-900/60 text-slate-200 hover:bg-navy-800">
                Share Material
              </Button>
            </Link>
            <Link to="/articles">
              <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white hover:bg-navy-800/60">
                Read Guides <ArrowRight className="w-4 h-4 ml-1 inline" />
              </Button>
            </Link>
          </div>

          {/* Quick Category Badges */}
          <div className="mt-10 pt-8 border-t border-navy-800/80">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-3">
              Explore Popular Fields:
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/resources?category=${cat.slug}`}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-navy-800/80 hover:bg-teal-900/40 text-slate-300 hover:text-teal-300 border border-navy-700 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Student Study Materials with Academic Year & Course Subject Filters */}
      <AcademicStudyMaterials />

      {/* Interactive Daily CS Quick Quiz Widget */}
      <QuickQuizWidget />

      {/* Featured Content Carousel / Grid */}
      {featuredItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Featured Picks
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Hand-picked technical articles, high-impact resources, and major programs.
              </p>
            </div>
            <Link to="/search?featured=true" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <ContentCardSkeleton key={i} />)
              : featuredItems.map((item) => <ContentCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {/* Recent Resources (Downloadable Study Materials) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Downloadable Resources
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Course slide decks, exam summaries, reference guides, and cheatsheets.
            </p>
          </div>
          <Link to="/resources" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
            Browse all resources <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ContentCardSkeleton key={i} />)
            : recentResources.map((item) => <ContentCard key={item.id} item={item} />)}
        </div>
      </section>

      {/* Latest Technical Articles */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Articles & Tutorials
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Engineering insights, distributed systems explanations, and modern stacks.
            </p>
          </div>
          <Link to="/articles" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
            Read all articles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ContentCardSkeleton key={i} />)
            : latestArticles.map((item) => <ContentCard key={item.id} item={item} />)}
        </div>
      </section>

      {/* Developer Tools & AI Utilities Directory */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Developer Tools Directory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Curated tools to accelerate your programming, diagramming, and testing workflows.
            </p>
          </div>
          <Link to="/tools" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
            Explore directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ContentCardSkeleton key={i} />)
            : topTools.map((item) => <ContentCard key={item.id} item={item} />)}
        </div>
      </section>

      {/* Internships, Scholarships & Competitions */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Opportunities & Internships
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active student research grants, hackathons, and software engineering internships.
            </p>
          </div>
          <Link to="/opportunities" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
            See all opportunities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ContentCardSkeleton key={i} />)
            : opportunities.map((item) => <ContentCard key={item.id} item={item} />)}
        </div>
      </section>

      {/* Contribute Banner */}
      <section className="rounded-2xl bg-teal-50 dark:bg-navy-900 border border-teal-200 dark:border-navy-800 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Have a study guide or developer tool to share?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Join the community contributor network. Submit notes, lecture cheatsheets, or open source
            utilities. Our editorial team reviews submissions swiftly.
          </p>
        </div>
        <Link to="/submit" className="shrink-0">
          <Button variant="primary" size="lg" icon={Terminal}>
            Submit Content for Review
          </Button>
        </Link>
      </section>
    </div>
  );
}
