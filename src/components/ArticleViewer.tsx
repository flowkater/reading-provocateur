import { useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import type { Article } from "../types";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "ul", "ol", "li",
    "blockquote", "pre", "code", "em", "strong", "a", "img", "figure",
    "figcaption", "table", "thead", "tbody", "tr", "th", "td", "hr", "span", "div",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id"],
  FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
};

export { PURIFY_CONFIG };

interface ArticleViewerProps {
  article: Article;
  onTextSelect: (text: string, position: { x: number; y: number }) => void;
}

export function ArticleViewer({ article, onTextSelect }: ArticleViewerProps) {
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (!text) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    onTextSelect(text, { x: rect.left, y: rect.bottom });
  }, [onTextSelect]);

  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(article.htmlContent, PURIFY_CONFIG),
    [article.htmlContent]
  );

  if (!article.htmlContent) {
    return (
      <div className="flex-1 overflow-auto bg-white px-8 py-6 max-w-3xl mx-auto">
        <p className="text-[#666] font-ui">본문을 표시할 수 없습니다</p>
      </div>
    );
  }

  let hostname = "";
  try {
    hostname = new URL(article.url).hostname;
  } catch {
    hostname = article.url;
  }

  return (
    <div
      onMouseUp={handleMouseUp}
      className="flex-1 overflow-auto bg-white px-8 py-6 max-w-3xl mx-auto"
    >
      <h1 className="font-headline text-3xl font-black mb-4">{article.title}</h1>
      <p className="font-ui text-sm text-[#666] mb-6">
        {article.charCount.toLocaleString()}자 ·{" "}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {hostname}
        </a>
      </p>
      <article
        className="font-body text-lg leading-relaxed article-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
