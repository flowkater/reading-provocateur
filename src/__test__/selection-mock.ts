import { vi } from "vitest";

export function mockSelection(
  text: string,
  rect: Partial<DOMRect> = {}
) {
  const defaultRect = {
    left: 100,
    top: 200,
    bottom: 220,
    right: 400,
    width: 300,
    height: 20,
    x: 100,
    y: 200,
    toJSON: () => ({}),
  };
  const mergedRect = { ...defaultRect, ...rect };
  vi.spyOn(window, "getSelection").mockReturnValue({
    isCollapsed: false,
    toString: () => text,
    getRangeAt: () => ({
      getBoundingClientRect: () => mergedRect,
      getClientRects: () => [mergedRect],
    }),
  } as unknown as Selection);
}
