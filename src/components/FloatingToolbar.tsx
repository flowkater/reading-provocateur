import { useState, useEffect, useRef } from "react";
import type { HighlightIntent } from "../types";

interface FloatingToolbarProps {
  position: { x: number; y: number };
  onHighlight: () => void;
  onProvoke: (intent: HighlightIntent) => void;
  onClose: () => void;
}

const INTENT_CHIPS: { intent: HighlightIntent; label: string }[] = [
  { intent: "core", label: "핵심" },
  { intent: "confused", label: "헷갈림" },
  { intent: "connection", label: "연결" },
  { intent: "apply", label: "적용" },
];

export function FloatingToolbar({
  position,
  onHighlight,
  onProvoke,
  onClose,
}: FloatingToolbarProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="텍스트 도구"
      className="bg-[#111] text-[#F9F9F7] uppercase tracking-wider fixed z-50 shadow-hard"
      style={{ left: position.x, top: position.y }}
    >
      {step === 1 ? (
        <div className="flex">
          <button
            onClick={onHighlight}
            className="px-3 py-2 font-ui text-xs hover:bg-[#333] transition-colors"
          >
            Highlight
          </button>
          <button
            onClick={() => setStep(2)}
            className="px-3 py-2 font-ui text-xs hover:bg-[#333] transition-colors border-l border-[#333]"
          >
            Provoke
          </button>
        </div>
      ) : (
        <div className="p-3">
          <p className="font-ui text-xs mb-2 normal-case tracking-normal">
            왜 여기서 묻길 원해?
          </p>
          <div className="flex gap-1">
            {INTENT_CHIPS.map((chip) => (
              <button
                key={chip.intent}
                onClick={() => onProvoke(chip.intent)}
                className="px-2 py-1 font-ui text-xs border border-[#666] hover:bg-[#F9F9F7] hover:text-[#111] transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
