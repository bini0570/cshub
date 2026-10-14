/**
 * Format an ISO date string into a user-friendly date format
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted date (e.g., 'Oct 13, 2026')
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

/**
 * Format an ISO date string into relative time (e.g. '2 hours ago', '3 days ago')
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return formatDate(dateStr);
  } catch {
    return formatDate(dateStr);
  }
}

/**
 * Format raw bytes into human readable units (KB, MB, GB)
 * @param {number} bytes
 * @returns {string} Formatted size (e.g. '4.2 MB')
 */
export function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Estimate reading time in minutes from a text body
 * @param {string} text
 * @returns {string} (e.g. '4 min read')
 */
export function calculateReadingTime(text) {
  if (!text) return '1 min read';
  const cleanText = text.replace(/<[^>]*>/g, '');
  const words = cleanText.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Truncate long strings with ellipsis
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export function truncate(str, length = 120) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

/**
 * Status color badge config
 */
export const STATUS_STYLES = {
  // Submission statuses
  pending: {
    label: 'Pending Review',
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  under_review: {
    label: 'Under Review',
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  changes_requested: {
    label: 'Changes Requested',
    bg: 'bg-orange-100 dark:bg-orange-950/40',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  // Content statuses
  published: {
    label: 'Published',
    bg: 'bg-teal-100 dark:bg-teal-950/40',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
  archived: {
    label: 'Archived',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  },
};
