import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { unlockAchievement } from "../lib/achievements";

const CLICK_STORAGE_KEY = "miodesk_dashboard_cat_clicks";
const ATTACK_THRESHOLD = 15;

interface TomatoAttack {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

function readClickCount() {
  const value = Number(sessionStorage.getItem(CLICK_STORAGE_KEY) ?? "0");
  return Number.isFinite(value) && value >= 0 && value < ATTACK_THRESHOLD
    ? value
    : 0;
}

function TomatoIcon() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <path
        className="dashboard-tomato-body"
        d="M12 43C12 25 24 14 40 14s28 11 28 29c0 18-12 29-28 29S12 61 12 43Z"
      />
      <path
        className="dashboard-tomato-shine"
        d="M25 28c5-7 13-9 20-7"
      />
      <path
        className="dashboard-tomato-leaf"
        d="m40 17-9-12 11 6 8-9-2 12 13 1-12 6-9-4Z"
      />
    </svg>
  );
}

export function DashboardInteractiveMascot() {
  const [clickCount, setClickCount] = useState(readClickCount);
  const [angry, setAngry] = useState(false);
  const [speechVisible, setSpeechVisible] = useState(false);
  const [attack, setAttack] = useState<TomatoAttack | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const angryTimerRef = useRef<number | null>(null);
  const attackTimerRef = useRef<number | null>(null);
  const speechTimerRef = useRef<number | null>(null);
  const attackIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (angryTimerRef.current !== null) {
        window.clearTimeout(angryTimerRef.current);
      }

      if (attackTimerRef.current !== null) {
        window.clearTimeout(attackTimerRef.current);
      }

      if (speechTimerRef.current !== null) {
        window.clearTimeout(speechTimerRef.current);
      }
    };
  }, []);

  function brieflyAnger() {
    setAngry(true);

    if (angryTimerRef.current !== null) {
      window.clearTimeout(angryTimerRef.current);
    }

    angryTimerRef.current = window.setTimeout(() => {
      setAngry(false);
      angryTimerRef.current = null;
    }, 780);
  }

  function launchTomatoAttack() {
    unlockAchievement("dashboard_cat_warning");
    if (angryTimerRef.current !== null) {
      window.clearTimeout(angryTimerRef.current);
      angryTimerRef.current = null;
    }

    if (attackTimerRef.current !== null) {
      window.clearTimeout(attackTimerRef.current);
    }

    if (speechTimerRef.current !== null) {
      window.clearTimeout(speechTimerRef.current);
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const startX = rect ? rect.left + rect.width * 0.38 : window.innerWidth - 70;
    const startY = rect ? rect.top + rect.height * 0.62 : 86;

    attackIdRef.current += 1;

    setAngry(true);
    setSpeechVisible(true);
    setAttack({
      id: attackIdRef.current,
      startX,
      startY,
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.52,
    });

    attackTimerRef.current = window.setTimeout(() => {
      setAttack(null);
      attackTimerRef.current = null;
    }, 1450);

    speechTimerRef.current = window.setTimeout(() => {
      setSpeechVisible(false);
      setAngry(false);
      speechTimerRef.current = null;
    }, 3650);
  }

  function handleMascotClick() {
    const nextClickCount = clickCount + 1;

    if (nextClickCount >= ATTACK_THRESHOLD) {
      setClickCount(0);
      sessionStorage.setItem(CLICK_STORAGE_KEY, "0");
      launchTomatoAttack();
      return;
    }

    setClickCount(nextClickCount);
    sessionStorage.setItem(CLICK_STORAGE_KEY, String(nextClickCount));
    brieflyAnger();
  }

  const attackStyle = attack
    ? ({
        "--tomato-start-x": `${attack.startX}px`,
        "--tomato-start-y": `${attack.startY}px`,
        "--tomato-target-x": `${attack.targetX}px`,
        "--tomato-target-y": `${attack.targetY}px`,
      } as CSSProperties)
    : undefined;

  const portalTarget = typeof document === "undefined" ? null : document.body;

  return (
    <>
      <div
        className={`dashboard-interactive-mascot ${
          angry ? "is-angry" : "is-calm"
        }`}
      >
        {speechVisible && (
          <div
            className="dashboard-cat-speech"
            role="status"
            aria-live="assertive"
          >
            TATLI ŞİŞKOYU SALARIM ÜSTÜNE!
          </div>
        )}

        <button
          ref={buttonRef}
          type="button"
          className="dashboard-cat-button"
          onClick={handleMascotClick}
          aria-label="MioDesk kedi maskotuyla etkileşime geç"
          title="Mio'ya dokun"
        >
          <svg
            className="dashboard-cat-svg"
            viewBox="0 0 220 190"
            role="img"
            aria-label={angry ? "Sinirli MioDesk kedisi" : "MioDesk kedi maskotu"}
          >
            <ellipse
              className="dashboard-cat-shadow"
              cx="110"
              cy="169"
              rx="78"
              ry="13"
            />

            <g className="dashboard-cat-character">
              <path
                className="dashboard-cat-ears"
                d="M60 82 44 40l38 20M160 82l16-42-38 20"
              />
              <path
                className="dashboard-cat-ear-inner"
                d="M52 48 63 70 76 61M168 48 157 70 144 61"
              />
              <path
                className="dashboard-cat-head"
                d="M53 102c0-42 25-66 57-66s57 24 57 66v28c0 29-24 48-57 48s-57-19-57-48Z"
              />

              {angry ? (
                <>
                  <path className="dashboard-cat-brow" d="m78 101 20 8" />
                  <path className="dashboard-cat-brow" d="m142 101-20 8" />
                  <path className="dashboard-cat-angry-eye" d="m81 113 17-2" />
                  <path className="dashboard-cat-angry-eye" d="m122 111 17 2" />
                  <path
                    className="dashboard-cat-angry-mouth"
                    d="M99 137q11-9 22 0"
                  />
                  <path className="dashboard-cat-anger-mark" d="M178 48v14M171 55h14" />
                  <path
                    className="dashboard-cat-anger-mark dashboard-cat-anger-mark-small"
                    d="M40 65v10M35 70h10"
                  />
                  <g className="dashboard-cat-steam dashboard-cat-steam-left">
                    <path d="M48 91c-9-4-10-13-3-18-1 7 7 8 5 15" />
                  </g>
                  <g className="dashboard-cat-steam dashboard-cat-steam-right">
                    <path d="M172 91c9-4 10-13 3-18 1 7-7 8-5 15" />
                  </g>
                </>
              ) : (
                <>
                  <ellipse className="dashboard-cat-eye" cx="87" cy="111" rx="6" ry="8" />
                  <ellipse className="dashboard-cat-eye" cx="133" cy="111" rx="6" ry="8" />
                  <path className="dashboard-cat-mouth" d="M104 126c4 4 8 4 12 0M110 121v5" />
                </>
              )}

              <ellipse className="dashboard-cat-blush" cx="73" cy="128" rx="13" ry="7" />
              <ellipse className="dashboard-cat-blush" cx="147" cy="128" rx="13" ry="7" />
              <path className="dashboard-cat-whiskers" d="M62 116 25 110M63 126l-38 4M158 116l37-6M157 126l38 4" />

              <g className="dashboard-cat-bow">
                <path d="M132 56c5-14 21-17 29-7 10-9 25-1 22 12-2 10-15 18-29 26-13-9-24-18-22-31Z" />
                <circle cx="157" cy="61" r="8" />
              </g>

              <g className="dashboard-cat-paw">
                <ellipse cx="73" cy="151" rx="12" ry="8" />
              </g>
            </g>
          </svg>
        </button>
      </div>

      {portalTarget &&
        attack &&
        createPortal(
          <div
            key={attack.id}
            className="dashboard-tomato-attack-layer"
            style={attackStyle}
            aria-hidden="true"
          >
            <div className="dashboard-tomato-projectile">
              <TomatoIcon />
            </div>
            <div className="dashboard-tomato-splat">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>,
          portalTarget,
        )}
    </>
  );
}
