const CONTEXT_RADIUS = 800;
const FALLBACK_LENGTH = 1500;

export function extractContext(
  pageText: string,
  selectedText: string | null
): string {
  if (!selectedText) {
    return pageText.slice(0, FALLBACK_LENGTH);
  }

  const idx = pageText.indexOf(selectedText);
  if (idx === -1) {
    return pageText.slice(0, FALLBACK_LENGTH);
  }

  const start = Math.max(0, idx - CONTEXT_RADIUS);
  const end = Math.min(pageText.length, idx + selectedText.length + CONTEXT_RADIUS);
  return pageText.slice(start, end);
}
