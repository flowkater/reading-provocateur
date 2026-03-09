import { useRef } from "react";
import type { ReadingSessionRecord } from "../types";

interface RestoreSessionCardProps {
  session: ReadingSessionRecord;
  onFileSelect: (file: File) => void;
}

export function RestoreSessionCard({
  session,
  onFileSelect,
}: RestoreSessionCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-8">
      <div className="w-full max-w-xl border-2 border-[#111] bg-white p-8 shadow-hard">
        <h1 className="font-headline text-3xl font-bold mb-4">
          이전 PDF 세션 복원
        </h1>
        <p className="font-ui text-sm text-[#666] mb-2">{session.title}</p>
        <p className="font-data text-sm text-[#666] mb-2">
          파일: {session.pdfResume?.fileName}
        </p>
        <p className="font-data text-sm text-[#666]">마지막 페이지: p.{session.currentPage}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-newsprint btn-newsprint-inverted mt-6 w-full py-2 text-sm"
        >
          같은 PDF 다시 선택
        </button>
      </div>
    </div>
  );
}
