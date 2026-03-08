interface BottomBarProps {
  currentPage: number;
  totalPages: number;
}

export function BottomBar({ currentPage, totalPages }: BottomBarProps) {
  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className="h-8 border-t-2 border-[#111] flex items-center justify-between px-4 bg-[#F9F9F7]">
      <span className="font-data text-xs">
        p.{currentPage}/{totalPages}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-[#ddd] border border-[#111]">
          <div
            className="h-full bg-[#111]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-data text-xs">{progress}%</span>
      </div>
    </div>
  );
}
