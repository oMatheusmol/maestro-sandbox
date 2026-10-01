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
  return user.profile!.nickname ?? user.name;
}
