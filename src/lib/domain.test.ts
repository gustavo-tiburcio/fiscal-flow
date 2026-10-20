import { describe, expect, test } from "bun:test";
import { isValidCpf } from "./domain";

describe("CPF validity", () => {
  test("accepts correct check digits with or without formatting", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  test("rejects incorrect check digits", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("529.982.247-35")).toBe(false);
  });
  test("rejects repeated digits and incomplete CPF", () => {
    for (let digit = 0; digit < 10; digit++) expect(isValidCpf(String(digit).repeat(11))).toBe(false);
    expect(isValidCpf("5299822472")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});