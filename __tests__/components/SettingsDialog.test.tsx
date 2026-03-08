import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog } from "../../src/components/SettingsDialog";
import type { Settings } from "../../src/types";

afterEach(cleanup);

const baseSettings: Settings = {
  provider: "anthropic",
  apiKey: "",
  rememberKey: false,
  model: "claude-sonnet-4-6",
  defaultMode: "understand",
  obsidianFrontmatter: false,
};

describe("SettingsDialog", () => {
  it("API Key 입력 필드 + 마스킹", () => {
    render(
      <SettingsDialog
        settings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const input = screen.getByPlaceholderText(/API Key/i);
    expect(input).toHaveAttribute("type", "password");
  });

  it("'이 기기에 기억' 토글 (기본 OFF)", () => {
    render(
      <SettingsDialog
        settings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const toggle = screen.getByLabelText(/기억/i);
    expect(toggle).not.toBeChecked();
  });

  it("모델 라디오 (Sonnet, Haiku)", () => {
    render(
      <SettingsDialog
        settings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/Sonnet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Haiku/i)).toBeInTheDocument();
  });

  it("기본 모드 select", () => {
    render(
      <SettingsDialog
        settings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue(/이해/)).toBeInTheDocument();
  });

  it("Obsidian 프론트매터 토글", () => {
    render(
      <SettingsDialog
        settings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/Obsidian/i)).toBeInTheDocument();
  });

  it("[Done] → onSave 콜백", async () => {
    const onSave = vi.fn();
    render(
      <SettingsDialog
        settings={baseSettings}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );
    await userEvent.click(screen.getByText("Done"));
    expect(onSave).toHaveBeenCalled();
  });

  it("Newsprint 입력 스타일: border-b-2 bg-transparent font-mono", () => {
    render(
      <SettingsDialog
        settings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const input = screen.getByPlaceholderText(/API Key/i);
    expect(input).toHaveClass("bg-transparent");
    expect(input).toHaveClass("font-mono");
  });
});
