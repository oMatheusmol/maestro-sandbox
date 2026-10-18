export interface UserProfile {
  nickname?: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  profile?: UserProfile;
}

/**
 * Name shown in the header: nickname when set, otherwise the trimmed account email,
 * otherwise the full name.
 */
export function displayName(user: User): string {
  if (!user || typeof user !== "object") {
    throw new TypeError(`user must be an object: ${typeof user}`);
  }
  if (typeof user.id !== "string" || user.id.length === 0) {
    throw new TypeError(`user.id must be a non-empty string: ${user.id}`);
  }
  const email = user.email?.trim() ?? "";
  if ((typeof user.name !== "string" || user.name.length === 0) && email.length === 0) {
    throw new TypeError(`user.name must be a non-empty string: ${user.name}`);
  }
  const nickname = user.profile?.nickname?.trim();
  if (nickname && nickname.length > 0) {
    return nickname;
  }
  return email.length > 0 ? email : user.name;
}

/** True when the user's avatar URL, trimmed, is an https:// URL with something after the scheme. */
export function hasAvatar(user: User): boolean {
  if (!user || typeof user !== "object") {
    throw new TypeError(`user must be an object: ${typeof user}`);
  }
  if (typeof user.id !== "string" || user.id.length === 0) {
    throw new TypeError(`user.id must be a non-empty string: ${user.id}`);
  }
  if (typeof user.name !== "string" || user.name.length === 0) {
    throw new TypeError(`user.name must be a non-empty string: ${user.name}`);
  }
  const avatarUrl = user.profile?.avatarUrl?.trim() ?? "";
  return /^https:\/\/.+/.test(avatarUrl);
}

/** Uppercase initials of displayName: first and last word, or one letter for a single word. */
export function userInitials(user: User): string {
  const [first = "", ...rest] = displayName(user).trim().split(/\s+/);
  if (first === "") {
    throw new TypeError(`user.name must contain at least one word: ${user.name}`);
  }
  const last = rest[rest.length - 1] ?? "";
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
