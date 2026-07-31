export type AchievementId =
  | "sidebar_cat_mood"
  | "dashboard_cat_warning"
  | "notes_horn_warning"
  | "basement_reward"
  | "task_completion_rainbow_cat"
  | "attendance_limit_dog";

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  lockedTitle?: string;
  hint?: string;
  description: string;
  hidden?: boolean;
}

export interface AchievementCardView extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementUnlockedDetail {
  id: AchievementId;
  title: string;
  ownerKey: string;
}

const LEGACY_STORAGE_KEY = "miodesk_achievements_v1";
const STORAGE_PREFIX = "miodesk_achievements_v2";

export const ACHIEVEMENT_RESET_NOTICE_KEY =
  "miodesk_achievement_reset_notice";

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "sidebar_cat_mood",
    title: "Kedi Psikoloğu",
    hint: "Sidebar’daki sevimli dostun moduyla biraz oyna.",
    description: "Sidebar’daki kedinin ruh hâlini değiştirdin.",
  },
  {
    id: "dashboard_cat_warning",
    title: "Tatlı Şişko Alarmı",
    hint: "Ana sayfadaki kedicik bazen fazla ilgi ister.",
    description:
      "Ana sayfadaki kediyi 15 kez tetikleyip özel tehdit mesajını gördün.",
  },
  {
    id: "notes_horn_warning",
    title: "Korna Uzmanı",
    hint: "Notlar sayfasındaki direksiyonu fazla ciddiye alma.",
    description:
      "Notlar sayfasındaki direksiyonu 15 kez kullanıp özel mesajı açtın.",
  },
  {
    id: "basement_reward",
    title: "Mahzen Kaşifi",
    lockedTitle: "Gizli Başarım",
    description: "Mahzene ulaşıp özel ödül ekranına eriştin.",
    hidden: true,
  },
  {
    id: "task_completion_rainbow_cat",
    title: "Gökkuşağının Sonunda",
    lockedTitle: "Gizli Başarım",
    description:
      "Bir görevi tamamlayıp gökkuşağı kedisinin kutlamasını gördün.",
    hidden: true,
  },
  {
    id: "attendance_limit_dog",
    title: "Devamsızlık Ustası",
    lockedTitle: "Gizli Başarım",
    description:
      "Yeterince sorumsuz olduğun için tebrikler!",
    hidden: true,
  },
];

type AchievementState = Partial<Record<AchievementId, string>>;

const USER_OBJECT_KEYS = [
  "miodesk_user",
  "currentUser",
  "auth_user",
  "authUser",
  "user",
  "profile",
];

const TOKEN_KEYS = [
  "miodesk_access_token",
  "miodesk_token",
  "accessToken",
  "access_token",
  "authToken",
  "auth_token",
  "jwt",
  "token",
];

const ID_CLAIMS = [
  "sub",
  "nameid",
  "userId",
  "user_id",
  "id",
  "email",
  "username",
  "unique_name",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
];

function safeJsonParse(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function findIdentityInObject(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  for (const key of ID_CLAIMS) {
    const candidate = record[key];

    if (
      typeof candidate === "string" &&
      candidate.trim().length > 0
    ) {
      return `${key}:${candidate.trim()}`;
    }

    if (
      typeof candidate === "number" &&
      Number.isFinite(candidate)
    ) {
      return `${key}:${candidate}`;
    }
  }

  for (const nestedKey of ["user", "profile", "account", "data"]) {
    const nestedIdentity = findIdentityInObject(record[nestedKey]);

    if (nestedIdentity) return nestedIdentity;
  }

  return null;
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

    return decodeURIComponent(
      Array.from(atob(padded))
        .map(
          (character) =>
            `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
        )
        .join(""),
    );
  } catch {
    return null;
  }
}

function findIdentityInToken(token: string | null): string | null {
  if (!token) return null;

  const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
  const parts = cleanToken.split(".");

  if (parts.length !== 3) return null;

  const payloadText = decodeBase64Url(parts[1]);

  if (!payloadText) return null;

  return findIdentityInObject(safeJsonParse(payloadText));
}

function findIdentityInStorage(storage: Storage): string | null {
  for (const key of USER_OBJECT_KEYS) {
    const identity = findIdentityInObject(
      safeJsonParse(storage.getItem(key)),
    );

    if (identity) return identity;
  }

  for (const key of TOKEN_KEYS) {
    const rawValue = storage.getItem(key);
    const tokenIdentity = findIdentityInToken(rawValue);

    if (tokenIdentity) return tokenIdentity;

    const objectIdentity = findIdentityInObject(
      safeJsonParse(rawValue),
    );

    if (objectIdentity) return objectIdentity;
  }

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;

    const rawValue = storage.getItem(key);
    if (!rawValue) continue;

    const tokenIdentity = findIdentityInToken(rawValue);
    if (tokenIdentity) return tokenIdentity;

    const loweredKey = key.toLocaleLowerCase("tr-TR");

    if (
      loweredKey.includes("user") ||
      loweredKey.includes("auth") ||
      loweredKey.includes("profile")
    ) {
      const objectIdentity = findIdentityInObject(
        safeJsonParse(rawValue),
      );

      if (objectIdentity) return objectIdentity;
    }
  }

  return null;
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function getRawOwnerIdentity(): string {
  if (typeof window === "undefined") return "server";

  return (
    findIdentityInStorage(window.localStorage) ??
    findIdentityInStorage(window.sessionStorage) ??
    "anonymous"
  );
}

export function getAchievementOwnerKey(): string {
  return stableHash(
    getRawOwnerIdentity().trim().toLocaleLowerCase("tr-TR"),
  );
}

export function getAchievementStorageKey(): string {
  return `${STORAGE_PREFIX}:${getAchievementOwnerKey()}`;
}

function migrateLegacyStateForCurrentAccount() {
  if (typeof window === "undefined") return;

  const ownerIdentity = getRawOwnerIdentity();

  if (ownerIdentity === "anonymous") return;

  const newStorageKey = getAchievementStorageKey();

  /*
   * Anahtar mevcutsa boş obje olsa bile eski ortak kayıt geri taşınmaz.
   * Bu, sıfırlanan başarımların tekrar kendiliğinden açılmasını engeller.
   */
  if (window.localStorage.getItem(newStorageKey) !== null) return;

  const legacyState = window.localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!legacyState) return;

  window.localStorage.setItem(newStorageKey, legacyState);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function readState(): AchievementState {
  if (typeof window === "undefined") return {};

  migrateLegacyStateForCurrentAccount();

  try {
    const raw = window.localStorage.getItem(
      getAchievementStorageKey(),
    );

    if (!raw) return {};

    const parsed = JSON.parse(raw) as AchievementState;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function dispatchAchievementUpdate() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("miodesk:achievement-updated", {
      detail: { ownerKey: getAchievementOwnerKey() },
    }),
  );
}

function writeState(nextState: AchievementState) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    getAchievementStorageKey(),
    JSON.stringify(nextState),
  );

  dispatchAchievementUpdate();
}

export function unlockAchievement(id: AchievementId) {
  const currentState = readState();

  if (currentState[id]) return false;

  const definition = ACHIEVEMENT_DEFINITIONS.find(
    (achievement) => achievement.id === id,
  );

  const ownerKey = getAchievementOwnerKey();

  currentState[id] = new Date().toISOString();
  writeState(currentState);

  window.dispatchEvent(
    new CustomEvent<AchievementUnlockedDetail>(
      "miodesk:achievement-unlocked",
      {
        detail: {
          id,
          title: definition?.title ?? "Yeni Başarım",
          ownerKey,
        },
      },
    ),
  );

  return true;
}

export function resetCurrentAccountAchievements() {
  if (typeof window === "undefined") return;

  /*
   * Anahtarı silmek yerine kesin olarak boş obje yazıyoruz.
   * Böylece eski ortak kayıt migration ile geri gelemez.
   */
  window.localStorage.setItem(
    getAchievementStorageKey(),
    JSON.stringify({}),
  );

  window.localStorage.removeItem(LEGACY_STORAGE_KEY);

  const relatedSessionKeys = [
    "miodesk_dashboard_cat_clicks",
    "miodesk_notes_horn_clicks",
    "miodesk_settings_easter_egg_progress",
    "miodesk_settings_easter_egg_solved",
    "miodesk_settings_easter_egg_closed",
  ];

  for (const key of relatedSessionKeys) {
    window.sessionStorage.removeItem(key);
  }

  window.sessionStorage.setItem(
    ACHIEVEMENT_RESET_NOTICE_KEY,
    "1",
  );

  window.dispatchEvent(
    new CustomEvent("miodesk:achievement-reset", {
      detail: { ownerKey: getAchievementOwnerKey() },
    }),
  );

  dispatchAchievementUpdate();
}

export function isAchievementUnlocked(id: AchievementId) {
  return Boolean(readState()[id]);
}

export function getAchievementCards(): AchievementCardView[] {
  const state = readState();

  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const unlockedAt = state[definition.id] ?? null;
    const unlocked = Boolean(unlockedAt);

    return {
      ...definition,
      title:
        !unlocked && definition.hidden
          ? definition.lockedTitle ?? "Gizli Başarım"
          : definition.title,
      hint:
        !unlocked && definition.hidden
          ? undefined
          : definition.hint,
      description:
        !unlocked && definition.hidden
          ? ""
          : definition.description,
      unlocked,
      unlockedAt,
    };
  });
}
