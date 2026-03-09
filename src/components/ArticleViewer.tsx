import { useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import type { Annotation, Article, SelectionData } from "../types";

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
  onTextSelect: (
    text: string,
    position: { x: number; y: number },
    selectionData?: SelectionData
  ) => void;
  annotations?: Annotation[];
}

function buildArticleSelectionData(
  selectedText: string,
  articleText: string
): SelectionData {
  const index = articleText.indexOf(selectedText);
  const beforeStart = Math.max(0, index - 32);
  const afterEnd = Math.min(
    articleText.length,
    index + selectedText.length + 32
  );

  return {
    contentType: "article",
    pageNumber: 1,
    quote: selectedText,
    contextBefore: index >= 0 ? articleText.slice(beforeStart, index) : "",
    contextAfter:
      index >= 0
        ? articleText.slice(index + selectedText.length, afterEnd)
        : "",
  };
}

function applyArticleHighlights(
  htmlContent: string,
  annotations: Annotation[]
): string {
  if (annotations.length === 0) return htmlContent;

  const doc = new DOMParser().parseFromString(htmlContent, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const annotation of annotations) {
    const quote = annotation.quote ?? annotation.selectedText;
    if (!quote) continue;

    const targetNode = textNodes.find((node) =>
      node.textContent?.includes(quote)
    );
    if (!targetNode || !targetNode.parentNode) continue;

    const text = targetNode.textContent ?? "";
    const index = text.indexOf(quote);
    if (index < 0) continue;

    const before = text.slice(0, index);
    const after = text.slice(index + quote.length);
    const mark = doc.createElement("mark");
    mark.className = "highlight-yellow";
    mark.textContent = quote;

    const fragment = doc.createDocumentFragment();
    if (before) fragment.appendChild(doc.createTextNode(before));
    fragment.appendChild(mark);
    if (after) fragment.appendChild(doc.createTextNode(after));

    targetNode.parentNode.replaceChild(fragment, targetNode);
  }

  return doc.body.innerHTML;
}

export function ArticleViewer({
  article,
  onTextSelect,
  annotations = [],
}: ArticleViewerProps) {
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (!text) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    onTextSelect(
      text,
      { x: rect.left, y: rect.bottom },
      buildArticleSelectionData(text, article.content)
    );
  }, [article.content, onTextSelect]);

  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(article.htmlContent, PURIFY_CONFIG),
    [article.htmlContent]
  );

  const highlightedHtml = useMemo(
    () =>
      applyArticleHighlights(
        sanitizedHtml,
        annotations.filter((annotation) => annotation.contentType === "article")
      ),
    [annotations, sanitizedHtml]
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
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  );
}
