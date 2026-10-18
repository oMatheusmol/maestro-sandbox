import { describe, expect, it } from "vitest";
import { displayName, hasAvatar, userInitials, type User } from "../src/user.js";

describe("displayName", () => {
  it("prefers the nickname", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "ana" } })).toBe("ana");
  });

  it("falls back to the name when the nickname is empty", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: {} })).toBe("Ana Souza");
  });

  it("falls back to the name when the user has no profile", () => {
    expect(displayName({ id: "42", name: "Bruno Lima" })).toBe("Bruno Lima");
  });

  it("falls back to the account email when the user has no profile", () => {
    expect(displayName({ id: "42", name: "Bruno Lima", email: "bruno@example.com" })).toBe(
      "bruno@example.com",
    );
  });

  it("falls back to the account email when the nickname is empty", () => {
    expect(
      displayName({ id: "1", name: "Ana Souza", email: "ana@example.com", profile: { nickname: " " } }),
    ).toBe("ana@example.com");
  });

  it("prefers the nickname over the account email", () => {
    expect(
      displayName({ id: "1", name: "Ana Souza", email: "ana@example.com", profile: { nickname: "ana" } }),
    ).toBe("ana");
  });

  it("trims leading whitespace from nickname", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "  ana" } })).toBe("ana");
  });

  it("trims trailing whitespace from nickname", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "ana  " } })).toBe("ana");
  });

  it("trims both leading and trailing whitespace from nickname", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "  Ana  " } })).toBe("Ana");
  });

  it("falls back to the name when nickname is only spaces", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "   " } })).toBe("Ana Souza");
  });

  it("falls back to the name when nickname is only a single space", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: " " } })).toBe("Ana Souza");
  });

  it("falls back to the name when nickname contains only tabs", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "\t\t" } })).toBe("Ana Souza");
  });

  it("falls back to the name when nickname contains only newlines", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "\n\n" } })).toBe("Ana Souza");
  });

  it("falls back to the name when nickname contains mixed whitespace", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: " \t\n " } })).toBe("Ana Souza");
  });

  it("preserves internal whitespace in nickname", () => {
    expect(displayName({ id: "1", name: "Ana Souza", profile: { nickname: "  Ana Silva  " } })).toBe("Ana Silva");
  });

  it("throws when user is not an object", () => {
    expect(() => displayName(null as any)).toThrow(TypeError);
    expect(() => displayName(null as any)).toThrow(/user must be an object/);
  });

  it("throws when user.id is not a non-empty string", () => {
    expect(() => displayName({ id: "", name: "Ana Souza" })).toThrow(TypeError);
    expect(() => displayName({ id: "", name: "Ana Souza" })).toThrow(
      /user.id must be a non-empty string/,
    );
  });

  it("throws when user.name is not a non-empty string", () => {
    expect(() => displayName({ id: "1", name: "" })).toThrow(TypeError);
    expect(() => displayName({ id: "1", name: "" })).toThrow(
      /user.name must be a non-empty string/,
    );
  });

  it("falls back to the account email when the name is empty", () => {
    expect(displayName({ id: "1", name: "", email: "ana@example.com" })).toBe("ana@example.com");
  });

  it("trims the account email", () => {
    expect(displayName({ id: "1", name: "", email: "  ana@example.com " })).toBe("ana@example.com");
  });

  it("throws when the name is empty and the email is only spaces", () => {
    expect(() => displayName({ id: "1", name: "", email: "   " })).toThrow(
      /user.name must be a non-empty string/,
    );
  });
});

describe("userInitials", () => {
  it("returns the initials of the full name", () => {
    expect(userInitials({ id: "1", name: "Ana Souza" })).toBe("AS");
  });

  it("uses the nickname when set", () => {
    expect(userInitials({ id: "1", name: "Ana Souza", profile: { nickname: "ana" } })).toBe("A");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(userInitials({ id: "1", name: "  ana   silva  " })).toBe("AS");
  });

  it("returns one letter for a single word", () => {
    expect(userInitials({ id: "1", name: "Ana" })).toBe("A");
  });

  it("throws when the name has no word", () => {
    expect(() => userInitials({ id: "1", name: "   " })).toThrow(TypeError);
    expect(() => userInitials({ id: "1", name: "   " })).toThrow(
      /user.name must contain at least one word/,
    );
  });

  it("throws the same TypeError as displayName for an invalid user", () => {
    expect(() => userInitials(null as any)).toThrow(/user must be an object/);
    expect(() => userInitials({ id: "", name: "Ana Souza" })).toThrow(
      /user.id must be a non-empty string/,
    );
    expect(() => userInitials({ id: "1", name: "" })).toThrow(
      /user.name must be a non-empty string/,
    );
  });
});

describe("hasAvatar", () => {
  it("returns false when the user has no profile", () => {
    expect(hasAvatar({ id: "1", name: "Ana Souza" })).toBe(false);
  });

  it("returns false when the avatar URL is empty", () => {
    expect(hasAvatar({ id: "1", name: "Ana Souza", profile: { avatarUrl: "" } })).toBe(false);
  });

  it("returns false when the avatar URL is only whitespace", () => {
    expect(hasAvatar({ id: "1", name: "Ana Souza", profile: { avatarUrl: "  \t\n " } })).toBe(false);
  });

  it("returns false for an http URL", () => {
    expect(
      hasAvatar({ id: "1", name: "Ana Souza", profile: { avatarUrl: "http://example.com/a.png" } }),
    ).toBe(false);
  });

  it("returns true for an https URL", () => {
    expect(
      hasAvatar({ id: "1", name: "Ana Souza", profile: { avatarUrl: "https://example.com/a.png" } }),
    ).toBe(true);
  });

  it("returns true for an https URL with surrounding whitespace", () => {
    expect(
      hasAvatar({ id: "1", name: "Ana Souza", profile: { avatarUrl: "  https://example.com/a.png " } }),
    ).toBe(true);
  });

  it("returns false when the URL is only the https:// scheme", () => {
    expect(hasAvatar({ id: "1", name: "Ana Souza", profile: { avatarUrl: "https://" } })).toBe(false);
  });

  it("throws the same TypeError as displayName for an invalid user", () => {
    expect(() => hasAvatar(null as unknown as User)).toThrow(TypeError);
    expect(() => hasAvatar(null as unknown as User)).toThrow(/user must be an object/);
    expect(() => hasAvatar({ id: "", name: "Ana Souza" })).toThrow(
      /user.id must be a non-empty string/,
    );
    expect(() => hasAvatar({ id: "1", name: "" })).toThrow(/user.name must be a non-empty string/);
  });
});
