import DOMPurify from 'dompurify';

/**
 * Sanitize an HTML string to prevent XSS attacks while allowing safe formatting tags.
 * @param {string} html - Raw HTML string to sanitize
 * @returns {string} Sanitized HTML string safe for innerHTML injection
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'b', 'i', 'strong', 'em', 'strike', 'code', 'pre',
      'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
      'a', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}
