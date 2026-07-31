import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AchievementUnlockedDetail } from "../lib/achievements";

interface ToastState {
  id: number;
  title: string;
}

function AchievementTrophyIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Kupa"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="miodesk-achievement-gold"
          x1="12"
          y1="8"
          x2="36"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFD978" />
          <stop offset="0.52" stopColor="#F1AA42" />
          <stop offset="1" stopColor="#D8862F" />
        </linearGradient>
      </defs>

      <path
        d="M14 8h20v9c0 7.2-4.2 12.6-10 14.5C18.2 29.6 14 24.2 14 17V8Z"
        fill="url(#miodesk-achievement-gold)"
      />

      <path
        d="M14 12H8v3.2C8 21.5 12.1 25 18 25"
        fill="none"
        stroke="#D8862F"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M34 12h6v3.2C40 21.5 35.9 25 30 25"
        fill="none"
        stroke="#D8862F"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M24 31.5V37"
        fill="none"
        stroke="#D8862F"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M18 36.5h12v4H18z"
        fill="#F1AA42"
        rx="2"
      />

      <path
        d="M15 40h18v4H15z"
        fill="#D8862F"
        rx="2"
      />

      <path
        d="m24 12.8 1.6 3.2 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5 1.6-3.2Z"
        fill="#FFF7D6"
      />

      <path
        d="M17 9.5h14"
        fill="none"
        stroke="#FFE6A5"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".9"
      />
    </svg>
  );
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
      <div
        className="achievement-unlocked-toast-icon"
        aria-hidden="true"
      >
        <AchievementTrophyIcon />
      </div>

      <div>
        <span>Başarım kazanıldı!</span>
        <strong>{toast.title}</strong>
      </div>
    </div>,
    document.body,
  );
}
