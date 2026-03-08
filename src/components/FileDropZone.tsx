import { useCallback, useRef, useState } from "react";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  onSampleClick: () => void;
}

export function FileDropZone({ onFileSelect, onSampleClick }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
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

  return (
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
      <p className="font-ui text-sm text-[#666] mb-4">또는 클릭하여 파일 선택</p>
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
  );
}
