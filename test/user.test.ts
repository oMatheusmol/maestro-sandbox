import { describe, expect, it } from "vitest";
import { displayName, isAnonymous } from "../src/user.js";

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

describe("isAnonymous", () => {
  it("is true when the name is blank and no nickname is set", () => {
    expect(isAnonymous({ id: "1", name: "   " })).toBe(true);
  });

  it("is true when the nickname is blank and the name is blank", () => {
    expect(isAnonymous({ id: "1", name: " ", profile: { nickname: "  " } })).toBe(true);
  });

  it("is false when the user has a non-blank name", () => {
    expect(isAnonymous({ id: "1", name: "Ana Souza" })).toBe(false);
  });

  it("is false when a nickname is set even if the name is blank", () => {
    expect(isAnonymous({ id: "1", name: " ", profile: { nickname: "ana" } })).toBe(false);
  });

  it("throws a TypeError when user is not an object", () => {
    expect(() => isAnonymous(null as any)).toThrow(TypeError);
    expect(() => isAnonymous(null as any)).toThrow(/user must be an object/);
  });
});
