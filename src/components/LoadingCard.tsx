interface LoadingCardProps {
  message?: string;
}

export function LoadingCard({ message = "생각 중" }: LoadingCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="flex gap-1.5 mb-3">
        <div className="w-2 h-2 bg-[#111] loading-dot" />
        <div className="w-2 h-2 bg-[#111] loading-dot" />
        <div className="w-2 h-2 bg-[#111] loading-dot" />
      </div>
      <p className="font-ui text-sm text-[#666]">{message}</p>
    </div>
  );
}
