/** Optional profile information for a user including nickname and avatar URL. */
export interface UserProfile {
  nickname?: string;
  avatarUrl?: string;
}

/** A user with an ID, name, and optional profile information. */
export interface User {
  id: string;
  name: string;
  profile?: UserProfile;
}

/** Name shown in the header: nickname when set, otherwise the full name. */
export function displayName(user: User): string {
  const nickname = user.profile?.nickname?.trim();
  return nickname && nickname.length > 0 ? nickname : user.name;
}
