import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../src/utils/sanitize';
import { formatBytes, calculateReadingTime } from '../src/utils/formatters';

describe('Application Security & Sanitization', () => {
  it('strips malicious <script> tags and payloads from article content', () => {
    const maliciousHtml = '<p>Normal text</p><script>alert("hacked")</script><b>Bold text</b>';
    const clean = sanitizeHtml(maliciousHtml);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('<p>Normal text</p>');
    expect(clean).toContain('<b>Bold text</b>');
  });

  it('strips inline JavaScript event handlers (onerror, onclick, onload)', () => {
    const maliciousImg = '<img src="x" onerror="alert(1)" alt="test"/>';
    const clean = sanitizeHtml(maliciousImg);
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('alert(1)');
  });

  it('strips dangerous iframe or object embed injection', () => {
    const attackHtml = '<iframe src="https://evil.com"></iframe><embed src="evil.swf">';
    const clean = sanitizeHtml(attackHtml);
    expect(clean).not.toContain('<iframe');
    expect(clean).not.toContain('<embed');
  });

  it('allows safe educational formatting (headings, code blocks, lists, links)', () => {
    const educationalHtml = `
      <h2>Binary Search Trees</h2>
      <p>Time complexity is O(log n).</p>
      <pre><code>def search(root, key): return None</code></pre>
      <ul><li>Item 1</li><li>Item 2</li></ul>
      <a href="https://example.com" target="_blank">Documentation</a>
    `;
    const clean = sanitizeHtml(educationalHtml);
    expect(clean).toContain('<h2>Binary Search Trees</h2>');
    expect(clean).toContain('<code>def search');
    expect(clean).toContain('<ul>');
    expect(clean).toContain('href="https://example.com"');
  });

  it('calculates human-readable byte formats', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(20971520)).toBe('20 MB');
  });

  it('calculates realistic reading times for articles', () => {
    const shortText = 'Hello world, welcome to computer science.';
    expect(calculateReadingTime(shortText)).toBe('1 min read');

    // 400 words
    const longText = Array.from({ length: 400 }).fill('word').join(' ');
    expect(calculateReadingTime(longText)).toBe('2 min read');
  });
});
