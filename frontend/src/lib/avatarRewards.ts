import { getAchievementOwnerKey } from "./achievements";

const STORAGE_PREFIX = "miodesk_avatar_collection_reward_v1";

export const AVATAR_REWARD_CHANGE_EVENT =
  "miodesk:avatar-reward-updated";

function rewardStorageKey() {
  return `${STORAGE_PREFIX}:${getAchievementOwnerKey()}`;
}

export function isAvatarRewardUnlocked() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(rewardStorageKey()) !== null;
}

export function unlockAvatarReward() {
  if (typeof window === "undefined") return false;

  const key = rewardStorageKey();

  if (window.localStorage.getItem(key) !== null) {
    return false;
  }

  window.localStorage.setItem(key, new Date().toISOString());

  window.dispatchEvent(
    new CustomEvent(AVATAR_REWARD_CHANGE_EVENT, {
      detail: {
        ownerKey: getAchievementOwnerKey(),
      },
    }),
  );

  return true;
}
