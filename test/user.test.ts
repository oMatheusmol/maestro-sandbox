import { describe, expect, it } from "vitest";
import { displayName, userInitials } from "../src/user.js";

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
});

describe("userInitials", () => {
  it("uses the first and last letters of the full name", () => {
    expect(userInitials({ id: "1", name: "Ana Souza" })).toBe("AS");
  });

  it("uses the nickname when set", () => {
    expect(userInitials({ id: "1", name: "Ana Souza", profile: { nickname: "ana" } })).toBe("A");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(userInitials({ id: "1", name: "  Bruno   Lima  " })).toBe("BL");
  });

  it("trims the nickname before taking initials", () => {
    expect(userInitials({ id: "1", name: "Ana Souza", profile: { nickname: "  ana silva  " } })).toBe(
      "AS",
    );
  });

  it("returns one letter for a single word", () => {
    expect(userInitials({ id: "1", name: "Madonna" })).toBe("M");
  });

  it("uppercases lowercase input", () => {
    expect(userInitials({ id: "1", name: "ana souza" })).toBe("AS");
  });

  it("returns an empty string when the name is only whitespace", () => {
    expect(userInitials({ id: "1", name: "   " })).toBe("");
  });

  it("throws when user is not an object", () => {
    expect(() => userInitials(null as any)).toThrow(TypeError);
    expect(() => userInitials(null as any)).toThrow(/user must be an object/);
  });

  it("throws when user.id is not a non-empty string", () => {
    expect(() => userInitials({ id: "", name: "Ana Souza" })).toThrow(TypeError);
    expect(() => userInitials({ id: "", name: "Ana Souza" })).toThrow(
      /user.id must be a non-empty string/,
    );
  });

  it("throws when user.name is not a non-empty string", () => {
    expect(() => userInitials({ id: "1", name: "" })).toThrow(TypeError);
    expect(() => userInitials({ id: "1", name: "" })).toThrow(
      /user.name must be a non-empty string/,
    );
  });
});
