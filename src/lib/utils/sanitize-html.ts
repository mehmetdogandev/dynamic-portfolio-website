import sanitizeHtmlLib from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
];

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "title", "class"],
  img: ["src", "alt", "title", "class", "style"],
  p: ["class", "style"],
  div: ["class", "style"],
  h1: ["class", "style"],
  h2: ["class", "style"],
  h3: ["class", "style"],
  h4: ["class", "style"],
  h5: ["class", "style"],
  h6: ["class", "style"],
  blockquote: ["class", "style"],
  "*": ["class"],
};

const PX_OR_PERCENT = /^(\d+)(px|%|em|rem)$/;
const MARGIN_OR_PADDING = /^(\d+)(px|%|em|rem)$|^0$/;

const ALLOWED_STYLES: Record<string, Record<string, RegExp[]>> = {
  "*": {
    "text-align": [/^(left|right|center|justify)$/],
  },
  img: {
    float: [/^(left|right|none)$/],
    "margin-left": [MARGIN_OR_PADDING],
    "margin-right": [MARGIN_OR_PADDING],
    "margin-top": [MARGIN_OR_PADDING],
    "margin-bottom": [MARGIN_OR_PADDING],
    width: [PX_OR_PERCENT],
    height: [PX_OR_PERCENT],
    "max-width": [PX_OR_PERCENT, /^100%$/],
  },
};

/**
 * Sanitizes HTML to prevent XSS attacks.
 * Use when rendering user-provided or stored HTML (e.g. rich text content).
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedStyles: ALLOWED_STYLES,
  });
}
