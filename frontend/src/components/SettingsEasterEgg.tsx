import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { unlockAchievement } from "../lib/achievements";

const PROGRESS_KEY = "miodesk_settings_easter_egg_progress";
const SOLVED_KEY = "miodesk_settings_easter_egg_solved";
const CLOSED_KEY = "miodesk_settings_easter_egg_closed";
const expectedNames = ["haşim", "eren", "metin", "arda", "ezgi"];

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").normalize("NFKC").replace(/\s+/g, " ");
}

function readProgress(): number[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PROGRESS_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is number => Number.isInteger(value) && value >= 1 && value <= 3)
      : [];
  } catch {
    return [];
  }
}

function SakuraIcon() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <g className="secret-sakura-petals">
        <ellipse cx="20" cy="10" rx="6.5" ry="9" />
        <ellipse cx="30" cy="17" rx="6.5" ry="9" transform="rotate(72 30 17)" />
        <ellipse cx="26" cy="29" rx="6.5" ry="9" transform="rotate(144 26 29)" />
        <ellipse cx="14" cy="29" rx="6.5" ry="9" transform="rotate(216 14 29)" />
        <ellipse cx="10" cy="17" rx="6.5" ry="9" transform="rotate(288 10 17)" />
      </g>
      <circle className="secret-sakura-center" cx="20" cy="20" r="4.4" />
    </svg>
  );
}

export function SettingsEasterEgg() {
  const [found, setFound] = useState<number[]>(() => readProgress());
  const [toast, setToast] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [answers, setAnswers] = useState(["", "", "", "", ""]);
  const [attemptMessage, setAttemptMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(() => sessionStorage.getItem(SOLVED_KEY) === "true");
  const [vaultOpen, setVaultOpen] = useState(() => {
    return readProgress().length === 3 &&
      sessionStorage.getItem(SOLVED_KEY) !== "true" &&
      sessionStorage.getItem(CLOSED_KEY) !== "true";
  });

  const toastTimer = useRef<number | null>(null);
  const vaultTimer = useRef<number | null>(null);
  const foundSet = useMemo(() => new Set(found), [found]);

  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    if (vaultTimer.current !== null) window.clearTimeout(vaultTimer.current);
  }, []);

  useEffect(() => {
    if (!vaultOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [vaultOpen]);

  function showToast(message: string, duration = 2100) {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast(message);
    setToastKey((value) => value + 1);
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, duration);
  }

  function findFlower(id: number) {
    if (foundSet.has(id) || solved) return;
    const next = [...found, id];
    setFound(next);
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(next));

    if (next.length === 1) {
      showToast("Helal gardaş, 2 tane daha kaldı");
      return;
    }

    if (next.length === 2) {
      showToast("Tabana kuvvet bacım, son yaprak");
      return;
    }

    showToast("MAHZENE ERİŞTİN!", 1200);
    vaultTimer.current = window.setTimeout(() => {
      setVaultOpen(true);
      vaultTimer.current = null;
    }, 850);
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  function checkAnswers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = answers.map(normalizeName);
    const expected = expectedNames.map(normalizeName);
    const submittedSorted = [...submitted].sort((a, b) => a.localeCompare(b, "tr-TR"));
    const expectedSorted = [...expected].sort((a, b) => a.localeCompare(b, "tr-TR"));

    const correct = submitted.every(Boolean) &&
      new Set(submitted).size === expected.length &&
      submittedSorted.every((name, index) => name === expectedSorted[index]);

    if (!correct) {
      setAttemptMessage("şakaydı olm istediğin kadar dene.");
      return;
    }

    setAttemptMessage(null);
    setSolved(true);
    unlockAchievement("basement_reward");
    sessionStorage.setItem(SOLVED_KEY, "true");
  }

  function closeReward() {
    setVaultOpen(false);
    sessionStorage.setItem(CLOSED_KEY, "true");
  }

  const body = typeof document === "undefined" ? null : document.body;

  return (
    <>
      {!solved && (
        <div className="settings-secret-sakura-layer">
          {[1, 2, 3].map((id) => (
            <button
              key={id}
              type="button"
              className={`settings-secret-sakura settings-secret-sakura-${id} ${foundSet.has(id) ? "is-found" : ""}`}
              onClick={() => findFlower(id)}
              aria-label={`Sakura süsü ${id}`}
              disabled={foundSet.has(id)}
            >
              <SakuraIcon />
            </button>
          ))}
        </div>
      )}

      {body && toast && createPortal(
        <div className="settings-easter-toast-layer" aria-hidden="true">
          <div key={toastKey} className="settings-easter-toast" role="status" aria-live="polite">
            {toast}
          </div>
        </div>,
        body,
      )}

      {body && vaultOpen && createPortal(
        <div className="settings-vault-layer">
          <section className={`settings-vault-dialog ${solved ? "is-reward" : "is-question"}`} role="dialog" aria-modal="true" aria-labelledby="settings-vault-title">
            {solved ? (
              <>
                <button type="button" className="settings-vault-close" onClick={closeReward} aria-label="Ödül ekranını kapat">×</button>
                <span className="settings-vault-eyebrow">Gizli koleksiyon</span>
                <h2 id="settings-vault-title">İŞTE ÖDÜLÜN!</h2>
                <figure className="settings-vault-reward">
                  <img src="/easter-eggs/2023-eren-kreasyonu.png" alt="2023 Eren Kreasyonu" draggable={false} />
                  <figcaption>2023 Eren Kreasyonu</figcaption>
                </figure>
              </>
            ) : (
              <>
                <span className="settings-vault-eyebrow">MioDesk Mahzeni</span>
                <h2 id="settings-vault-title">MAHZENE ERİŞTİN!</h2>
                <p className="settings-vault-question">
                  Mahşerin beşlisinin sadece isimlerini yaz. <strong>TEK ŞANSIN VAR.</strong>
                </p>
                <form className="settings-vault-form" onSubmit={checkAnswers}>
                  <div className="settings-vault-inputs">
                    {answers.map((answer, index) => (
                      <label key={index}>
                        <span>İsim {index + 1}</span>
                        <input
                          value={answer}
                          onChange={(event) => updateAnswer(index, event.target.value)}
                          autoComplete="off"
                          spellCheck={false}
                          required
                        />
                      </label>
                    ))}
                  </div>
                  {attemptMessage && <p className="settings-vault-attempt-message" role="alert">{attemptMessage}</p>}
                  <button type="submit" className="settings-vault-submit">Cevapları Kontrol Et</button>
                </form>
              </>
            )}
          </section>
        </div>,
        body,
      )}
    </>
  );
}
