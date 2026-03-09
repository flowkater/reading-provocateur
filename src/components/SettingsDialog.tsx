import { useState } from "react";
import type { Settings, SessionMode } from "../types";

interface SettingsDialogProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

const MODE_OPTIONS: { value: SessionMode; label: string }[] = [
  { value: "understand", label: "이해" },
  { value: "apply", label: "적용" },
  { value: "exam", label: "시험" },
  { value: "critique", label: "비판" },
];

export function SettingsDialog({ settings, onSave, onClose }: SettingsDialogProps) {
  const [form, setForm] = useState<Settings>({ ...settings });

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-[#F9F9F7] border-2 border-[#111] w-full max-w-md p-6">
        <h2 className="font-headline text-2xl font-bold mb-6">Settings</h2>

        {/* API Key */}
        <div className="mb-4">
          <label className="font-ui text-xs uppercase tracking-widest text-[#666] block mb-1">
            API Key
          </label>
          <p className="font-ui text-xs text-[#CC0000] mb-2">
            ⚠️ API Key는 브라우저에서 직접 Anthropic 서버로 전송됩니다. 개인용으로만 사용하세요.
          </p>
          <input
            type="password"
            placeholder="API Key를 입력하세요"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            className="w-full px-2 py-1.5 border-b-2 border-[#111] bg-transparent font-mono text-sm focus:border-[#CC0000] outline-none"
          />
        </div>

        {/* Remember key */}
        <div className="mb-4 flex items-center gap-2">
          <input
            id="remember-key"
            type="checkbox"
            checked={form.rememberKey}
            onChange={(e) => setForm({ ...form, rememberKey: e.target.checked })}
            className="accent-[#111]"
          />
          <label htmlFor="remember-key" className="font-ui text-sm">
            이 기기에 기억
          </label>
        </div>

        {/* Model */}
        <div className="mb-4">
          <label className="font-ui text-xs uppercase tracking-widest text-[#666] block mb-2">
            Model
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 font-ui text-sm">
              <input
                type="radio"
                name="model"
                value="claude-sonnet-4-6"
                checked={form.model === "claude-sonnet-4-6"}
                onChange={() => setForm({ ...form, model: "claude-sonnet-4-6" })}
                className="accent-[#111]"
              />
              Sonnet 4.6
            </label>
            <label className="flex items-center gap-1.5 font-ui text-sm">
              <input
                type="radio"
                name="model"
                value="claude-haiku-4-5"
                checked={form.model === "claude-haiku-4-5"}
                onChange={() => setForm({ ...form, model: "claude-haiku-4-5" })}
                className="accent-[#111]"
              />
              Haiku 4.5
            </label>
          </div>
        </div>

        {/* Default mode */}
        <div className="mb-4">
          <label className="font-ui text-xs uppercase tracking-widest text-[#666] block mb-1">
            기본 모드
          </label>
          <select
            value={form.defaultMode}
            onChange={(e) =>
              setForm({ ...form, defaultMode: e.target.value as SessionMode })
            }
            className="w-full px-2 py-1.5 border-b-2 border-[#111] bg-transparent font-ui text-sm outline-none"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Obsidian */}
        <div className="mb-6 flex items-center gap-2">
          <input
            id="obsidian"
            type="checkbox"
            checked={form.obsidianFrontmatter}
            onChange={(e) =>
              setForm({ ...form, obsidianFrontmatter: e.target.checked })
            }
            className="accent-[#111]"
          />
          <label htmlFor="obsidian" className="font-ui text-sm">
            Obsidian 프론트매터
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="btn-newsprint btn-newsprint-inverted flex-1 py-2 text-sm"
          >
            Done
          </button>
          <button
            onClick={onClose}
            className="btn-newsprint flex-1 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
