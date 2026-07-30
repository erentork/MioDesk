import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AchievementUnlockedDetail } from "../lib/achievements";

interface ToastState {
  id: number;
  title: string;
}

export function AchievementToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const sequenceRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleUnlocked = (event: Event) => {
      const customEvent =
        event as CustomEvent<AchievementUnlockedDetail>;

      if (!customEvent.detail?.title) return;

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      sequenceRef.current += 1;

      setToast({
        id: sequenceRef.current,
        title: customEvent.detail.title,
      });

      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, 3600);
    };

    window.addEventListener(
      "miodesk:achievement-unlocked",
      handleUnlocked,
    );

    return () => {
      window.removeEventListener(
        "miodesk:achievement-unlocked",
        handleUnlocked,
      );

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!toast || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      key={toast.id}
      className="achievement-unlocked-toast"
      role="status"
      aria-live="polite"
    >
      <div className="achievement-unlocked-toast-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <path d="M22 10h20v7c0 8.1-4.2 14.6-10 17.8C26.2 31.6 22 25.1 22 17v-7Z" />
          <path d="M25 39h14v6H25z" />
          <path d="M20 47h24v7H20z" />
          <path d="M16 13h6v7c0 4.8-2.8 8.9-7.1 10.8L11 24.9c3-1 5-3.8 5-6.9V13Z" />
          <path d="M48 13h6v5c0 3.1 2 5.9 5 6.9l-3.9 5.9C50.8 28.9 48 24.8 48 20v-7Z" />
        </svg>
      </div>

      <div>
        <span>Başarım kazanıldı!</span>
        <strong>{toast.title}</strong>
      </div>
    </div>,
    document.body,
  );
}
