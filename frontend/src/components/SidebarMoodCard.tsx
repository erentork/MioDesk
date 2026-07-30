import { useState } from "react";
import { unlockAchievement } from "../lib/achievements";

export function SidebarMoodCard() {
  const [isCalm, setIsCalm] = useState(false);
  function handleMoodToggle() {
    setIsCalm((current) => !current);
    unlockAchievement("sidebar_cat_mood");
  }

  const quote = isCalm
    ? "Annem balık yapmış"
    : "Cumartesi iptal oldu";

  return (
    <section className={`sidebar-mood-card ${isCalm ? "is-calm" : "is-angry"}`}>
      <button
        type="button"
        className="sidebar-mood-cat-button"
        onClick={handleMoodToggle}
        aria-pressed={isCalm}
        aria-label={isCalm ? "Kediyi tekrar sinirlendir" : "Kediyi sakinleştir"}
        title={isCalm ? "Tekrar sinirlendir" : "Sakinleştir"}
      >
        <svg
          className="sidebar-mood-cat"
          viewBox="0 0 240 210"
          role="img"
          aria-label={isCalm ? "Sakin MioDesk kedisi" : "Sinirli MioDesk kedisi"}
        >
          <ellipse className="mood-cat-shadow" cx="120" cy="190" rx="68" ry="12" />

          {!isCalm && (
            <>
              <g className="mood-flame mood-flame-left">
                <path
                  className="mood-flame-outer"
                  d="M39 93c-14-14-7-31 7-42-1 12 12 14 10 28-1 10-8 17-17 14Z"
                />
                <path
                  className="mood-flame-inner"
                  d="M44 87c-7-8-3-17 4-23 0 7 7 8 6 16-1 5-5 9-10 7Z"
                />
              </g>

              <g className="mood-flame mood-flame-right">
                <path
                  className="mood-flame-outer"
                  d="M201 93c14-14 7-31-7-42 1 12-12 14-10 28 1 10 8 17 17 14Z"
                />
                <path
                  className="mood-flame-inner"
                  d="M196 87c7-8 3-17-4-23 0 7-7 8-6 16 1 5 5 9 10 7Z"
                />
              </g>
            </>
          )}

          <g className="mood-cat-body">
            <path
              className="mood-cat-ear mood-cat-ear-left"
              d="M78 65 61 25l39 27Z"
            />
            <path
              className="mood-cat-ear mood-cat-ear-right"
              d="m162 65 17-40-39 27Z"
            />
            <path className="mood-cat-ear-inner" d="m78 53-9-20 22 16Z" />
            <path className="mood-cat-ear-inner" d="m162 53 9-20-22 16Z" />

            <path
              className="mood-cat-head"
              d="M120 42c-42 0-70 27-70 68 0 48 27 73 70 73s70-25 70-73c0-41-28-68-70-68Z"
            />

            <ellipse className="mood-cat-blush" cx="82" cy="126" rx="12" ry="7" />
            <ellipse className="mood-cat-blush" cx="158" cy="126" rx="12" ry="7" />

            {isCalm ? (
              <>
                <path className="mood-cat-face-line" d="M82 103q10 10 20 0" />
                <path className="mood-cat-face-line" d="M138 103q10 10 20 0" />
                <path className="mood-cat-mouth" d="M120 121q-8 10-17 4" />
                <path className="mood-cat-mouth" d="M120 121q8 10 17 4" />
              </>
            ) : (
              <>
                <path className="mood-cat-brow" d="m78 91 24 9" />
                <path className="mood-cat-brow" d="m162 91-24 9" />
                <path className="mood-cat-angry-eye" d="m83 104 17-3" />
                <path className="mood-cat-angry-eye" d="m140 101 17 3" />
                <path className="mood-cat-angry-mouth" d="M105 132q15-13 30 0" />
              </>
            )}

            <path className="mood-cat-nose" d="m115 116 5 5 5-5Z" />

            <path className="mood-cat-whisker" d="m75 116-34-5" />
            <path className="mood-cat-whisker" d="m74 127-36 3" />
            <path className="mood-cat-whisker" d="m165 116 34-5" />
            <path className="mood-cat-whisker" d="m166 127 36 3" />

            <g className="mood-cat-bow" transform="translate(147 55)">
              <path d="M10 10C1-2-10 4-8 15c2 11 18 19 18 19s16-8 18-19C30 4 19-2 10 10Z" />
              <circle cx="10" cy="15" r="5" />
            </g>

            {isCalm && (
              <g className="mood-fish" transform="translate(92 146)">
                <path d="M0 8c10-12 30-12 41 0-11 12-31 12-41 0Z" />
                <path d="m39 8 15-10v20Z" />
                <circle cx="10" cy="6" r="1.8" />
              </g>
            )}
          </g>

          {!isCalm && (
            <>
              <path className="mood-anger-mark" d="M185 37v13M178 44h14" />
              <path className="mood-anger-mark mood-anger-mark-small" d="M53 41v9M48 46h10" />
            </>
          )}
        </svg>
      </button>

      <div className="sidebar-mood-quote-card" aria-live="polite">
        <p>{quote}</p>
        <span aria-hidden="true">{isCalm ? "♡" : "!"}</span>
      </div>
    </section>
  );
}