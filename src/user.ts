export interface UserProfile {
  nickname?: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  name: string;
  profile?: UserProfile;
}

/** Name shown in the header: nickname when set, otherwise the full name. */
export function displayName(user: User): string {
  if (!user || typeof user !== "object") {
    throw new TypeError(`user must be an object: ${typeof user}`);
  }
  if (typeof user.id !== "string" || user.id.length === 0) {
    throw new TypeError(`user.id must be a non-empty string: ${user.id}`);
  }
  if (typeof user.name !== "string" || user.name.length === 0) {
    throw new TypeError(`user.name must be a non-empty string: ${user.name}`);
  }
  const nickname = user.profile?.nickname?.trim();
  return nickname && nickname.length > 0 ? nickname : user.name;
}

export function userInitials(user: User): string {
  const name = displayName(user).trim();
  if (!name) return "";
  const words = name.split(/\s+/);
  const first = name.charAt(0);
  const last = words.length > 1 ? words[words.length - 1]?.charAt(0) ?? "" : "";
  return (first + last).toUpperCase();
}
