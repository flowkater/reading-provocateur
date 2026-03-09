import { useEffect, useRef, useState } from "react";
import type { SessionMode } from "../types";

interface NavBarProps {
  bookTitle: string;
  mode: SessionMode;
  currentPage: number;
  onModeChange?: (mode: SessionMode) => void;
  onSettingsClick: () => void;
  onExportClick: () => void;
}

const MODE_LABELS: Record<SessionMode, string> = {
  understand: "이해",
  apply: "적용",
  exam: "시험",
  critique: "비판",
};

export function NavBar({
  bookTitle,
  mode,
  currentPage,
  onModeChange,
  onSettingsClick,
  onExportClick,
}: NavBarProps) {
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModeMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!modeMenuRef.current?.contains(event.target as Node)) {
        setIsModeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModeMenuOpen]);

  const handleModeSelect = (nextMode: SessionMode) => {
    setIsModeMenuOpen(false);
    if (nextMode === mode) return;
    onModeChange?.(nextMode);
  };

  return (
    <nav className="h-12 border-b-2 border-[#111] flex items-center justify-between px-4 bg-[#F9F9F7]">
      <div className="flex items-center gap-3">
        <h1 className="font-headline text-lg font-bold truncate max-w-[300px]">
          {bookTitle}
        </h1>
        <div className="relative" ref={modeMenuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isModeMenuOpen}
            onClick={() => setIsModeMenuOpen((prev) => !prev)}
            className="font-ui text-xs uppercase tracking-widest bg-[#111] text-[#F9F9F7] px-2 py-0.5"
          >
            {MODE_LABELS[mode]}
          </button>
          {isModeMenuOpen && (
            <div
              role="menu"
              className="absolute top-full left-0 mt-2 min-w-[120px] border-2 border-[#111] bg-[#F9F9F7] shadow-hard-sm z-10"
            >
              {(
                Object.entries(MODE_LABELS) as Array<[SessionMode, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={value === mode}
                  onClick={() => handleModeSelect(value)}
                  className={`w-full px-3 py-2 text-left font-ui text-sm ${
                    value === mode ? "bg-[#111] text-[#F9F9F7]" : "text-[#111] hover:bg-[#E5E5E0]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {currentPage > 0 && (
          <span className="font-data text-xs text-[#666]">p.{currentPage}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsClick}
          className="btn-newsprint px-3 py-1 text-xs"
        >
          Settings
        </button>
        <button
          onClick={onExportClick}
          className="btn-newsprint px-3 py-1 text-xs"
        >
          Export
        </button>
      </div>
    </nav>
  );
}
