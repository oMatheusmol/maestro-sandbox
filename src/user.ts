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

/** True when the display name is blank, so the user has no visible name. */
export function isAnonymous(user: User): boolean {
  return displayName(user).trim().length === 0;
}
