import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { getAchievementOwnerKey } from "../lib/achievements";
import {
  AVATAR_REWARD_CHANGE_EVENT,
  isAvatarRewardUnlocked,
} from "../lib/avatarRewards";

type AvatarSize = "small" | "large";

interface ProfileAvatarProps {
  fullName: string;
  size?: AvatarSize;
}

const AVATAR_STORAGE_KEY = "miodesk_avatar";
const AVATAR_CHANGE_EVENT = "miodesk-avatar-change";

const baseAvatarOptions = [
  {
    id: "car",
    label: "Araba",
    src: "/avatars/avatar-car.webp",
  },
  {
    id: "cat",
    label: "Gökkuşağı Kedisi",
    src: "/avatars/avatar-cat.webp",
  },
  {
    id: "blonde",
    label: "Pembe Moda",
    src: "/avatars/avatar-blonde.webp",
  },
  {
    id: "dark-haired",
    label: "Siyah Saçlı Sporcu",
    src: "/avatars/avatar-dark-haired.webp",
  },
  {
    id: "piano",
    label: "Piyano",
    src: "/avatars/avatar-piano.webp",
  },
] as const;

const rewardAvatarOptions = [
  {
    id: "proud-jake",
    label: "Gururlu Jake",
    src: "/avatars/avatar-proud-jake.png",
  },
  {
    id: "jedi-ataturk",
    label: "Jedi Atatürk",
    src: "/avatars/avatar-jedi-ataturk.png",
  },
] as const;

const avatarOptions = [
  ...baseAvatarOptions,
  ...rewardAvatarOptions,
] as const;

type AvatarId = (typeof avatarOptions)[number]["id"];
type RewardAvatarId =
  (typeof rewardAvatarOptions)[number]["id"];

const rewardAvatarIds = new Set<string>(
  rewardAvatarOptions.map((avatar) => avatar.id),
);

const avatarSelectionMessages: Record<AvatarId, string> = {
  car: "Asla alamayacağınız o makinayı seçtiniz.",
  cat: "Kedy seçtin la.",
  blonde: "Saadetdere Magandasını seçtiniz.",
  "dark-haired":
    "Kapaklı piyasasının yeni müdavimini seçtiniz. HERKES KENDİNE DİKKAT ETSİN!",
  piano: "Ünsüz bir piyanisti seçtiniz.",
  "proud-jake":
    "Gururu yüzüne yansıyan bir Jake seçtiniz.",
  "jedi-ataturk":
    "Cumhuriyeti kurmak için gücü kullanan bir yüceyi seçtiniz.",
};

function isAvatarId(value: string | null): value is AvatarId {
  return avatarOptions.some((avatar) => avatar.id === value);
}

function isRewardAvatar(
  value: AvatarId,
): value is RewardAvatarId {
  return rewardAvatarIds.has(value);
}

function readStoredAvatar(
  rewardUnlocked: boolean,
): AvatarId {
  const stored = window.localStorage.getItem(
    AVATAR_STORAGE_KEY,
  );

  if (!isAvatarId(stored)) return "cat";

  if (!rewardUnlocked && isRewardAvatar(stored)) {
    window.localStorage.setItem(
      AVATAR_STORAGE_KEY,
      "cat",
    );

    return "cat";
  }

  return stored;
}

export function ProfileAvatar({
  fullName,
  size = "small",
}: ProfileAvatarProps) {
  const initialRewardUnlocked =
    isAvatarRewardUnlocked();

  const [rewardUnlocked, setRewardUnlocked] =
    useState(initialRewardUnlocked);
  const [selectedId, setSelectedId] =
    useState<AvatarId>(() =>
      readStoredAvatar(initialRewardUnlocked),
    );
  const [open, setOpen] = useState(false);
  const [selectionMessage, setSelectionMessage] =
    useState<string | null>(null);
  const [messageSequence, setMessageSequence] =
    useState(0);

  const messageTimerRef = useRef<number | null>(null);
  const ownerKeyRef = useRef(getAchievementOwnerKey());

  const visibleAvatarOptions = useMemo(
    () =>
      rewardUnlocked
        ? avatarOptions
        : baseAvatarOptions,
    [rewardUnlocked],
  );

  const selectedAvatar =
    avatarOptions.find(
      (avatar) => avatar.id === selectedId,
    ) ?? baseAvatarOptions[1];

  useEffect(() => {
    const syncReward = () => {
      const nextOwnerKey = getAchievementOwnerKey();
      const nextRewardUnlocked =
        isAvatarRewardUnlocked();

      ownerKeyRef.current = nextOwnerKey;
      setRewardUnlocked(nextRewardUnlocked);

      setSelectedId((current) => {
        if (
          !nextRewardUnlocked &&
          isRewardAvatar(current)
        ) {
          window.localStorage.setItem(
            AVATAR_STORAGE_KEY,
            "cat",
          );

          return "cat";
        }

        return current;
      });
    };

    const handleAvatarChange = () => {
      const nextRewardUnlocked =
        isAvatarRewardUnlocked();

      setRewardUnlocked(nextRewardUnlocked);
      setSelectedId(
        readStoredAvatar(nextRewardUnlocked),
      );
    };

    const intervalId = window.setInterval(() => {
      if (
        getAchievementOwnerKey() !==
        ownerKeyRef.current
      ) {
        syncReward();
      }
    }, 600);

    window.addEventListener(
      AVATAR_REWARD_CHANGE_EVENT,
      syncReward as EventListener,
    );
    window.addEventListener(
      AVATAR_CHANGE_EVENT,
      handleAvatarChange,
    );
    window.addEventListener("storage", syncReward);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        AVATAR_REWARD_CHANGE_EVENT,
        syncReward as EventListener,
      );
      window.removeEventListener(
        AVATAR_CHANGE_EVENT,
        handleAvatarChange,
      );
      window.removeEventListener(
        "storage",
        syncReward,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current !== null) {
        window.clearTimeout(
          messageTimerRef.current,
        );
      }
    };
  }, []);

  function selectAvatar(id: AvatarId) {
    if (
      isRewardAvatar(id) &&
      !rewardUnlocked
    ) {
      return;
    }

    window.localStorage.setItem(
      AVATAR_STORAGE_KEY,
      id,
    );

    setSelectedId(id);
    window.dispatchEvent(
      new Event(AVATAR_CHANGE_EVENT),
    );
    setOpen(false);

    setSelectionMessage(
      avatarSelectionMessages[id],
    );
    setMessageSequence(
      (current) => current + 1,
    );

    if (messageTimerRef.current !== null) {
      window.clearTimeout(
        messageTimerRef.current,
      );
    }

    messageTimerRef.current =
      window.setTimeout(() => {
        setSelectionMessage(null);
        messageTimerRef.current = null;
      }, 3400);
  }

  const picker =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="miodesk-avatar-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                setOpen(false);
              }
            }}
          >
            <section
              className={`miodesk-avatar-modal-dialog ${
                rewardUnlocked ? "has-reward-avatars" : ""
              }`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="miodesk-avatar-modal-title"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="miodesk-avatar-modal-header">
                <div>
                  <span className="eyebrow">
                    Kişiselleştirme
                  </span>
                  <h2 id="miodesk-avatar-modal-title">
                    Avatarını seç
                  </h2>
                  <p>
                    Seçimin bu cihazda otomatik
                    olarak saklanır.
                  </p>
                </div>

                <button
                  type="button"
                  className="miodesk-avatar-modal-close"
                  onClick={() => setOpen(false)}
                  aria-label="Avatar seçiciyi kapat"
                >
                  ×
                </button>
              </div>

              <div className="miodesk-avatar-modal-scroll">
                <div className="miodesk-avatar-modal-grid">
                  {visibleAvatarOptions.map(
                    (avatar) => {
                      const selected =
                        avatar.id === selectedId;
                      const rewardAvatar =
                        rewardAvatarIds.has(
                          avatar.id,
                        );

                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          className={`miodesk-avatar-modal-option ${
                            selected
                              ? "is-selected"
                              : ""
                          } ${
                            rewardAvatar
                              ? "is-reward"
                              : ""
                          }`}
                          onClick={() =>
                            selectAvatar(avatar.id)
                          }
                          aria-pressed={selected}
                        >
                          <span className="miodesk-avatar-modal-image">
                            <img
                              src={avatar.src}
                              alt=""
                              draggable={false}
                            />

                            {selected && (
                              <span className="miodesk-avatar-modal-check">
                                ✓
                              </span>
                            )}
                          </span>

                          <strong>
                            {avatar.label}
                          </strong>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={`miodesk-profile-avatar miodesk-profile-avatar-${size}`}
        onClick={() => setOpen(true)}
        aria-label={`${fullName} için profil avatarını değiştir`}
        title="Avatarı değiştir"
      >
        <img
          src={selectedAvatar.src}
          alt=""
          draggable={false}
        />
      </button>

      {picker}

      {selectionMessage &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="avatar-selection-message-layer">
            <div
              key={messageSequence}
              className="avatar-selection-message"
              role="status"
              aria-live="polite"
            >
              {selectionMessage}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
