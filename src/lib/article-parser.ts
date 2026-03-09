import { Readability } from "@mozilla/readability";
import type { Article } from "../types";

const CORS_PROXY_URL = import.meta.env.VITE_CORS_PROXY_URL || "/cors-proxy";

export async function parseArticle(url: string): Promise<Article> {
  const html = await fetchArticleHtml(url);
  const doc = new DOMParser().parseFromString(html, "text/html");

  const reader = new Readability(doc.cloneNode(true) as Document);
  const parsed = reader.parse();

  if (!parsed || !parsed.textContent?.trim()) {
    throw new Error(
      "이 URL은 아티클로 인식되지 않습니다. 다른 URL을 시도해주세요."
    );
  }

  return {
    id: crypto.randomUUID(),
    url,
    title: parsed.title ?? doc.title,
    content: parsed.textContent,
    htmlContent: parsed.content,
    charCount: parsed.textContent.length,
    addedAt: new Date().toISOString(),
  };
}

async function fetchArticleHtml(url: string): Promise<string> {
  // 직접 fetch 시도
  try {
    const res = await fetch(url);
    if (res.ok) return await res.text();
  } catch {
    /* CORS → 프록시 fallback */
  }

  // CF Worker 프록시 경유
  const proxyUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok)
    throw new Error(`아티클을 불러올 수 없습니다 (${res.status})`);
  return await res.text();
}
