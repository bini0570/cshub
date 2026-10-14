// Allowed MIME types for CS Hub uploads
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'application/x-zip-compressed',
];

export const FORBIDDEN_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'ps1', 'com', 'bin', 'msi', 'jar', 'apk', 'scr', 'dll', 'so'
];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 Megabytes

/**
 * Validate an uploaded file against size and security constraints
 * @param {File} file
 * @param {number} maxBytes
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, maxBytes = MAX_FILE_SIZE_BYTES) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Check file size
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds the 20 MB limit (current: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  // Check dangerous file extensions
  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Executable and script files (.${ext}) are strictly rejected for security reasons.`,
    };
  }

  // Check MIME type
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File format "${file.type}" is not supported. Allowed formats: PDF, DOCX, PPTX, Images (JPG, PNG, WebP), TXT, Markdown, or ZIP.`,
    };
  }

  return { valid: true };
}

/**
 * Validate that an external URL is a safe HTTP or HTTPS link
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Standard email format validator
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Generate a clean, URL-safe slug from a title string
 * @param {string} text
 * @returns {string}
 */
export function generateSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
