import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes HTML to prevent XSS attacks.
 * Use when rendering user-provided or stored HTML (e.g. rich text content).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
      "img", "figure", "figcaption",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
  });
}
