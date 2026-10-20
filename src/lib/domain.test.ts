import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isValidCpf } from "./domain";

describe("CPF validity", () => {
  test("accepts correct check digits with or without formatting", () => {
    assert.equal(isValidCpf("529.982.247-25"), true);
    assert.equal(isValidCpf("52998224725"), true);
  });
  test("rejects incorrect check digits", () => {
    assert.equal(isValidCpf("529.982.247-24"), false);
    assert.equal(isValidCpf("529.982.247-35"), false);
  });
  test("rejects repeated digits and incomplete CPF", () => {
    for (let digit = 0; digit < 10; digit++) assert.equal(isValidCpf(String(digit).repeat(11)), false);
    assert.equal(isValidCpf("5299822472"), false);
    assert.equal(isValidCpf(""), false);
  });
});