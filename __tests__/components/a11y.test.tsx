import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { FloatingToolbar } from "../../src/components/FloatingToolbar";
import { SettingsDialog } from "../../src/components/SettingsDialog";
import type { Settings } from "../../src/types";

afterEach(cleanup);

describe("접근성 (a11y)", () => {
  it("FloatingToolbar에 role='toolbar' 존재", () => {
    render(
      <FloatingToolbar
        position={{ x: 100, y: 200 }}
        onHighlight={vi.fn()}
        onProvoke={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(screen.getByRole("toolbar")).toHaveAttribute("aria-label", "텍스트 도구");
  });

  it("Escape 키로 FloatingToolbar 닫기", () => {
    const onClose = vi.fn();
    render(
      <FloatingToolbar
        position={{ x: 100, y: 200 }}
        onHighlight={vi.fn()}
        onProvoke={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("SettingsDialog에 role='dialog' 존재", () => {
    const settings: Settings = {
      provider: "anthropic",
      apiKey: "",
      rememberKey: false,
      model: "claude-sonnet-4-6",
      defaultMode: "understand",
      obsidianFrontmatter: false,
    };
    render(
      <SettingsDialog settings={settings} onSave={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });
});
