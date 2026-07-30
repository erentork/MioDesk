import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { unlockAchievement } from "../lib/achievements";

interface WheelPosition {
  left: number;
  top: number;
}

const CLICK_KEY = "miodesk_notes_horn_clicks";
const SPECIAL_THRESHOLD = 15;

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function findNewNoteButton(): HTMLButtonElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => normalizeText(button.textContent ?? "").includes("yeni not"),
    ) ?? null
  );
}

function readClickCount() {
  const stored = Number(sessionStorage.getItem(CLICK_KEY) ?? "0");

  return Number.isFinite(stored) &&
    stored >= 0 &&
    stored < SPECIAL_THRESHOLD
    ? stored
    : 0;
}

function SteeringWheelIcon() {
  return (
    <svg
      className="notes-horn-wheel-svg"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Direksiyon"
    >
      <circle className="notes-horn-wheel-outer" cx="50" cy="50" r="39" />
      <circle className="notes-horn-wheel-inner" cx="50" cy="50" r="13" />

      <path
        className="notes-horn-wheel-spoke"
        d="M47 40 30 24M53 40l17-16M50 63v24"
      />

      <path
        className="notes-horn-wheel-grip"
        d="M17 46c2-19 16-33 33-35M83 46c-2-19-16-33-33-35"
      />

      <circle className="notes-horn-wheel-horn" cx="50" cy="50" r="7" />
    </svg>
  );
}

export function NotesBoardTruck() {
  const [position, setPosition] = useState<WheelPosition | null>(null);
  const [clickCount, setClickCount] = useState(readClickCount);
  const [honkId, setHonkId] = useState(0);
  const [showHonks, setShowHonks] = useState(false);
  const [specialActive, setSpecialActive] = useState(false);

  const honkTimerRef = useRef<number | null>(null);
  const specialTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrame = 0;
    let observedButton: HTMLButtonElement | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const updatePosition = () => {
      window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(() => {
        const button = findNewNoteButton();

        if (!button) {
          setPosition(null);
          return;
        }

        if (button !== observedButton) {
          resizeObserver?.disconnect();
          observedButton = button;
          resizeObserver = new ResizeObserver(updatePosition);
          resizeObserver.observe(button);
        }

        const rect = button.getBoundingClientRect();
        const wheelSize = 48;
        const gap = 8;

        setPosition({
          left: rect.left + rect.width / 2 - wheelSize / 2,
          top: Math.max(8, rect.top - wheelSize - gap),
        });
      });
    };

    updatePosition();

    const mutationObserver = new MutationObserver(updatePosition);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const intervalId = window.setInterval(updatePosition, 900);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(intervalId);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (honkTimerRef.current !== null) {
        window.clearTimeout(honkTimerRef.current);
      }

      if (specialTimerRef.current !== null) {
        window.clearTimeout(specialTimerRef.current);
      }
    };
  }, []);

  function showHonkBurst() {
    if (honkTimerRef.current !== null) {
      window.clearTimeout(honkTimerRef.current);
    }

    setHonkId((current) => current + 1);
    setShowHonks(true);

    honkTimerRef.current = window.setTimeout(() => {
      setShowHonks(false);
      honkTimerRef.current = null;
    }, 1050);
  }

  function activateSpecial() {
    unlockAchievement("notes_horn_warning");
    if (specialTimerRef.current !== null) {
      window.clearTimeout(specialTimerRef.current);
    }

    setSpecialActive(true);

    specialTimerRef.current = window.setTimeout(() => {
      setSpecialActive(false);
      specialTimerRef.current = null;
    }, 3600);
  }

  function handleHornClick() {
    showHonkBurst();

    const nextCount = clickCount + 1;

    if (nextCount >= SPECIAL_THRESHOLD) {
      setClickCount(0);
      sessionStorage.setItem(CLICK_KEY, "0");
      activateSpecial();
      return;
    }

    setClickCount(nextCount);
    sessionStorage.setItem(CLICK_KEY, String(nextCount));
  }

  if (!position || typeof document === "undefined") {
    return null;
  }

  const wheelStyle = {
    left: `${position.left}px`,
    top: `${position.top}px`,
  } as CSSProperties;

  return createPortal(
    <div className="notes-horn-layer">
      <div
        className={`notes-horn-widget ${
          specialActive ? "is-special" : ""
        }`}
        style={wheelStyle}
      >
        {specialActive && (
          <div
            className="notes-horn-special-message"
            role="status"
            aria-live="assertive"
          >
            BÜTÜN SARIŞINLAR ANTEPLİYE BAKIYOR
          </div>
        )}

        <button
          type="button"
          className="notes-horn-button"
          onClick={handleHornClick}
          aria-label="Kornaya bas"
          title="Kornaya bas"
        >
          <SteeringWheelIcon />
        </button>

        {showHonks && (
          <div
            key={honkId}
            className="notes-horn-burst"
            aria-hidden="true"
          >
            <span className="notes-honk notes-honk-1">honk!</span>
            <span className="notes-honk notes-honk-2">honk!</span>
            <span className="notes-honk notes-honk-3">📣</span>
          </div>
        )}

        {specialActive && (
          <div className="notes-horn-smoke" aria-hidden="true">
            <span className="notes-smoke notes-smoke-1" />
            <span className="notes-smoke notes-smoke-2" />
            <span className="notes-smoke notes-smoke-3" />
            <span className="notes-smoke notes-smoke-4" />
            <span className="notes-smoke notes-smoke-5" />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
