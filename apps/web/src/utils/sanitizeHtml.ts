import DOMPurify from "dompurify";

export function sanitizeHtml(content: string) {
  return DOMPurify.sanitize(content);
}
