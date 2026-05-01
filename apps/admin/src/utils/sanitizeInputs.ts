import DOMPurify from "dompurify";

/**
 * Sanitize a string input to prevent XSS attacks
 * Removes dangerous HTML/JavaScript while preserving safe text
 */
export function sanitizeText(input: string | undefined | null): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  });
}

/**
 * Sanitize HTML content (allows basic HTML tags but removes scripts)
 */
export function sanitizeHtml(input: string | undefined | null): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target']
  });
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => 
        typeof v === 'string' ? sanitizeText(v) : v
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeFormData(value as Record<string, any>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) return "";
  const sanitized = sanitizeText(email).toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : "";
}

/**
 * Validate and sanitize number
 */
export function sanitizeNumber(input: any): number {
  const num = Number(input);
  return isFinite(num) ? num : 0;
}
