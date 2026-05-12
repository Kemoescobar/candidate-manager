import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatExperience,
  getStatusLabel,
  getStatusColor,
  truncate,
  buildQueryString,
  isValidEmail,
} from '../../utils/helpers';

describe('helpers', () => {
  describe('formatDate()', () => {
    it('should format a date string to French format', () => {
      const result = formatDate('2024-01-15T00:00:00.000Z');
      expect(result).toMatch(/15\/01\/2024/);
    });

    it('should return "-" for empty string', () => {
      expect(formatDate('')).toBe('-');
    });
  });

  describe('formatExperience()', () => {
    it('should return "Débutant" for 0 years', () => {
      expect(formatExperience(0)).toBe('Débutant');
    });
    it('should return "1 an" for 1 year', () => {
      expect(formatExperience(1)).toBe('1 an');
    });
    it('should return "5 ans" for 5 years', () => {
      expect(formatExperience(5)).toBe('5 ans');
    });
  });

  describe('getStatusLabel()', () => {
    it('should return French label for known statuses', () => {
      expect(getStatusLabel('pending')).toBe('En attente');
      expect(getStatusLabel('validated')).toBe('Validé');
      expect(getStatusLabel('rejected')).toBe('Rejeté');
      expect(getStatusLabel('deleted')).toBe('Supprimé');
    });
    it('should return the status itself for unknown status', () => {
      expect(getStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('getStatusColor()', () => {
    it('should return a color for known statuses', () => {
      expect(getStatusColor('pending')).toBe('#f59e0b');
      expect(getStatusColor('validated')).toBe('#10b981');
    });
    it('should return default color for unknown status', () => {
      expect(getStatusColor('other')).toBe('#6b7280');
    });
  });

  describe('truncate()', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello…');
    });
    it('should not truncate short strings', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
  });

  describe('buildQueryString()', () => {
    it('should build a query string', () => {
      const result = buildQueryString({ page: 1, search: 'Alice' });
      expect(result).toContain('page=1');
      expect(result).toContain('search=Alice');
      expect(result.startsWith('?')).toBe(true);
    });
    it('should skip undefined/null values', () => {
      const result = buildQueryString({ page: 1, status: undefined });
      expect(result).not.toContain('status');
    });
    it('should return empty string for empty params', () => {
      expect(buildQueryString({})).toBe('');
    });
  });

  describe('isValidEmail()', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });
    it('should return false for invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });
});
