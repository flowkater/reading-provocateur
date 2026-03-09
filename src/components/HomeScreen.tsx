import { SessionModeSelector } from "./SessionModeSelector";
import type { ReadingSessionRecord, RecentDocumentRecord, SessionMode } from "../types";

interface HomeScreenProps {
  recentDocuments: RecentDocumentRecord[];
  recentSessions: ReadingSessionRecord[];
  onModeSelect: (mode: SessionMode) => void;
  onOpenSession: (sessionId: string) => void;
}

const SOURCE_LABELS: Record<RecentDocumentRecord["type"], string> = {
  pdf: "PDF",
  article: "웹",
  text: "텍스트",
};

export function HomeScreen({
  recentDocuments,
  recentSessions,
  onModeSelect,
  onOpenSession,
}: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-12">
        <div>
          <h1 className="font-headline text-5xl font-black text-center mb-2 tracking-tight">
            Reading Provocateur
          </h1>
          <p className="font-body text-center text-[#666] mb-12 text-lg">
            AI가 던지는 도발적 질문으로 수동적 읽기를 능동적 학습으로
          </p>
          <SessionModeSelector
            selected={null}
            onSelect={onModeSelect}
            onSampleClick={() => onModeSelect("understand")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="font-headline text-2xl font-bold mb-4">최근 문서</h2>
            <div className="space-y-3">
              {recentDocuments.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => onOpenSession(document.lastSessionId)}
                  className="w-full text-left p-4 border-2 border-[#111] bg-white hover:shadow-hard-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-ui text-xs uppercase tracking-widest text-[#666]">
                      {SOURCE_LABELS[document.type]}
                    </span>
                    <span className="font-data text-xs text-[#666]">
                      {document.lastOpenedAt.slice(0, 10)}
                    </span>
                  </div>
                  <p className="font-headline text-lg font-bold mt-2">
                    {document.title}
                  </p>
                  {document.type === "text" && document.textSnapshot && (
                    <p className="font-body text-sm text-[#666] mt-2 line-clamp-2">
                      {document.textSnapshot.content}
                    </p>
                  )}
                  {document.type === "text" && document.textSnapshot && (
                    <p className="font-data text-xs text-[#999] mt-2">
                      {document.textSnapshot.charCount}자
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-bold mb-4">최근 세션</h2>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onOpenSession(session.id)}
                  className="w-full text-left p-4 border-2 border-[#111] bg-white hover:shadow-hard-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-ui text-xs uppercase tracking-widest text-[#666]">
                      {session.mode}
                    </span>
                    <span className="font-data text-xs text-[#666]">
                      p.{session.currentPage}
                    </span>
                  </div>
                  <p className="font-headline text-lg font-bold mt-2">
                    {session.title}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
