import { useCallback, useRef, useState } from "react";
import type { Article } from "../types";
import { parseArticle as defaultParseArticle } from "../lib/article-parser";

type TabType = "pdf" | "article";

interface ContentSelectorProps {
  onFileSelect: (file: File) => void;
  onArticleLoad?: (article: Article) => void;
  onSampleClick: () => void;
  parseArticleFn?: (url: string) => Promise<Article>;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ContentSelector({
  onFileSelect,
  onArticleLoad,
  onSampleClick,
  parseArticleFn = defaultParseArticle,
}: ContentSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("pdf");
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleUrlSubmit = async () => {
    if (!isValidUrl(url) || loading) return;
    setLoading(true);
    setError(null);
    try {
      const article = await parseArticleFn(url);
      onArticleLoad?.(article);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Tab bar */}
      <div className="flex border-b-2 border-[#111] mb-6">
        <button
          className={`px-4 py-2 font-ui text-sm ${
            activeTab === "pdf"
              ? "bg-[#111] text-[#F9F9F7]"
              : "text-[#666] hover:text-[#111]"
          }`}
          onClick={() => setActiveTab("pdf")}
        >
          PDF 파일
        </button>
        <button
          className={`px-4 py-2 font-ui text-sm ${
            activeTab === "article"
              ? "bg-[#111] text-[#F9F9F7]"
              : "text-[#666] hover:text-[#111]"
          }`}
          onClick={() => setActiveTab("article")}
        >
          웹 아티클
        </button>
      </div>

      {activeTab === "pdf" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-[#111] bg-[rgba(254,243,199,0.3)]"
              : "border-[#999] hover:border-[#111]"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="font-headline text-xl mb-2">PDF를 여기에 드롭</p>
          <p className="font-ui text-sm text-[#666] mb-4">
            또는 클릭하여 파일 선택
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSampleClick();
            }}
            className="font-ui text-sm text-[#666] underline underline-offset-4 hover:text-[#111]"
          >
            샘플로 체험하기
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#999] p-12">
          <p className="font-headline text-xl mb-4 text-center">
            웹 아티클 URL 입력
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUrlSubmit();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border-2 border-[#111] font-ui text-sm"
            />
            <button
              type="submit"
              disabled={loading || !isValidUrl(url)}
              className="btn-newsprint px-4 py-2 font-ui text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "불러오는 중..." : "불러오기"}
            </button>
          </form>
          {error && (
            <p className="mt-3 text-[#CC0000] font-ui text-sm">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Backward compatibility alias
export { ContentSelector as FileDropZone };
