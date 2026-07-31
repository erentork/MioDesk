import { useEffect, useMemo, useRef, useState } from "react";
import { AVATAR_REWARD_CHANGE_EVENT, isAvatarRewardUnlocked, unlockAvatarReward } from "../lib/avatarRewards";
import {
  ACHIEVEMENT_RESET_NOTICE_KEY,
  getAchievementCards,
  getAchievementOwnerKey,
  resetCurrentAccountAchievements,
  type AchievementCardView,
  type AchievementId,
} from "../lib/achievements";

function TrophyIcon({ unlocked }: { unlocked: boolean }) {
  return (
    <svg
      className={`achievement-trophy ${unlocked ? "is-unlocked" : ""}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <path
        className="achievement-trophy-cup"
        d="M20 8h24v11c0 9.2-5.1 17.2-12 20-6.9-2.8-12-10.8-12-20V8Z"
      />
      <path
        className="achievement-trophy-handle"
        d="M20 14H10v7c0 7.7 6.3 14 14 14M44 14h10v7c0 7.7-6.3 14-14 14"
      />
      <path
        className="achievement-trophy-base"
        d="M32 39v9M24 48h16M20 55h24"
      />
      <path
        className="achievement-trophy-star"
        d="m32 16 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L32 16Z"
      />
    </svg>
  );
}

function formatUnlockDate(value: string | null) {
  if (!value) return null;

  try {
    return new Date(value).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function createCardsSignature(cards: AchievementCardView[]) {
  return JSON.stringify(
    cards.map((card) => ({
      id: card.id,
      unlocked: card.unlocked,
      unlockedAt: card.unlockedAt,
      title: card.title,
    })),
  );
}

export function AchievementsPanel() {
  const [cards, setCards] = useState<AchievementCardView[]>(() =>
    getAchievementCards(),
  );

  const [revealedHints, setRevealedHints] = useState<
    Partial<Record<AchievementId, boolean>>
  >({});

  const [resetNotice, setResetNotice] = useState(
    () =>
      window.sessionStorage.getItem(
        ACHIEVEMENT_RESET_NOTICE_KEY,
      ) === "1",
  );

  const ownerKeyRef = useRef(getAchievementOwnerKey());

  const [avatarRewardUnlocked, setAvatarRewardUnlocked] =
    useState(() => isAvatarRewardUnlocked());
  const avatarRewardOwnerKeyRef =
    useRef(getAchievementOwnerKey());

  useEffect(() => {
    const refreshAvatarReward = () => {
      avatarRewardOwnerKeyRef.current =
        getAchievementOwnerKey();

      setAvatarRewardUnlocked(
        isAvatarRewardUnlocked(),
      );
    };

    const accountWatcher = window.setInterval(() => {
      if (
        getAchievementOwnerKey() !==
        avatarRewardOwnerKeyRef.current
      ) {
        refreshAvatarReward();
      }
    }, 600);

    window.addEventListener(
      AVATAR_REWARD_CHANGE_EVENT,
      refreshAvatarReward as EventListener,
    );
    window.addEventListener(
      "storage",
      refreshAvatarReward,
    );

    return () => {
      window.clearInterval(accountWatcher);
      window.removeEventListener(
        AVATAR_REWARD_CHANGE_EVENT,
        refreshAvatarReward as EventListener,
      );
      window.removeEventListener(
        "storage",
        refreshAvatarReward,
      );
    };
  }, []);
  const cardsSignatureRef = useRef(createCardsSignature(cards));
  const resetNoticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      const nextOwnerKey = getAchievementOwnerKey();
      const nextCards = getAchievementCards();
      const nextSignature = createCardsSignature(nextCards);

      if (nextOwnerKey !== ownerKeyRef.current) {
        setRevealedHints({});
      }

      ownerKeyRef.current = nextOwnerKey;

      if (nextSignature !== cardsSignatureRef.current) {
        cardsSignatureRef.current = nextSignature;
        setCards(nextCards);
      }
    };

    const handleAchievementUpdate = () => refresh();

    window.addEventListener(
      "miodesk:achievement-updated",
      handleAchievementUpdate,
    );
    window.addEventListener(
      "miodesk:achievement-unlocked",
      handleAchievementUpdate,
    );
    window.addEventListener("storage", handleAchievementUpdate);
    window.addEventListener("focus", handleAchievementUpdate);
    document.addEventListener(
      "visibilitychange",
      handleAchievementUpdate,
    );

    const syncInterval = window.setInterval(refresh, 450);

    if (resetNotice) {
      window.sessionStorage.removeItem(
        ACHIEVEMENT_RESET_NOTICE_KEY,
      );

      resetNoticeTimerRef.current = window.setTimeout(() => {
        setResetNotice(false);
        resetNoticeTimerRef.current = null;
      }, 2800);
    }

    return () => {
      window.clearInterval(syncInterval);

      if (resetNoticeTimerRef.current !== null) {
        window.clearTimeout(resetNoticeTimerRef.current);
      }

      window.removeEventListener(
        "miodesk:achievement-updated",
        handleAchievementUpdate,
      );
      window.removeEventListener(
        "miodesk:achievement-unlocked",
        handleAchievementUpdate,
      );
      window.removeEventListener("storage", handleAchievementUpdate);
      window.removeEventListener("focus", handleAchievementUpdate);
      document.removeEventListener(
        "visibilitychange",
        handleAchievementUpdate,
      );
    };
  }, [resetNotice]);

  const unlockedCount = useMemo(
    () => cards.filter((card) => card.unlocked).length,
    [cards],
  );
  const collectionComplete =
    cards.length > 0 &&
    unlockedCount === cards.length;

  function handleClaimAvatarReward() {
    if (!collectionComplete) return;

    unlockAvatarReward();
    setAvatarRewardUnlocked(true);
  }

  function toggleHint(id: AchievementId) {
    setRevealedHints((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function handleResetAchievements() {
    const confirmed = window.confirm(
      "Bu hesaptaki tüm başarımlar sıfırlansın mı? Daha sonra yeniden kazanabilirsin.",
    );

    if (!confirmed) return;

    resetCurrentAccountAchievements();

    /*
     * Easter egg bileşenlerinin React state'leri de ilk hâline dönsün diye
     * sayfayı yeniliyoruz. Böylece eski sayaçlar hayalet başarım açamaz.
     */
    window.location.reload();
  }

  return (
    <section className="achievements-section">
      <div className="achievements-header">
        <div>
          <span className="eyebrow">Başarımlar</span>
          <h2>Koleksiyon</h2>
          <p>
            Easter egg’leri keşfettikçe kupaları aç. Yeni gizemler geldikçe
            burayı birlikte büyütürüz.
          </p>
        </div>

        <div className="achievements-summary">
          <strong>{unlockedCount}</strong>
          <span>/ {cards.length} açıldı</span>
        </div>
      </div>

      <div className="achievements-grid">
        {cards.map((card) => {
          const unlockedDate = formatUnlockDate(card.unlockedAt);
          const hintVisible = Boolean(revealedHints[card.id]);

          return (
            <article
              key={card.id}
              className={`achievement-card ${
                card.unlocked ? "is-unlocked" : "is-locked"
              }`}
            >
              <div className="achievement-card-top">
                <div className="achievement-icon-wrap">
                  <TrophyIcon unlocked={card.unlocked} />
                </div>

                <span
                  className={`achievement-badge ${
                    card.unlocked ? "is-unlocked" : ""
                  }`}
                >
                  {card.unlocked ? "Açıldı" : "Kilitli"}
                </span>
              </div>

              <h3>{card.title}</h3>

              {card.unlocked ? (
                <p className="achievement-description">
                  {card.description}
                </p>
              ) : card.hidden ? (
                <div
                  className="achievement-locked-placeholder"
                  aria-label="Gizli başarım"
                >
                  ???
                </div>
              ) : (
                <div className="achievement-hint-reveal-area">
                  <button
                    type="button"
                    className={`achievement-hint-toggle ${
                      hintVisible ? "is-open" : ""
                    }`}
                    onClick={() => toggleHint(card.id)}
                    aria-expanded={hintVisible}
                  >
                    <span>{hintVisible ? "İpucunu gizle" : "İpucunu gör"}</span>
                    <strong aria-hidden="true">
                      {hintVisible ? "−" : "?"}
                    </strong>
                  </button>

                  {hintVisible && (
                    <div className="achievement-hint achievement-hint-revealed">
                      {card.hint}
                    </div>
                  )}
                </div>
              )}

              <div className="achievement-footer">
                <span>
                  {card.unlocked ? "Kazanıldı" : "Henüz kazanılmadı"}
                </span>

                {card.unlocked && unlockedDate ? (
                  <strong>{unlockedDate}</strong>
                ) : (
                  <strong>—</strong>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {collectionComplete ? (
        <section
          className={`achievement-collection-reward ${
            avatarRewardUnlocked ? "is-claimed" : ""
          }`}
          aria-live="polite"
        >
          <div className="achievement-collection-reward-copy">
            <span className="eyebrow">
              Koleksiyon Ödülü
            </span>
            <h3>Koleksiyonu tamamladın!</h3>

            {avatarRewardUnlocked ? (
              <p>
                Gururlu Jake ve Jedi Atatürk avatar
                koleksiyonuna eklendi.
              </p>
            ) : (
              <button
                type="button"
                className="achievement-reward-claim-button"
                onClick={handleClaimAvatarReward}
              >
                ÖDÜLÜNÜ ALMAK İÇİN TIKLA!
              </button>
            )}
          </div>

          <div
            className="achievement-reward-avatar-preview"
            aria-hidden="true"
          >
            <img
              src="/avatars/avatar-proud-jake.png"
              alt=""
            />
            <img
              src="/avatars/avatar-jedi-ataturk.png"
              alt=""
            />
          </div>
        </section>
      ) : null}
      <div className="achievements-reset-row">
        <button
          type="button"
          className="achievements-reset-button"
          onClick={handleResetAchievements}
        >
          Başarımları sıfırla
        </button>

        {resetNotice && (
          <span className="achievements-reset-notice" role="status">
            Başarımlar sıfırlandı. Artık yeniden kazanabilirsin.
          </span>
        )}
      </div>
    </section>
  );
}
