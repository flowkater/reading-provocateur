import { useState } from "react";
import { SessionModeSelector } from "./components/SessionModeSelector";
import type { SessionMode } from "./types";

type AppView = "onboarding" | "main";

function App() {
  const [view, setView] = useState<AppView>("onboarding");
  const [_mode, setMode] = useState<SessionMode | null>(null);

  const handleModeSelect = (mode: SessionMode) => {
    setMode(mode);
    setView("main");
  };

  const handleSampleClick = () => {
    setMode("understand");
    setView("main");
  };

  if (view === "onboarding") {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <h1 className="font-headline text-5xl font-black text-center mb-2 tracking-tight">
            Reading Provocateur
          </h1>
          <p className="font-body text-center text-[#666] mb-12 text-lg">
            AI가 던지는 도발적 질문으로 수동적 읽기를 능동적 학습으로
          </p>
          <SessionModeSelector
            selected={null}
            onSelect={handleModeSelect}
            onSampleClick={handleSampleClick}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <p className="p-8 font-ui">Main view — PDF viewer coming soon</p>
    </div>
  );
}

export default App;
