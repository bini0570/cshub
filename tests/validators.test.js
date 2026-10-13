import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validateUrl,
  isValidUrl,
  generateSlug,
  MAX_FILE_SIZE_BYTES,
} from '../src/utils/validators';

describe('Validation & Security Utilities', () => {
  it('enforces maximum 20MB file size limit', () => {
    // 15 MB file -> Valid
    const validFile = {
      name: 'operating_systems_notes.pdf',
      size: 15 * 1024 * 1024,
      type: 'application/pdf',
    };
    expect(validateFile(validFile).valid).toBe(true);

    // 25 MB file -> Exceeds 20MB limit
    const oversizeFile = {
      name: 'large_dataset.pdf',
      size: 25 * 1024 * 1024,
      type: 'application/pdf',
    };
    const oversizeRes = validateFile(oversizeFile);
    expect(oversizeRes.valid).toBe(false);
    expect(oversizeRes.error).toContain('exceeds the 20 MB limit');
  });

  it('rejects executable and dangerous script extensions', () => {
    const dangerousExtensions = [
      'malware.exe',
      'script.bat',
      'attack.sh',
      'payload.cmd',
      'trojan.vbs',
      'script.ps1',
      'binary.bin',
    ];

    dangerousExtensions.forEach((filename) => {
      const res = validateFile({
        name: filename,
        size: 1024,
        type: 'application/octet-stream',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Executable and script files');
    });
  });

  it('accepts educational file formats (PDF, DOCX, ZIP, Images)', () => {
    const safeFiles = [
      { name: 'algo_notes.pdf', size: 2000000, type: 'application/pdf' },
      { name: 'cheatsheet.docx', size: 1000000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { name: 'code_samples.zip', size: 5000000, type: 'application/zip' },
      { name: 'diagram.png', size: 500000, type: 'image/png' },
      { name: 'cover.webp', size: 200000, type: 'image/webp' },
    ];

    safeFiles.forEach((file) => {
      const res = validateFile(file);
      expect(res.valid).toBe(true);
    });
  });

  it('validates safe external URLs', () => {
    expect(isValidUrl('https://github.com/torvalds/linux')).toBe(true);
    expect(isValidUrl('http://localhost:5173')).toBe(true);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
    expect(isValidUrl('not-a-valid-url')).toBe(false);
  });

  it('generates clean URL-safe slugs', () => {
    expect(generateSlug('Distributed Systems: Raft Consensus 101!'))
      .toBe('distributed-systems-raft-consensus-101');
    expect(generateSlug('C++20 & Systems Programming Cheat Sheet'))
      .toBe('c20-systems-programming-cheat-sheet');
  });
});
