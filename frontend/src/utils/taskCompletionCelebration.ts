import { unlockAchievement } from "../lib/achievements";

let activeCelebration: HTMLDivElement | null = null;
let removeTimer: number | null = null;

const confettiPieces = [
  { x: -118, y: -78, r: -18, d: 0, c: "pink" },
  { x: -88, y: -118, r: 24, d: 40, c: "lilac" },
  { x: -48, y: -136, r: -42, d: 90, c: "yellow" },
  { x: -12, y: -124, r: 18, d: 130, c: "mint" },
  { x: 38, y: -142, r: 48, d: 65, c: "pink" },
  { x: 78, y: -116, r: -24, d: 110, c: "peach" },
  { x: 118, y: -72, r: 28, d: 30, c: "lilac" },
  { x: -136, y: -26, r: 52, d: 100, c: "mint" },
  { x: 136, y: -20, r: -38, d: 150, c: "yellow" },
  { x: -126, y: 34, r: -12, d: 55, c: "peach" },
  { x: 128, y: 44, r: 46, d: 85, c: "pink" },
  { x: -100, y: 86, r: 30, d: 140, c: "lilac" },
  { x: -56, y: 112, r: -30, d: 70, c: "yellow" },
  { x: 4, y: 126, r: 20, d: 20, c: "mint" },
  { x: 58, y: 110, r: 42, d: 125, c: "peach" },
  { x: 102, y: 84, r: -46, d: 45, c: "pink" }
] as const;

function removeCelebration() {
  if (!activeCelebration) return;

  const overlay = activeCelebration;
  activeCelebration = null;

  if (removeTimer !== null) {
    window.clearTimeout(removeTimer);
    removeTimer = null;
  }

  overlay.classList.add("is-leaving");

  window.setTimeout(() => {
    overlay.remove();
  }, 320);
}

export function showTaskCompletionCelebration() {
  if (typeof document === "undefined") return;

  unlockAchievement("task_completion_rainbow_cat");

  removeCelebration();

  const overlay = document.createElement("div");
  overlay.className = "task-completion-celebration";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-label", "Görev tamamlandı");

  const confetti = document.createElement("div");
  confetti.className = "task-completion-confetti";
  confetti.setAttribute("aria-hidden", "true");

  confettiPieces.forEach((piece) => {
    const item = document.createElement("span");
    item.className = `task-confetti-piece task-confetti-${piece.c}`;
    item.style.setProperty("--confetti-x", `${piece.x}px`);
    item.style.setProperty("--confetti-y", `${piece.y}px`);
    item.style.setProperty("--confetti-r", `${piece.r}deg`);
    item.style.setProperty("--confetti-delay", `${piece.d}ms`);
    confetti.appendChild(item);
  });

  const imageWrap = document.createElement("div");
  imageWrap.className = "task-completion-image-wrap";

  const image = document.createElement("img");
  image.className = "task-completion-image";
  image.src = "/images/task-complete-cat.png";
  image.alt = "";
  image.decoding = "async";
  image.draggable = false;

  imageWrap.appendChild(image);
  overlay.append(confetti, imageWrap);
  document.body.appendChild(overlay);

  activeCelebration = overlay;

  window.requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
  });

  removeTimer = window.setTimeout(removeCelebration, 1650);
}
