import type { SessionMode } from "../types";

interface NavBarProps {
  bookTitle: string;
  mode: SessionMode;
  currentPage: number;
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
  onSettingsClick,
  onExportClick,
}: NavBarProps) {
  return (
    <nav className="h-12 border-b-2 border-[#111] flex items-center justify-between px-4 bg-[#F9F9F7]">
      <div className="flex items-center gap-3">
        <h1 className="font-headline text-lg font-bold truncate max-w-[300px]">
          {bookTitle}
        </h1>
        <span className="font-ui text-xs uppercase tracking-widest bg-[#111] text-[#F9F9F7] px-2 py-0.5">
          {MODE_LABELS[mode]}
        </span>
        <span className="font-data text-xs text-[#666]">p.{currentPage}</span>
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
